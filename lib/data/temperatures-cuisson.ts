import type { TemperatureCuisson } from '../types.js';

const GBPH = "Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL)";
const ARRETE_2009 = "Arrêté du 21 décembre 2009";

export const TEMPERATURES_CUISSON: TemperatureCuisson[] = [
  {
    id: "volaille",
    intitule: "Volaille (poulet, dinde, canard, pintade)",
    temperature_coeur: 74,
    unite: "°C",
    duree_maintien: "1 minute minimum",
    raison: "Destruction de Salmonella et Campylobacter",
    populations_sensibles:
      "82 °C recommandé pour femmes enceintes, jeunes enfants (< 5 ans), personnes immunodéprimées et seniors fragiles",
    base_legale: GBPH,
  },
  {
    id: "boeuf_hache",
    intitule: "Bœuf haché (steak haché, viande hachée crue)",
    temperature_coeur: 70,
    unite: "°C",
    duree_maintien: "2 minutes",
    raison: "Destruction de E. coli O157:H7 (entérohémorragique)",
    populations_sensibles:
      "Ne jamais servir saignant aux enfants de moins de 16 ans, femmes enceintes ni personnes immunodéprimées",
    base_legale: GBPH,
  },
  {
    id: "boeuf_piece_entiere",
    intitule: "Bœuf en pièce entière (steak, rosbif, entrecôte)",
    temperature_coeur: 63,
    unite: "°C",
    commentaire:
      "Cuisson à cœur non requise sur pièce entière non tranchée — surface saisie suffit (>70 °C en surface). Steak tartare et carpaccio : réglementation spécifique, viande extra-fraîche jour même + populations sensibles exclues.",
    populations_sensibles:
      "Interdit de servir cru ou saignant aux populations sensibles (enfants, femmes enceintes, immunodéprimés)",
    base_legale: GBPH,
  },
  {
    id: "porc",
    intitule: "Porc (rôti, côte, échine)",
    temperature_coeur: 70,
    unite: "°C",
    duree_maintien: "2 minutes",
    raison: "Destruction de Trichinella spiralis et Salmonella",
    base_legale: GBPH,
  },
  {
    id: "veau",
    intitule: "Veau (escalope, blanquette, rôti)",
    temperature_coeur: 70,
    unite: "°C",
    base_legale: GBPH,
  },
  {
    id: "agneau",
    intitule: "Agneau (gigot, côtelettes, navarin)",
    temperature_coeur: 70,
    unite: "°C",
    commentaire:
      "63 °C accepté si cuisson rosée souhaitée sur pièce entière non tranchée (gigot, carré). Hachis et préparations émincées : 70 °C obligatoire.",
    base_legale: GBPH,
  },
  {
    id: "poisson",
    intitule: "Poisson cuit",
    temperature_coeur: 63,
    unite: "°C",
    commentaire:
      "Ou jusqu'à obtenir une chair opaque et ferme sur toute la surface. La chair se détache facilement à la fourchette.",
    base_legale: GBPH,
  },
  {
    id: "poisson_cru_sashimi",
    intitule: "Poisson cru, sashimi, ceviche, tartare de poisson",
    temperature_coeur: null,
    commentaire:
      "Pas de cuisson, mais congélation préalable obligatoire à -20 °C pendant 24 heures minimum (ou -35 °C pendant 15 heures) pour destruction du parasite Anisakis simplex.",
    base_legale: ARRETE_2009 + " article 18",
  },
  {
    id: "oeufs_plats_oeufs",
    intitule: "Œufs et plats à base d'œufs (omelette, œuf au plat, brouillade)",
    temperature_coeur: 70,
    unite: "°C",
    commentaire:
      "Blanc et jaune solidifiés. Mayonnaise maison : DLC J+1 maximum après préparation, conservation à +3 °C. Préférer ovoproduits pasteurisés en restauration collective.",
    raison: "Destruction de Salmonella enteritidis",
    base_legale: GBPH,
  },
  {
    id: "refroidissement_rapide",
    intitule: "Refroidissement rapide après cuisson",
    temperature_coeur: 10,
    unite: "°C",
    objectif: "De +63 °C à +10 °C en moins de 2 heures",
    methode:
      "Cellule de refroidissement rapide ou bain-marie inversé (eau glacée + glace pilée) avec brassage régulier",
    raison:
      "Zone dangereuse entre 10 °C et 63 °C : multiplication bactérienne rapide (Bacillus cereus, Clostridium perfringens, Staphylococcus aureus)",
    base_legale: GBPH,
  },
  {
    id: "remise_en_temperature",
    intitule: "Remise en température (réchauffage avant service)",
    temperature_coeur: 63,
    unite: "°C",
    duree_maximale: "1 heure au service",
    commentaire:
      "Un plat réchauffé ne peut être réchauffé qu'une seule fois. Surplus non servi à jeter ou à congeler immédiatement (jamais re-refroidir puis re-réchauffer).",
    base_legale: GBPH,
  },
];
