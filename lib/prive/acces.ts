// ═══════════════════════════════════════════════════════════════════════
// MCP privé — qui a encore le droit de lire son établissement
// ═══════════════════════════════════════════════════════════════════════
// Module PUR : aucun réseau, aucune base, aucune lecture d'env. Comme
// `cles.ts`, et pour la même raison : la suite de tests de ce dépôt est du Node
// nu, et un garde qu'on ne peut pas exercer ne garde rien.
//
// ⚠️ FICHIER MIROIR de `src/lib/billing.js` dans le dépôt `frigolog`
//    (fonctions `isPaywalled` / `getTrialState`). Les deux dépôts doivent
//    rendre le MÊME verdict sur le même établissement. S'ils divergent, un
//    client voit son écran bloqué et son assistant IA répondre quand même —
//    ou l'inverse, ce qui est pire : un client qui paie et à qui on coupe l'IA.
//
//    Ils ne peuvent pas partager de fichier (deux dépôts, deux déploiements).
//    Le lien est donc le même qu'entre `cles.ts` et `api/_lib/clesMcp.js` : un
//    VECTEUR DE TEST partagé, des cas figés assertés des deux côtés. Voir
//    `VECTEURS_ACCES` plus bas, `tests/prive.test.mjs` ici, et
//    `tests/billingAccess.test.mjs` là-bas.
//
// ── Pourquoi ce fichier existe ─────────────────────────────────────────
//
// Revue adverse du 2026-10-15, sur la base de PRODUCTION : une clé active
// appartenait à un établissement sans abonnement dont l'essai s'était terminé
// le 2026-05-20. Cinq mois sans payer, la clé fonctionnait toujours. Le paywall
// bloquait bien l'écran (`App.jsx` redirige hors de `/parametres`), mais le MCP
// privé le contournait entièrement : `mcp_resolve_api_key` ne regardait ni
// `stripe_subscription_status`, ni `trial_ends_at`.
//
// Décision de Naïm, 2026-10-15 : couper à l'impayé, avec un message qui dit
// pourquoi et un lien cliquable pour réactiver. Pas un 401 muet.
//
// ── Ce que ce fichier NE décide PAS ────────────────────────────────────
//
// Il ne juge ni la clé (forme, empreinte, révocation, expiration : `cles.ts` et
// la fonction SQL), ni les permissions. Il répond à une seule question : cet
// établissement a-t-il encore un compte actif ?

/** Les faits de facturation, tels que la base les sert. Aucun jugement. */
export interface FaitsAcces {
  readonly is_demo?: boolean | null;
  readonly is_test?: boolean | null;
  readonly account_type?: string | null;
  readonly stripe_subscription_status?: string | null;
  readonly trial_ends_at?: string | null;
}

// Les statuts Stripe qui disent « ton moyen de paiement », pas « ton droit
// d'accès ». Stripe relance la carte pendant ~3 semaines avant d'abandonner ;
// pendant ce temps le client reste client. Ce qui coupe, c'est l'abandon
// (`unpaid`, `canceled`), pas la première tentative refusée.
//
// `incomplete` : un 3-D Secure non terminé laisse l'abonnement dans cet état.
// Le geste attendu est de retourner finir le paiement, pas de racheter.
//
// Incident fondateur, côté app : la gérante du Mafé (FRIG-00276), le
// 2026-08-19. Elle avait payé juillet, sa carte a été refusée sur août, son
// abonnement est passé `past_due` — et l'app lui a annoncé « votre période
// d'essai est terminée » avec un bouton pour souscrire un SECOND abonnement.
// Couper l'IA de cette cliente-là serait refaire la même faute d'un cran plus
// loin : elle paie depuis un mois, c'est sa carte qui a expiré.
export const PAIEMENT_A_REGULARISER: ReadonlySet<string> = new Set([
  'past_due',
  'incomplete',
]);

// Comptes qui ne sont JAMAIS coupés, quoi que disent Stripe et `trial_ends_at` :
// démo (showroom commercial), terrain `is_test` (support de RDV vendeur),
// `founder` et `beta` (piliers installés gratuitement, gratuits à vie — `beta`
// est un NOM de parcours, pas une durée : décision du 2026-07-28).
//
// `is_demo` est DÉJÀ exclu par la fonction SQL, qui ne résout pas sa clé du
// tout. Il est quand même traité ici : ce module doit rendre le même verdict que
// son miroir, et un garde qui dépend d'un autre garde pour être juste est un
// garde qu'on désarme en déplaçant l'autre.
export const TYPES_JAMAIS_COUPES: ReadonlySet<string> = new Set(['founder', 'beta']);

/** L'URL où un gérant réactive son abonnement. Le modal de paywall s'y ouvre. */
export const URL_REACTIVATION = 'https://app.frigolog.fr/dashboard';

export type MotifCoupure = 'essai_termine' | 'abonnement_termine';

/**
 * La base a-t-elle servi au moins un fait de facturation ?
 *
 * Existe pour rendre le fail-ouvert BRUYANT. `verdictAcces` ne coupe rien quand
 * aucun fait n'arrive, et c'est voulu — mais sans cette fonction, une régression
 * SQL qui cesserait de servir les colonnes rouvrirait l'accès à tout le monde
 * EN SILENCE. Le point de passage s'en sert pour écrire un avertissement : le
 * test PGlite, lui, lit le fichier du dépôt, et la prod reçoit ses migrations
 * collées à la main.
 */
export function faitsServis(faits: FaitsAcces | null | undefined): boolean {
  if (!faits) return false;
  return (
    faits.is_test !== undefined
    || faits.account_type !== undefined
    || faits.stripe_subscription_status !== undefined
    || faits.trial_ends_at !== undefined
  );
}

export interface VerdictAcces {
  readonly coupe: boolean;
  readonly motif?: MotifCoupure;
}

/**
 * Le compte est-il encore actif ? Miroir de `isPaywalled` côté app.
 *
 * Fail-OUVERT sur l'inconnu, et c'est voulu : si la base ne sert aucun fait de
 * facturation (fonction SQL pas encore migrée, colonne absente du select), on
 * ne coupe pas. Couper sur une absence d'information, c'est fermer la porte de
 * tous les clients qui paient le jour où un `select` oublie une colonne — et
 * une colonne lue mais absente du select arrive `undefined`, pas en erreur.
 */
export function verdictAcces(faits: FaitsAcces | null | undefined): VerdictAcces {
  if (!faits) return { coupe: false };

  if (faits.is_demo === true || faits.is_test === true) return { coupe: false };
  if (faits.account_type && TYPES_JAMAIS_COUPES.has(faits.account_type)) {
    return { coupe: false };
  }

  const statut = faits.stripe_subscription_status;
  if (statut === 'active' || statut === 'trialing') return { coupe: false };
  if (statut && PAIEMENT_A_REGULARISER.has(statut)) return { coupe: false };

  // Pas de statut exploitable : c'est l'essai qui décide. Un `trial_ends_at`
  // absent ou illisible vaut un essai en cours — même garde-fou que l'app : un
  // oubli à l'inscription ne doit jamais enfermer un client dehors.
  if (!faits.trial_ends_at) return { coupe: false };
  const fin = new Date(faits.trial_ends_at);
  if (Number.isNaN(fin.getTime())) return { coupe: false };
  if (fin.getTime() > Date.now()) return { coupe: false };

  // L'essai est échu. Le motif distingue « vous n'avez jamais souscrit » de
  // « votre abonnement s'est arrêté » : ce ne sont pas les mêmes mots, et un
  // client qui a payé pendant un an mérite qu'on s'en souvienne.
  return {
    coupe: true,
    motif: statut ? 'abonnement_termine' : 'essai_termine',
  };
}

/**
 * Le message rendu à l'assistant IA. Il est lu par un humain à travers son
 * assistant : il doit nommer la cause, et porter un lien cliquable. Un 401
 * « Clé API invalide » sur un compte impayé enverrait le gérant chercher un
 * bug de clé pendant une heure.
 */
export function messageCoupure(motif: MotifCoupure): string {
  const quoi =
    motif === 'essai_termine'
      ? "Votre période d'essai Frigolog est terminée"
      : 'Votre abonnement Frigolog est terminé';
  return (
    `${quoi}, donc l'accès de votre assistant IA à vos relevés est suspendu. ` +
    `Vos données sont intactes et vous les retrouvez en réactivant votre ` +
    `abonnement : ${URL_REACTIVATION}. Une clé d'API collée à la main ` +
    `refonctionnera telle quelle ; un assistant connecté « en un clic » voit son ` +
    `autorisation expirer au bout de 90 jours, et il suffira alors de la refaire ` +
    `depuis l'assistant.`
  );
}

// ─── Vecteurs partagés avec le dépôt `frigolog` ────────────────────────
//
// Chaque cas est asserté ICI (tests/prive.test.mjs) et LÀ-BAS
// (tests/billingAccess.test.mjs, contre `isPaywalled`). Si l'un des deux
// fichiers change d'avis, un des deux tests tombe et nomme la divergence.
//
// `coupe: true` ici doit valoir `isPaywalled === true` là-bas, et
// réciproquement. Les dates sont relatives pour que les vecteurs ne pourrissent
// pas : `jours` négatif = dans le passé.
export const VECTEURS_ACCES: ReadonlyArray<{
  nom: string;
  faits: FaitsAcces & { trial_jours?: number };
  coupe: boolean;
}> = [
  { nom: 'abonné actif', faits: { stripe_subscription_status: 'active' }, coupe: false },
  { nom: 'essai Stripe en cours', faits: { stripe_subscription_status: 'trialing' }, coupe: false },
  { nom: 'carte refusée (past_due)', faits: { stripe_subscription_status: 'past_due', trial_jours: -120 }, coupe: false },
  { nom: '3-D Secure inachevé (incomplete)', faits: { stripe_subscription_status: 'incomplete', trial_jours: -120 }, coupe: false },
  { nom: 'essai en cours, sans statut', faits: { trial_jours: 7 }, coupe: false },
  { nom: 'compte démo', faits: { is_demo: true, trial_jours: -200 }, coupe: false },
  { nom: 'compte terrain (is_test)', faits: { is_test: true, trial_jours: -200 }, coupe: false },
  { nom: 'pilier founder', faits: { account_type: 'founder', trial_jours: -200 }, coupe: false },
  { nom: 'parcours beta', faits: { account_type: 'beta', trial_jours: -200 }, coupe: false },
  { nom: 'aucun fait servi (migration pas encore passée)', faits: {}, coupe: false },
  { nom: 'trial_ends_at illisible', faits: { trial_ends_at: 'pas-une-date' }, coupe: false },
  { nom: 'essai échu, jamais abonné', faits: { trial_jours: -148 }, coupe: true },
  { nom: 'abonnement annulé, essai échu', faits: { stripe_subscription_status: 'canceled', trial_jours: -148 }, coupe: true },
  { nom: 'abonnement impayé abandonné', faits: { stripe_subscription_status: 'unpaid', trial_jours: -148 }, coupe: true },
];
