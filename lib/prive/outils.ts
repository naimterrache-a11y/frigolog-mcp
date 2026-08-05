// ═══════════════════════════════════════════════════════════════════════
// MCP privé — les outils de lecture
// ═══════════════════════════════════════════════════════════════════════
// Chaque outil reçoit un `Contexte` et RIEN d'autre. Il n'a ni l'URL de la
// base, ni la clé anon, ni le jeton : il ne peut pas construire une requête à
// côté. L'isolation ne dépend donc pas de ce que chaque outil pense à filtrer —
// elle est tenue par le claim, c'est-à-dire par Postgres.
//
// Conséquence à garder en tête en lisant ce fichier : AUCUN `select` ci-dessous
// ne filtre par établissement, et c'est correct. Un outil qui « oublierait » son
// filtre ne renverrait pas les lignes du voisin, il n'en renverrait aucune.
//
// ── Ce qui n'entrera jamais ici ────────────────────────────────────────
// Aucune donnée de santé (décision CEO D2, RGPD art. 9). Aucun secret : ni
// `pin`, ni `pin_hash`, ni mot de passe — ces colonnes sont de toute façon
// révoquées pour anon, mais on ne les demande pas non plus.
//
// ── Pas de message commercial ──────────────────────────────────────────
// Le MCP public colle un `conseil_pratique` + un lien sur chacune de ses 19
// réponses : il s'adresse à des inconnus qui découvrent Frigolog. Ici l'appelant
// est un client qui PAIE et qui lit ses propres relevés. Lui servir « essai
// gratuit 14 jours » collé à ses températures serait au mieux ridicule.

import type { Contexte } from './contexte.js';

const LIMITE_DEFAUT = 20;
const LIMITE_MAX = 100;

// Un entier borné, quoi qu'envoie l'appelant. Un `limit` négatif ou absurde
// part sinon tel quel dans l'URL PostgREST.
function borne(v: unknown, defaut = LIMITE_DEFAUT): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return defaut;
  return Math.min(Math.trunc(n), LIMITE_MAX);
}

// Nombre de jours en arrière, borné à un an.
function depuisIso(jours: unknown, defaut = 7): string {
  const n = typeof jours === 'number' ? jours : parseInt(String(jours ?? ''), 10);
  const j = Number.isFinite(n) && n >= 1 ? Math.min(Math.trunc(n), 365) : defaut;
  return new Date(Date.now() - j * 86_400_000).toISOString();
}

export interface OutilPrive {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** 'read' ou 'write' — comparé aux permissions de la clé avant exécution. */
  permission: 'read' | 'write';
  executer: (ctx: Contexte, args: Record<string, unknown>) => Promise<unknown>;
}

export const OUTILS_PRIVES: OutilPrive[] = [
  {
    name: 'lister_mes_equipements',
    description:
      "Liste les équipements de froid et de cuisson de VOTRE établissement (nom, zone, type, plage de température attendue). Utile pour savoir de quoi on parle avant de demander des relevés.",
    inputSchema: { type: 'object', properties: {} },
    permission: 'read',
    async executer(ctx) {
      const lignes = await ctx.lire<Record<string, unknown>>(
        'equipments?select=id,name,type,zone,min,max&order=zone,name',
      );
      return { equipements: lignes, total: lignes.length };
    },
  },

  {
    name: 'mes_derniers_releves_temperature',
    description:
      "Renvoie les derniers relevés de température de VOTRE établissement, du plus récent au plus ancien : valeur, moment de la journée, équipement concerné, et si le relevé était conforme à la plage attendue.",
    inputSchema: {
      type: 'object',
      properties: {
        limite: { type: 'number', description: 'Nombre de relevés (1 à 100, défaut 20).' },
        jours: { type: 'number', description: "Fenêtre en jours (défaut 7, max 365)." },
      },
    },
    permission: 'read',
    async executer(ctx, args) {
      // L'embed `equipments(...)` traverse la clé étrangère : la RLS de
      // temperature_logs passe par equipment_id, donc rien ne fuit ici.
      const lignes = await ctx.lire<Record<string, unknown>>(
        'temperature_logs?select=temperature,moment,is_compliant,corrective_action,created_at,equipments(name,zone,min,max)' +
          `&created_at=gte.${depuisIso(args.jours)}` +
          `&order=created_at.desc&limit=${borne(args.limite)}`,
      );
      const nonConformes = lignes.filter((l) => l.is_compliant === false).length;
      return { releves: lignes, total: lignes.length, non_conformes: nonConformes };
    },
  },

  {
    name: 'mes_nettoyages_recents',
    description:
      "Renvoie les nettoyages enregistrés dans VOTRE établissement : quel poste, à quel moment de la journée, quand. Permet de répondre à « est-ce que la hotte a été faite cette semaine ? ».",
    inputSchema: {
      type: 'object',
      properties: {
        limite: { type: 'number', description: 'Nombre de lignes (1 à 100, défaut 20).' },
        jours: { type: 'number', description: 'Fenêtre en jours (défaut 7, max 365).' },
      },
    },
    permission: 'read',
    async executer(ctx, args) {
      const lignes = await ctx.lire<Record<string, unknown>>(
        'cleaning_logs?select=post_name,moment,notes,created_at' +
          `&created_at=gte.${depuisIso(args.jours)}` +
          `&order=created_at.desc&limit=${borne(args.limite)}`,
      );
      return { nettoyages: lignes, total: lignes.length };
    },
  },

  {
    name: 'mes_receptions_recentes',
    description:
      "Renvoie les réceptions de marchandises de VOTRE établissement : fournisseur, produit, numéro de lot, DLC, température à réception. C'est la matière d'une traçabilité amont en cas de rappel produit.",
    inputSchema: {
      type: 'object',
      properties: {
        limite: { type: 'number', description: 'Nombre de lignes (1 à 100, défaut 20).' },
        jours: { type: 'number', description: 'Fenêtre en jours (défaut 30, max 365).' },
      },
    },
    permission: 'read',
    async executer(ctx, args) {
      const lignes = await ctx.lire<Record<string, unknown>>(
        'reception_logs?select=supplier,product_name,category,lot_number,dlc,temperature,non_conformities,created_at' +
          `&created_at=gte.${depuisIso(args.jours, 30)}` +
          `&order=created_at.desc&limit=${borne(args.limite)}`,
      );
      return { receptions: lignes, total: lignes.length };
    },
  },

  {
    name: 'mes_postes_de_nettoyage',
    description:
      "Liste les postes du plan de nettoyage de VOTRE établissement, avec leur cadence et la date du dernier nettoyage enregistré. Sert à repérer ce qui est en retard.",
    inputSchema: { type: 'object', properties: {} },
    permission: 'read',
    async executer(ctx) {
      const lignes = await ctx.lire<Record<string, unknown>>(
        'cleaning_stations?select=name,zone,frequency,recurrence_days,last_cleaned_at,next_due_at&order=zone,name',
      );
      const maintenant = Date.now();
      const enRetard = lignes.filter((l) => {
        const d = l.next_due_at;
        return typeof d === 'string' && Date.parse(d) < maintenant;
      }).length;
      return { postes: lignes, total: lignes.length, en_retard: enRetard };
    },
  },
];

export const OUTIL_PAR_NOM: Record<string, OutilPrive> = Object.fromEntries(
  OUTILS_PRIVES.map((o) => [o.name, o]),
);
