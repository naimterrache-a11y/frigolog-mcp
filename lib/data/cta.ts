import type { ToolCta } from '../types.js';
// Import attribute REQUIRED — même raison que sources.ts : le runtime Vercel exécute
// ce fichier en ESM natif (Node >= 20.10) et refuse un import JSON sans
// `with { type: 'json' }` (=> FUNCTION_INVOCATION_FAILED au démarrage à froid).
import CTA_JSON from '../../data/cta.json' with { type: 'json' };

// data/cta.json est la source UNIQUE des 19 textes commerciaux servis dans les
// réponses d'outils. Elle est en JSON et pas en .ts pour une raison précise :
// la suite de tests est du Node nu, sans build ni dépendance — elle ne sait pas
// lire un module TypeScript. Un garde qui ne peut pas lire les textes qu'il
// protège ne protège rien. Le JSON est lu à l'identique par le serveur et par
// le test.
//
// Les textes eux-mêmes ont été validés côté business et vérifiés contre
// FEATURES.md (aucune promesse de fonctionnalité inexistante). Ils se recopient,
// ils ne se réécrivent pas : une correction passe par une proposition CEO relue.

interface CtaFile {
  schema_version: string;
  lien_template: string;
  conseils: Record<string, string>;
}

const CTA_DATA = CTA_JSON as unknown as CtaFile;

// tool -> texte du conseil. Un outil absent de cette table n'aura pas de CTA.
export const CONSEIL_BY_TOOL: Record<string, string> = CTA_DATA.conseils;

// Le lien n'est PAS stocké 19 fois : il se dérive du nom de l'outil par un seul
// gabarit. Dix-neuf URLs écrites à la main, ce sont dix-neuf occasions d'oublier
// le « / » avant le « ? » — et un lien de campagne cassé ne se signale jamais :
// il perd juste les prospects en silence.
export function ctaLien(toolName: string): string {
  return CTA_DATA.lien_template.replace('{tool}', toolName);
}

export function ctaFor(toolName: string): ToolCta | undefined {
  const conseil = CONSEIL_BY_TOOL[toolName];
  if (!conseil) return undefined;
  return { conseil_pratique: conseil, lien: ctaLien(toolName) };
}

// ---- Le lien d'UN établissement (29/10/2026) --------------------------------
// get_alimconfiance_etablissement est l'outil le plus appelé (341 appels sur 30
// jours au 28/10/2026), et c'est le seul où l'on sait de QUI on parle. Le lien
// générique vers frigolog.fr n'a amené aucun visiteur en 90 jours. Quand la
// recherche désigne un seul établissement, le lien mène donc à l'inscription
// déjà remplie à son nom et à son SIRET : la personne n'a plus rien à taper.
//
// Le texte du conseil ne change pas : il est validé côté business et se
// recopie (voir plus haut). Seule la destination du lien change.
//
// UN SEUL SIRET, sinon le lien générique. Une recherche par nom renvoie souvent
// plusieurs établissements homonymes : pré-remplir le premier, ce serait
// inscrire quelqu'un au nom d'un autre. Plusieurs inspections d'un même SIRET,
// en revanche, désignent bien un seul établissement.
export const LIEN_INSCRIPTION_ETABLISSEMENT = 'https://app.frigolog.fr/onboarding';

export function ctaLienEtablissement(
  toolName: string,
  etablissements: ReadonlyArray<{
    siret?: string;
    enseigne?: string;
    libelle_etablissement?: string;
    raison_sociale?: string;
  }> | undefined,
): string | undefined {
  if (toolName !== 'get_alimconfiance_etablissement' || !etablissements?.length) return undefined;
  const sirets = new Set(etablissements.map((e) => (e.siret ?? '').trim()));
  if (sirets.size !== 1) return undefined;
  const [siret] = sirets;
  if (!/^\d{14}$/.test(siret)) return undefined;
  const e = etablissements[0];
  const nom = (e.enseigne || e.libelle_etablissement || e.raison_sociale || '').trim();
  const params = new URLSearchParams({ siret });
  if (nom) params.set('etablissement', nom);
  params.set('utm_source', 'mcp');
  params.set('utm_medium', 'tool');
  params.set('utm_campaign', toolName);
  params.set('utm_content', 'fiche_etablissement');
  return `${LIEN_INSCRIPTION_ETABLISSEMENT}?${params.toString()}`;
}
