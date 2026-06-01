import type { RisqueInspectionConfig } from '../types.js';

// Fréquence moyenne d'inspection DDPP et saisonnalité des contrôles par type
// d'établissement. Données agrégées publiques (statistiques DGCCRF / DGAL,
// Alim'confiance). Les fréquences sont des ESTIMATIONS : la DDPP peut contrôler
// tout établissement à tout moment (cf. avertissement du tool).
//
// frequence_*_mois : bornes basse/haute de l'intervalle moyen entre 2 inspections.
// mois_a_risque    : mois calendaires d'intensification connue (saisonnalité +
//                    campagnes nationales DGCCRF, publiées annuellement).

export const RISQUE_INSPECTION: Record<string, RisqueInspectionConfig> = {
  restaurant: {
    frequence_min_mois: 36, // 3 ans
    frequence_max_mois: 60, // 5 ans
    mois_a_risque: ['juin', 'juillet', 'août', 'septembre', 'décembre'],
    recommandations_base: [
      "Tenir le dossier HACCP prêt en permanence (PMS, relevés 30 derniers jours, traçabilité).",
      "Renforcer la vigilance sur la chaîne du froid en été (températures extérieures élevées).",
    ],
  },
  pizzeria: {
    frequence_min_mois: 36,
    frequence_max_mois: 60,
    mois_a_risque: ['juin', 'juillet', 'août', 'septembre', 'décembre'],
    recommandations_base: [
      "Tenir le dossier HACCP prêt en permanence (PMS, relevés, traçabilité).",
      "Surveiller la conservation des produits laitiers et charcuteries (garnitures).",
    ],
  },
  boulangerie: {
    frequence_min_mois: 48, // 4 ans
    frequence_max_mois: 72, // 6 ans
    mois_a_risque: ['novembre', 'décembre', 'janvier'],
    recommandations_base: [
      "Soigner la traçabilité des matières premières (farines, œufs, beurre) et l'affichage allergènes.",
      "Vigilance accrue sur les pâtisseries à la crème pendant les fêtes (forte production).",
    ],
  },
  patisserie: {
    frequence_min_mois: 36,
    frequence_max_mois: 60,
    mois_a_risque: ['novembre', 'décembre', 'janvier'],
    recommandations_base: [
      "Maîtriser le couple temps/température des pâtisseries à la crème (≤ +3 °C) et leur DLC.",
      "Renforcer les contrôles pendant les pics de production (fêtes de fin d'année).",
    ],
  },
  boucherie: {
    frequence_min_mois: 24, // 2 ans — plus fréquent (viandes)
    frequence_max_mois: 48, // 4 ans
    mois_a_risque: ['juin', 'juillet', 'août', 'décembre'],
    recommandations_base: [
      "Les établissements manipulant des viandes sont contrôlés plus fréquemment : dossier irréprochable.",
      "Vigilance chaîne du froid et traçabilité des lots (rappels viandes fréquents).",
    ],
  },
  fromagerie: {
    frequence_min_mois: 36,
    frequence_max_mois: 60,
    mois_a_risque: ['décembre'],
    recommandations_base: [
      "Maîtriser la conservation des fromages au lait cru (Listeria) et la traçabilité.",
      "Renforcer les contrôles pendant les fêtes (forte rotation).",
    ],
  },
  poissonnerie: {
    frequence_min_mois: 24, // 2 ans — plus fréquent (produits de la mer)
    frequence_max_mois: 48,
    mois_a_risque: ['juillet', 'août', 'décembre'],
    recommandations_base: [
      "Produits très périssables : relevés de température et glace fondante rigoureux.",
      "Traçabilité des lots et information sur l'origine (règlement UE 1379/2013).",
    ],
  },
  traiteur: {
    frequence_min_mois: 36,
    frequence_max_mois: 60,
    mois_a_risque: ['novembre', 'décembre', 'janvier'],
    recommandations_base: [
      "Maîtriser le refroidissement rapide et la liaison froide/chaude (production déportée).",
      "Pic d'activité et de risque pendant les fêtes : renforcer les enregistrements.",
    ],
  },
  glacier: {
    frequence_min_mois: 36,
    frequence_max_mois: 60,
    mois_a_risque: ['juin', 'juillet', 'août'],
    recommandations_base: [
      "Maîtriser la conservation à ≤ -18 °C et l'hygiène des ovoproduits (œufs).",
      "Saison estivale = pic d'activité et de contrôles : dossier prêt.",
    ],
  },
  collectivite: {
    frequence_min_mois: 24, // 2 ans
    frequence_max_mois: 36, // 3 ans — restauration collective contrôlée plus souvent
    mois_a_risque: ['septembre', 'octobre'],
    recommandations_base: [
      "Restauration collective contrôlée fréquemment (public sensible) : plats témoins obligatoires.",
      "Renforcer la vigilance à la rentrée scolaire (reprise d'activité, campagnes DGCCRF).",
    ],
  },
};

// Alias type d'établissement -> clé de config.
export const RISQUE_INSPECTION_ALIASES: Record<string, string> = {
  restaurant: 'restaurant',
  restauration: 'restaurant',
  pizzeria: 'pizzeria',
  boulangerie: 'boulangerie',
  patisserie: 'patisserie',
  'boulangerie-patisserie': 'boulangerie',
  boucherie: 'boucherie',
  charcuterie: 'boucherie',
  fromagerie: 'fromagerie',
  poissonnerie: 'poissonnerie',
  traiteur: 'traiteur',
  glacier: 'glacier',
  collectivite: 'collectivite',
  restauration_collective: 'collectivite',
};
