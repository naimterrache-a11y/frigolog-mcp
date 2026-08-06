// ═══════════════════════════════════════════════════════════════════════
// MCP privé — le point de passage obligé
// ═══════════════════════════════════════════════════════════════════════
// Tout ce que le MCP privé lit passe par ici, et un outil ne reçoit JAMAIS
// autre chose qu'un `Contexte`. Il n'a accès ni à l'URL Supabase, ni à la clé
// anon, ni au jeton : il ne peut donc pas construire une requête à côté.
//
// ── Pourquoi un objet plutôt qu'une fonction utilitaire ────────────────
// La contrainte à tenir est « jamais les données d'un établissement à un
// autre », et elle doit être TESTABLE — pas surveillée outil par outil. Un
// helper qu'on invite les outils à utiliser se fait oublier par le vingtième
// outil écrit un mardi soir. Un objet qui est la seule chose qu'ils reçoivent
// ne s'oublie pas : il n'y a rien d'autre à appeler.
//
// Ce que ça permet concrètement : un test qui prend une clé de l'établissement
// A, appelle TOUS les outils, et vérifie qu'aucune ligne de B n'apparaît — sans
// avoir à relire chaque outil. Et si un outil oublie son filtre, il ne renvoie
// pas les lignes du voisin : il n'en renvoie aucune, parce que c'est Postgres
// qui isole, à travers le claim.
//
// ── Ce que le contexte NE fait pas ─────────────────────────────────────
// Il n'écrit pas. L'écriture viendra, elle exigera `permissions` contenant
// 'write', et elle passera par une méthode distincte — pour qu'un outil de
// lecture ne puisse pas devenir un outil d'écriture par inadvertance de frappe.

import { empreinteCle, formeValide } from './cles.js';
import { bornerChemin } from './borne.js';
import { signerJetonEtablissement } from './jwt.js';

export type Permission = 'read' | 'write';

export interface Contexte {
  readonly establishmentId: string;
  readonly permissions: readonly Permission[];
  /** Vrai si la clé porte 'write'. Les outils d'écriture le vérifient. */
  peutEcrire(): boolean;
  /**
   * Lecture PostgREST bornée à l'établissement de la clé — par le claim, pas
   * par un filtre applicatif. `chemin` est une requête PostgREST sans le
   * préfixe, ex. `temperature_logs?select=id,value&order=created_at.desc`.
   */
  lire<T = unknown>(chemin: string): Promise<T[]>;
}

const TIMEOUT_MS = 8000;

function env(nom: string): string {
  const v = process.env[nom];
  if (!v) throw new Error(`${nom} absent — le MCP privé ne peut pas interroger la base`);
  return v;
}

// ── L'échec est TOUJOURS le même ───────────────────────────────────────
// Clé inexistante, révoquée, expirée, malformée : une seule et même réponse.
// Distinguer « cette clé n'existe pas » de « cette clé est révoquée » dirait à
// un attaquant lesquelles de ses tentatives ont touché quelque chose. C'est la
// même règle que sur les liens d'invitation de l'app.
export class CleRefusee extends Error {
  constructor() {
    super('Clé API invalide ou révoquée');
    this.name = 'CleRefusee';
  }
}

async function appelRest(chemin: string, entetes: Record<string, string>, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${env('SUPABASE_URL')}/rest/v1/${chemin}`, {
      ...init,
      headers: { apikey: env('SUPABASE_ANON_KEY'), ...entetes, ...(init?.headers as object) },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

interface LigneCle {
  establishment_id: string;
  permissions: string[];
}

/**
 * Résout une clé brute en contexte. C'est la SEULE fabrique de `Contexte` —
 * il n'existe aucun autre chemin pour en obtenir un, et c'est volontaire.
 *
 * ⚠️ La clé brute ne quitte jamais cette fonction. On envoie son EMPREINTE à
 *    Postgres, jamais elle : un paramètre de requête finit dans
 *    pg_stat_statements et dans les logs, c'est-à-dire en clair, à l'endroit
 *    précis où on a juré de ne jamais l'écrire.
 */
export async function contextePourCle(cleBrute: string): Promise<Contexte> {
  if (!formeValide(cleBrute)) throw new CleRefusee();

  const empreinte = empreinteCle(cleBrute);
  const anon = env('SUPABASE_ANON_KEY');

  const res = await appelRest('rpc/mcp_resolve_api_key', {
    Authorization: `Bearer ${anon}`,
    'Content-Type': 'application/json',
  }, {
    method: 'POST',
    body: JSON.stringify({ p_key_hash: empreinte }),
  });

  if (!res.ok) throw new CleRefusee();
  const lignes = (await res.json().catch(() => [])) as LigneCle[];
  const ligne = Array.isArray(lignes) ? lignes[0] : undefined;
  if (!ligne?.establishment_id) throw new CleRefusee();

  const permissions = (ligne.permissions || []).filter(
    (p): p is Permission => p === 'read' || p === 'write',
  );
  // Une clé dont AUCUNE permission n'est reconnue ne vaut pas une clé en
  // lecture seule : elle vaut un refus. Retomber sur 'read' transformerait une
  // donnée corrompue en autorisation.
  if (permissions.length === 0) throw new CleRefusee();

  // Marque l'usage sans jamais faire attendre l'appelant, et sans jamais faire
  // échouer une requête légitime parce qu'une statistique n'a pas pu s'écrire.
  void appelRest('rpc/mcp_touch_api_key', {
    Authorization: `Bearer ${anon}`,
    'Content-Type': 'application/json',
  }, {
    method: 'POST',
    body: JSON.stringify({ p_key_hash: empreinte }),
  }).catch(() => { /* non bloquant, par construction */ });

  return construireContexte(ligne.establishment_id, permissions);
}

function construireContexte(establishmentId: string, permissions: Permission[]): Contexte {
  return {
    establishmentId,
    permissions,
    peutEcrire: () => permissions.includes('write'),

    async lire<T>(chemin: string): Promise<T[]> {
      // Le jeton est signé à chaque appel plutôt que gardé : il vit 5 minutes,
      // et une requête MCP dure moins d'une seconde. Rien à faire expirer,
      // rien à rafraîchir, rien à garder en mémoire entre deux invocations.
      const jeton = signerJetonEtablissement(establishmentId);
      const res = await appelRest(bornerChemin(chemin, establishmentId), {
        Authorization: `Bearer ${jeton}`,
      });

      if (!res.ok) {
        // 401 ici ne peut vouloir dire qu'une chose : PostgREST refuse notre
        // signature, donc SUPABASE_JWT_SECRET diverge de celui du projet
        // Supabase. Le dire, plutôt que de rendre une liste vide qui se lirait
        // « ce client n'a aucune donnée ».
        if (res.status === 401) {
          throw new Error(
            'PostgREST refuse la signature du MCP — SUPABASE_JWT_SECRET incohérent avec le projet Supabase',
          );
        }
        throw new Error(`Lecture impossible (HTTP ${res.status})`);
      }
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? (json as T[]) : [];
    },
  };
}

/**
 * Fabrique un contexte SANS passer par la base. Réservé aux tests : c'est le
 * seul moyen d'exercer les outils sans clé réelle. Exporté sous un nom qui ne
 * laisse aucun doute sur ce qu'il fait dans du code de production.
 */
export function contexteDeTestSansVerification(
  establishmentId: string,
  permissions: Permission[] = ['read'],
): Contexte {
  return construireContexte(establishmentId, permissions);
}
