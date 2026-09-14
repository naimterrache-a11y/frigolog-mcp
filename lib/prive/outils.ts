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

import type { Contexte, Lecture } from './contexte.js';
import { PLAFOND_LECTURE } from './contexte.js';
import { jugerReleve, STATUT_TEMPERATURE } from './conformite.js';

const LIMITE_DEFAUT = 20;
const LIMITE_MAX = 100;

// ── Une réponse amputée ne se présente JAMAIS comme complète ───────────
// Chaque liste renvoyée dit combien il en existe sur la période, et si elle
// est tronquée, elle le dit en toutes lettres — dans un champ que l'assistant
// ne peut pas manquer. Avant, `total` valait le nombre de lignes RENVOYÉES :
// « total: 20 » pour une semaine qui en comptait 140. Un assistant en tirait
// « vous avez fait 20 relevés », ou pire, « aucune non-conformité ».
function signalerTroncature(
  renvoyes: number,
  lecture: Lecture<unknown>,
  quoi: string,
): { tronque: boolean; avertissement?: string } {
  if (lecture.total !== null && renvoyes >= lecture.total) return { tronque: false };
  if (lecture.total === null) {
    return {
      tronque: true,
      avertissement: `Liste possiblement INCOMPLÈTE (${quoi} : ${renvoyes} dans cette réponse) : le nombre `
        + `total n'a pas pu être vérifié. Ne présentez pas cette liste comme exhaustive.`,
    };
  }
  return {
    tronque: true,
    avertissement: `Liste TRONQUÉE (${quoi} : ${renvoyes} dans cette réponse sur ${lecture.total} sur la période). `
      + `N'en concluez rien sur ce qui n'est pas listé ; augmentez « limite » (max ${LIMITE_MAX}) `
      + `ou réduisez « jours » pour tout voir.`,
  };
}

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
      const lecture = await ctx.lire<Record<string, unknown>>(
        'equipments?select=id,name,type,zone,min,max&order=zone,name,id',
      );
      const n = lecture.lignes.length;
      return {
        equipements: lecture.lignes,
        total: lecture.total,
        ...signalerTroncature(n, lecture, 'équipements'),
      };
    },
  },

  {
    name: 'mes_derniers_releves_temperature',
    description:
      "Renvoie les derniers relevés de température de VOTRE établissement, du plus récent au plus ancien : valeur, moment de la journée, équipement concerné, et la conformité jugée contre la plage de l'équipement (conforme, hors_plage, ou seuil_inconnu si l'équipement n'a pas de plage). Les compteurs (non_conformes, seuil_inconnu) portent sur TOUTE la période, pas seulement sur les relevés listés.",
    inputSchema: {
      type: 'object',
      properties: {
        limite: { type: 'number', description: 'Nombre de relevés listés (1 à 100, défaut 20).' },
        jours: { type: 'number', description: "Fenêtre en jours (défaut 7, max 365)." },
      },
    },
    permission: 'read',
    async executer(ctx, args) {
      // L'embed `equipments(...)` porte la plage : sans min/max, la conformité
      // ne se juge pas. Toute la période est lue (paginée), parce que les
      // compteurs doivent parler de la période et non des N relevés affichés.
      // `is_compliant` n'est PAS demandé : colonne à l'abandon, NULL sur plus
      // d'un relevé sur deux (cf. lib/prive/conformite.ts).
      const lecture = await ctx.lire<Record<string, unknown>>(
        'temperature_logs?select=temperature,moment,corrective_action,created_at,equipments(name,zone,min,max)' +
          `&created_at=gte.${depuisIso(args.jours)}` +
          '&order=created_at.desc,id.desc',
        { plafond: PLAFOND_LECTURE },
      );
      const juges = lecture.lignes.map((l) => ({
        ...l,
        conformite: jugerReleve(l, l.equipments as { min?: unknown; max?: unknown } | null),
      }));
      const horsPlage = juges.filter((l) => l.conformite === STATUT_TEMPERATURE.HORS_PLAGE).length;
      const seuilInconnu = juges.filter((l) => l.conformite === STATUT_TEMPERATURE.SEUIL_INCONNU).length;

      const releves = juges.slice(0, borne(args.limite));
      return {
        releves,
        renvoyes: releves.length,
        total_sur_la_periode: lecture.total,
        ...signalerTroncature(releves.length, lecture, 'relevés'),
        non_conformes: horsPlage,
        seuil_inconnu: seuilInconnu,
        compteurs_complets: lecture.complete,
        ...(lecture.complete ? {} : {
          avertissement_compteurs:
            `Compteurs PARTIELS : calculés sur ${juges.length} relevés lus`
            + (lecture.total !== null ? ` sur ${lecture.total}` : '')
            + '. Réduisez « jours » pour un décompte exact.',
        }),
      };
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
      // Le nom du poste vit dans `cleaning_stations` : `post_name` est vide sur
      // tous les nettoyages depuis juillet 2026. On lit la jointure d'abord et
      // la colonne héritée en repli, pour les nettoyages plus anciens — le même
      // ordre que l'assistant, le Mode contrôle et le rapport public de l'app.
      // L'embed sert AUSSI de borne (PROD-08, cf. lib/prive/borne.ts).
      const lecture = await ctx.lire<Record<string, unknown>>(
        'cleaning_logs?select=post_name,moment,notes,created_at,cleaning_stations(name)' +
          `&created_at=gte.${depuisIso(args.jours)}` +
          '&order=created_at.desc,id.desc',
        { plafond: borne(args.limite) },
      );
      const nettoyages = lecture.lignes.map((l) => {
        const poste = (l.cleaning_stations as { name?: unknown } | null)?.name;
        return {
          poste: (typeof poste === 'string' && poste) || (typeof l.post_name === 'string' && l.post_name) || null,
          moment: l.moment,
          notes: l.notes,
          created_at: l.created_at,
        };
      });
      return {
        nettoyages,
        renvoyes: nettoyages.length,
        total_sur_la_periode: lecture.total,
        ...signalerTroncature(nettoyages.length, lecture, 'nettoyages'),
      };
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
      const lecture = await ctx.lire<Record<string, unknown>>(
        'reception_logs?select=supplier,product_name,category,lot_number,dlc,temperature,non_conformities,created_at' +
          `&created_at=gte.${depuisIso(args.jours, 30)}` +
          '&order=created_at.desc,id.desc',
        { plafond: borne(args.limite) },
      );
      const n = lecture.lignes.length;
      return {
        receptions: lecture.lignes,
        renvoyes: n,
        total_sur_la_periode: lecture.total,
        ...signalerTroncature(n, lecture, 'réceptions'),
      };
    },
  },

  {
    name: 'mes_postes_de_nettoyage',
    description:
      "Liste les postes du plan de nettoyage de VOTRE établissement, avec leur cadence et la date du dernier nettoyage enregistré. Sert à repérer ce qui est en retard.",
    inputSchema: { type: 'object', properties: {} },
    permission: 'read',
    async executer(ctx) {
      const lecture = await ctx.lire<Record<string, unknown>>(
        'cleaning_stations?select=name,zone,frequency,recurrence_days,last_cleaned_at,next_due_at&order=zone,name,id',
      );
      const maintenant = Date.now();
      const enRetard = lecture.lignes.filter((l) => {
        const d = l.next_due_at;
        return typeof d === 'string' && Date.parse(d) < maintenant;
      }).length;
      return {
        postes: lecture.lignes,
        total: lecture.total,
        en_retard: enRetard,
        ...signalerTroncature(lecture.lignes.length, lecture, 'postes'),
      };
    },
  },
];

export const OUTIL_PAR_NOM: Record<string, OutilPrive> = Object.fromEntries(
  OUTILS_PRIVES.map((o) => [o.name, o]),
);
