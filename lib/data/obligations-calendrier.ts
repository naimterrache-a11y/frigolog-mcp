import type { ObligationConfig } from '../types.js';

// Config statique des obligations / recommandations périodiques HACCP, avec leur
// cadence de référence, les seuils déclenchant orange puis rouge, et la base
// réglementaire (résolue en liens 'sources' via le resolver de sources.ts).
//
// IMPORTANT — honnêteté réglementaire :
//  - Formation HACCP : le RECYCLAGE n'est PAS légalement obligatoire (l'attestation
//    n'a pas de date de péremption légale). Il est FORTEMENT RECOMMANDÉ par les
//    inspecteurs et les organismes ~ tous les 5 ans. On le signale comme
//    recommandation, pas comme obligation dure.
//  - Audit interne et MAJ PMS : recommandations GBPH / exigences de vérification
//    de l'article 5 du règlement (CE) 852/2004.
//
// La fréquence DDPP dépend du type d'établissement -> elle est gérée à part dans
// risque-inspection.ts (réutilisée par le tool 18 pour l'obligation "contrôle DDPP").

export const OBLIGATIONS_FIXES: ObligationConfig[] = [
  {
    obligation: 'Formation / recyclage hygiène alimentaire HACCP',
    intervalle_mois: 60, // 5 ans (recommandation)
    seuil_orange_mois: 48, // > 4 ans
    seuil_rouge_mois: 60, // > 5 ans
    base_legale:
      "Décret n° 2011-731 + Arrêté du 12 février 2024 (formation hygiène). Recyclage non obligatoire légalement mais fortement recommandé tous les 5 ans.",
    action_recommandee:
      "Planifier une session de recyclage hygiène alimentaire (14 h, organisme certifié Qualiopi) pour au moins une personne de l'équipe.",
    action_si_inconnue:
      "Aucune date de formation connue : vérifier qu'au moins une personne dispose d'une attestation HACCP valide, sinon programmer une formation (sanction possible jusqu'à 1 500 € en contrôle).",
  },
  {
    obligation: 'Audit interne du Plan de Maîtrise Sanitaire',
    intervalle_mois: 12, // annuel (GBPH)
    seuil_orange_mois: 10, // > 10 mois
    seuil_rouge_mois: 12, // > 12 mois
    base_legale:
      "Règlement (CE) n° 852/2004 (art. 5 — vérification) + Guide des Bonnes Pratiques d'Hygiène (DGAL).",
    action_recommandee:
      "Réaliser un audit interne complet (relevés température, nettoyage, traçabilité, DLC) et tracer les écarts dans le registre des non-conformités.",
    action_si_inconnue:
      "Aucun audit interne connu : planifier un premier audit de conformité. La vérification périodique est exigée par l'article 5 du règlement (CE) 852/2004.",
  },
  {
    obligation: 'Mise à jour du Plan de Maîtrise Sanitaire (PMS)',
    intervalle_mois: 12, // revue annuelle recommandée
    seuil_orange_mois: 12, // > 12 mois
    seuil_rouge_mois: 24, // > 24 mois
    base_legale:
      "Règlement (CE) n° 852/2004 (art. 5 — le PMS doit être tenu à jour à chaque changement significatif).",
    action_recommandee:
      "Revoir et dater le PMS (nouveaux équipements, nouveaux plats, changement de fournisseurs, évolution réglementaire) et le re-signer.",
    action_si_inconnue:
      "Aucune date de mise à jour du PMS connue : vérifier que le PMS reflète l'activité actuelle, le re-dater et le re-signer.",
  },
];

// Obligation "contrôle DDPP" — la cadence dépend du type d'établissement.
// On expose ici les seuils RELATIFS (en fraction de la fréquence moyenne) ;
// la fréquence absolue vient de risque-inspection.ts.
export const DDPP_OBLIGATION = {
  obligation: 'Contrôle officiel DDPP (préparation)',
  base_legale:
    "Règlement (CE) n° 882/2004 (contrôles officiels) + Code rural et de la pêche maritime (art. L.231-1 à L.237-3).",
  action_recommandee:
    "Vérifier que le dossier HACCP est complet et à jour (PMS, relevés 30 derniers jours, traçabilité, formation) : un contrôle peut survenir à tout moment.",
  action_si_inconnue:
    "Aucune date de dernier contrôle DDPP connue : considérer le risque comme élevé et tenir le dossier HACCP prêt en permanence.",
  // Au-delà de la fréquence moyenne -> rouge ; entre 75 % et 100 % -> orange.
  seuil_orange_fraction: 0.75,
};
