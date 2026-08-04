// ═══════════════════════════════════════════════════════════════════════
// MCP privé — les clés d'API : format, empreinte, lecture de l'en-tête
// ═══════════════════════════════════════════════════════════════════════
// Module PUR : aucun accès réseau, aucun accès base, aucune lecture d'env.
// C'est ce qui permet aux tests de l'exercer sans démarrer quoi que ce soit —
// et c'est délibéré : la suite de tests de ce dépôt est du Node nu, sans build
// ni dépendance, et un garde qui ne peut pas lire ce qu'il protège ne protège
// rien.
//
// ── Le format ──────────────────────────────────────────────────────────
//   frg_<8 caractères de préfixe><40 caractères de secret>
//
// Le PRÉFIXE est stocké en clair et peut s'écrire dans un log : c'est ce qu'on
// affiche au gérant pour qu'il sache quelle clé il révoque. Le SECRET ne sort
// qu'une seule fois, à la création, et n'est jamais réaffichable — s'il est
// perdu, on en émet une autre. Un secret qu'on peut retrouver est un secret que
// quelqu'un d'autre peut retrouver.
//
// L'alphabet est volontairement pauvre (32 caractères, sans i/l/o/u/0/1) : ces
// clés seront recopiées à la main dans des champs de configuration, souvent
// depuis un écran vers un autre. Un `l` pris pour un `1` ne produit pas une
// erreur lisible — il produit un 401 que personne ne sait expliquer.

import { createHash, randomInt } from 'node:crypto';

export const PREFIXE_CLE = 'frg_';
export const LONGUEUR_PREFIXE = 8;
export const LONGUEUR_SECRET = 40;

// Base32 « lisible par un humain » : ni i, ni l, ni o, ni u, ni 0, ni 1.
// (Le `u` saute aussi, pour qu'aucun tirage ne compose un mot malheureux.)
const ALPHABET = 'abcdefghjkmnpqrstvwxyz23456789';

function tirer(longueur: number): string {
  let out = '';
  for (let i = 0; i < longueur; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

// L'empreinte stockée en base. SHA-256 nu, JAMAIS bcrypt : une clé de 40
// caractères tirés au hasard est un secret à haute entropie, pas un mot de
// passe humain. bcrypt n'ajoute rien contre un brute-force sans espoir, son sel
// par ligne interdit le lookup indexé, et il rouvre le champ de mines
// $2a$/$2b$ des incidents PIN. Cf. le même arbitrage sur les refresh tokens.
export function empreinteCle(cle: string): string {
  return createHash('sha256').update(cle, 'utf8').digest('hex');
}

export interface CleGeneree {
  /** La clé complète. Montrée UNE fois, jamais stockée. */
  cle: string;
  /** Les 8 caractères affichables. Stockés en clair. */
  prefixe: string;
  /** Ce qui va en base. */
  empreinte: string;
}

export function genererCle(): CleGeneree {
  const prefixe = tirer(LONGUEUR_PREFIXE);
  const cle = PREFIXE_CLE + prefixe + tirer(LONGUEUR_SECRET);
  return { cle, prefixe, empreinte: empreinteCle(cle) };
}

// Forme attendue, vérifiée avant toute requête base. Une chaîne qui ne peut pas
// être une de nos clés n'a aucune raison d'atteindre Postgres : ça évite un
// aller-retour, et surtout ça évite qu'un en-tête arbitraire serve de sonde.
const FORME = new RegExp(
  '^' + PREFIXE_CLE + '[' + ALPHABET + ']{' + (LONGUEUR_PREFIXE + LONGUEUR_SECRET) + '}$',
);

export function formeValide(cle: unknown): cle is string {
  return typeof cle === 'string' && FORME.test(cle);
}

export function prefixeDe(cle: string): string {
  return cle.slice(PREFIXE_CLE.length, PREFIXE_CLE.length + LONGUEUR_PREFIXE);
}

// Ce qu'on écrit dans un log quand on parle d'une clé. JAMAIS la clé.
export function cleLisible(cle: string): string {
  return formeValide(cle) ? PREFIXE_CLE + prefixeDe(cle) + '…' : '(clé malformée)';
}

// Lecture de `Authorization: Bearer frg_…`.
//
// Le schéma est comparé sans tenir compte de la casse (la RFC 7235 le veut, et
// des clients envoient `bearer`), mais la clé, elle, est prise telle quelle :
// normaliser un secret, c'est accepter deux chaînes différentes pour une seule
// vérité.
export function cleDepuisEnTete(entete: unknown): string | null {
  if (typeof entete !== 'string') return null;
  const m = entete.match(/^\s*Bearer\s+(\S+)\s*$/i);
  if (!m) return null;
  return formeValide(m[1]) ? m[1] : null;
}
