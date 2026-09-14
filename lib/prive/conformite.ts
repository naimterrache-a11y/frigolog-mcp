// ═══════════════════════════════════════════════════════════════════════
// Conformité d'un relevé de température — elle se JUGE, elle ne se lit pas
// ═══════════════════════════════════════════════════════════════════════
// La colonne `is_compliant` de `temperature_logs` est à l'abandon : elle vaut
// NULL sur plus d'un relevé sur deux. Compter `is_compliant === false`, comme
// le faisait ce serveur, rendait un nombre de non-conformités sans rapport
// avec la réalité — et dans les deux sens : un NULL n'était ni compté conforme
// ni compté en écart, il disparaissait.
//
// L'app juge la VALEUR contre la plage de l'enceinte (`evaluateTempLog`,
// `api/_lib/tempConformity.js` du dépôt frigolog) : le score, le dossier de
// contrôle, le Mode contrôle et l'assistant IA lisent tous ce jugement. Ce
// fichier en est la COPIE, pour que le connecteur IA d'un client ne lui dise
// pas autre chose que son propre tableau de bord.
//
// ⚠️ COPIE SYNCHRONISÉE. Toute modification de la règle côté app se reporte
//    ici, et `tests/prive.test.mjs` porte les mêmes cas limites que là-bas.
//
// Trois états, pas deux : un seuil inconnu n'est PAS un écart, et ce n'est pas
// non plus une conformité. L'écraser dans l'un ou l'autre, c'est remplacer un
// défaut par un autre.

export const STATUT_TEMPERATURE = {
  CONFORME: 'conforme',
  HORS_PLAGE: 'hors_plage',
  SEUIL_INCONNU: 'seuil_inconnu',
} as const;

export type StatutTemperature = typeof STATUT_TEMPERATURE[keyof typeof STATUT_TEMPERATURE];

interface Plage { min?: unknown; max?: unknown }

/**
 * Même règle que `evaluateTempLog` (app) :
 *   - conforme      : valeur dans [min, max], bornes incluses
 *   - hors_plage    : valeur < min ou > max
 *   - seuil_inconnu : min ou max absent, ou mesure absente / non numérique
 * `is_compliant` et `corrective_action` ne sont PAS lus : ce sont des faits de
 * process, pas de mesure.
 */
export function jugerReleve(
  releve: { temperature?: unknown } | null | undefined,
  enceinte: Plage | null | undefined,
): StatutTemperature {
  const min = enceinte?.min;
  const max = enceinte?.max;
  const temp = releve?.temperature;
  if (
    min == null || max == null
    || typeof temp !== 'number' || Number.isNaN(temp)
  ) {
    return STATUT_TEMPERATURE.SEUIL_INCONNU;
  }
  return (temp < (min as number) || temp > (max as number))
    ? STATUT_TEMPERATURE.HORS_PLAGE
    : STATUT_TEMPERATURE.CONFORME;
}
