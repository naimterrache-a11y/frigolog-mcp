// ═══════════════════════════════════════════════════════════════════════
// MCP privé — un seul déploiement a le droit de servir des données client
// ═══════════════════════════════════════════════════════════════════════
// Constaté le 2026-08-04 : ce dépôt est déployé par DEUX projets Vercel.
//
//   frigologmcp   — le vrai. Cible du rewrite frigolog.fr/api/mcp, cité dans
//                   le README, INTEGRATION_ROADMAP, server.json, et défaut de
//                   MCP_URL dans la suite de tests.
//   frigolog-mcp  — un doublon. AUCUNE référence nulle part dans le dépôt.
//                   Nommé d'après le repo : créé tout seul par un déploiement.
//
// Les deux répondent, à l'identique, sur le même commit. Pour le MCP public
// c'est de la duplication inoffensive — les 19 outils ne servent que de la
// donnée réglementaire publique, et deux copies d'une vérité publique restent
// une vérité publique.
//
// Pour le MCP PRIVÉ, la même duplication devient un piège : l'endpoint
// existerait sur les deux hôtes, et selon lequel porte SUPABASE_JWT_SECRET,
// l'un servirait les relevés d'un client et l'autre renverrait des erreurs.
// Sans que rien ne le dise, et sans qu'on sache lequel un intégrateur a
// recopié dans sa configuration.
//
// ── La règle, et pourquoi elle est déclarative ─────────────────────────
// Le MCP privé ne sert QUE sur un hôte explicitement déclaré, par la variable
// d'environnement MCP_PRIVE_HOTES. Pas de variable = pas de service. Un
// déploiement doit donc DIRE qu'il est celui qui a le droit ; il ne peut plus
// l'être par accident.
//
// C'est volontairement plus fort que « il lui manquera le secret de toute
// façon » : le jour où quelqu'un recopiera toutes les variables d'un projet
// vers l'autre pour dépanner, le secret suivra — cette déclaration-là, non.
//
// Et ça survit à un troisième déploiement créé dans six mois par quelqu'un qui
// n'aura jamais lu ce fichier : par défaut, il ne servira rien.

export const VAR_HOTES = 'MCP_PRIVE_HOTES';

/**
 * Hôtes autorisés, déclarés en clair et séparés par des virgules.
 * Ex. `MCP_PRIVE_HOTES=frigolog.fr,frigologmcp.vercel.app`
 */
export function hotesAutorises(): string[] {
  return (process.env[VAR_HOTES] || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Normalise l'en-tête Host : on retire le port, on met en minuscules.
 * `Host` peut porter un port (`localhost:3000`), et sa casse n'est pas
 * garantie — comparer des chaînes brutes ferait rater un hôte légitime pour
 * une majuscule.
 */
export function hoteDeLaRequete(entetes: Record<string, unknown>): string {
  const brut = entetes['x-forwarded-host'] ?? entetes['host'];
  const val = Array.isArray(brut) ? brut[0] : brut;
  if (typeof val !== 'string') return '';
  return val.trim().toLowerCase().split(':')[0];
}

/**
 * Ce déploiement a-t-il le droit de servir des données client ?
 *
 * ⚠️ Ferme par défaut. Aucune variable, variable vide, hôte inconnu : non.
 *    Un « on autorise tout si rien n'est déclaré » transformerait un oubli de
 *    configuration en autorisation — c'est-à-dire exactement le contraire de
 *    ce que ce fichier existe pour empêcher.
 *
 * ⚠️ On lit `x-forwarded-host` EN PREMIER. Derrière le rewrite de frigolog.fr,
 *    `host` porte le nom du déploiement Vercel ; c'est `x-forwarded-host` qui
 *    porte le nom demandé par le client. Les deux doivent donc figurer dans la
 *    déclaration, et c'est le nom demandé qui fait foi.
 */
export function deploiementAutorise(entetes: Record<string, unknown>): boolean {
  const autorises = hotesAutorises();
  if (autorises.length === 0) return false;
  const hote = hoteDeLaRequete(entetes);
  return hote.length > 0 && autorises.includes(hote);
}

/**
 * Ce qu'on répond à un déploiement non déclaré. Explicite : le message
 * s'adresse à nous, pas à un attaquant — il n'y a rien à protéger ici, et un
 * « 404 » muet nous coûterait une heure le jour où ça arrivera.
 */
export const MESSAGE_HOTE_REFUSE =
  `Ce déploiement n'est pas déclaré pour le MCP privé. Ajoutez son hôte à ${VAR_HOTES}, ` +
  'ou utilisez le déploiement canonique. Le MCP public, lui, reste servi normalement.';
