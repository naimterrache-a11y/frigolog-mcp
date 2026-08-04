// ═══════════════════════════════════════════════════════════════════════
// MCP privé — signer un JWT que PostgREST accepte, sans dépendance
// ═══════════════════════════════════════════════════════════════════════
// Ce dépôt n'a AUCUNE dépendance runtime (seulement des devDependencies), et il
// est publié sur npm. Y faire entrer `jose` pour quinze lignes de HMAC serait
// payer une dépendance permanente pour une économie d'un après-midi. HS256 est
// un HMAC-SHA256 sur `base64url(header).base64url(payload)` — node:crypto le
// fait, et le résultat est vérifiable par n'importe quel outil JWT.
//
// ── Ce que le jeton DOIT contenir, et pourquoi ─────────────────────────
// Le contrat n'est pas inventé ici : il est déjà en production dans
// `api/_lib/jwt.js` de l'app, et c'est la fonction Postgres
// `get_my_establishment_id()` qui le lit. Trois points ne se négocient pas :
//
//   • `establishment_id` — le claim que la RLS lit. C'est LUI qui isole. Toutes
//     les policies du produit passent par lui ; un outil qui oublierait son
//     filtre ne renverrait pas les données du voisin, il n'en renverrait aucune.
//
//   • `role: 'authenticated'` et `aud: 'authenticated'` — sans quoi PostgREST
//     refuse le jeton ou le traite comme anonyme.
//
//   • PAS de `sub`. Volontaire, et repris tel quel de l'app : `sub` peuple
//     `auth.uid()`, sur lequel reposent les policies affiliés et vendeurs
//     (`is_affiliate_*`, `current_affiliate_id()`). Un `sub` posé ici ferait
//     entrer le MCP dans des politiques qui ne le concernent pas, avec une
//     identité qui n'existe pas.
//
// ── Interopérabilité : vérifiée, pas supposée ─────────────────────────
// Une signature écrite à la main qui « a l'air bonne » et un test qui la
// recalcule avec le même code, c'est un raisonnement circulaire. Le 2026-08-04,
// un jeton produit par cette fonction a été présenté à PostgREST du projet
// staging : HTTP 200. Une signature refusée aurait rendu 401 / PGRST301
// « None of the keys was able to decode the JWT ». L'implémentation est donc
// acceptée par le vrai vérificateur, pas seulement par le nôtre.
//
// ── Le secret ──────────────────────────────────────────────────────────
// SUPABASE_JWT_SECRET, lu à l'APPEL et jamais au chargement du module. Deux
// raisons : il n'apparaît dans aucune trace d'import, et un déploiement mal
// provisionné échoue à la première requête avec un message clair plutôt qu'au
// démarrage à froid avec un FUNCTION_INVOCATION_FAILED muet.
//
// ⚠️ Ce secret permet de minter un jeton pour N'IMPORTE QUEL établissement. Il
//    est plus étroit que service_role — il ne contourne ni les REVOKE de
//    colonnes (pin_hash), ni les tables deny-all (establishment_auth, sessions,
//    api_keys) — mais il reste un secret à l'échelle du parc. C'est le prix
//    d'un service séparé, et il est assumé : en échange, l'isolation entre
//    établissements est tenue par Postgres et non par notre code.

import { createHmac } from 'node:crypto';

const TTL_SECONDES = 5 * 60; // Le MCP re-minte à chaque requête : 5 min suffisent.

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf as never)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function secret(): string {
  const s = process.env.SUPABASE_JWT_SECRET;
  if (!s) throw new Error('SUPABASE_JWT_SECRET absent — le MCP privé ne peut pas signer');
  return s;
}

export interface JetonEtablissement {
  establishment_id: string;
  role: 'authenticated';
  aud: 'authenticated';
  iat: number;
  exp: number;
}

// `maintenantSecondes` est injectable UNIQUEMENT pour que les tests puissent
// vérifier la durée de vie sans attendre cinq minutes. Aucun appelant de
// production ne le passe.
export function signerJetonEtablissement(
  establishmentId: string,
  maintenantSecondes = Math.floor(Date.now() / 1000),
): string {
  if (!establishmentId) throw new Error('signerJetonEtablissement: establishment_id requis');

  const entete = { alg: 'HS256', typ: 'JWT' };
  const charge: JetonEtablissement = {
    establishment_id: establishmentId,
    role: 'authenticated',
    aud: 'authenticated',
    iat: maintenantSecondes,
    exp: maintenantSecondes + TTL_SECONDES,
    // Pas de `sub` — cf. l'en-tête de ce fichier.
  };

  const corps = b64url(JSON.stringify(entete)) + '.' + b64url(JSON.stringify(charge));
  const signature = b64url(createHmac('sha256', secret()).update(corps).digest());
  return corps + '.' + signature;
}

export const TTL_JETON_SECONDES = TTL_SECONDES;
