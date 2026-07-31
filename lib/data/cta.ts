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
