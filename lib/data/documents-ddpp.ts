import type { DocumentDdppEntry } from '../types.js';

const ALL = [
  "restaurant",
  "boulangerie",
  "boucherie",
  "fromagerie",
  "traiteur",
  "poissonnerie",
  "glacier",
  "caviste",
  "collectivite",
];

const CE_852 = "Règlement (CE) n° 852/2004 — hygiène des denrées alimentaires";
const ARRETE_2009 = "Arrêté du 21 décembre 2009 — règles sanitaires applicables aux activités de commerce de détail";
const DECRET_2011 = "Décret n° 2011-731 du 24 juin 2011 — formation HACCP obligatoire";
const ARRETE_AGREMENT = "Arrêté du 8 juin 2006 — agrément sanitaire CE";

export const DOCUMENTS_DDPP: DocumentDdppEntry[] = [
  // Socle commun (12 documents pour tous établissements)
  {
    document: "Plan de Maîtrise Sanitaire (PMS)",
    obligatoire: true,
    source_reglementaire: CE_852,
    applicable_a: ALL,
    description: "Document écrit décrivant l'ensemble des dispositions prises pour maîtriser la sécurité sanitaire des aliments. Doit être à jour, daté, signé. Premier document demandé par l'inspecteur.",
  },
  {
    document: "Attestation de formation HACCP",
    obligatoire: true,
    source_reglementaire: DECRET_2011,
    applicable_a: ALL,
    description: "Au minimum une personne par établissement de restauration commerciale formée HACCP 14 heures par un organisme agréé. Diplômés CAP/BEP/Bac Pro hôtellerie-restauration ou métiers de bouche dispensés.",
  },
  {
    document: "Registres de relevés de températures",
    obligatoire: true,
    source_reglementaire: ARRETE_2009,
    applicable_a: ALL,
    description: "Tous frigos positifs (≤ +4 °C) et négatifs (≤ -18 °C) avec relevés horodatés et signés sur les 30 à 90 derniers jours. 2 relevés par jour minimum (matin + soir).",
  },
  {
    document: "Plan de nettoyage et désinfection",
    obligatoire: true,
    source_reglementaire: ARRETE_2009,
    applicable_a: ALL,
    description: "Protocoles écrits par poste avec fréquences et produits utilisés, plus enregistrements signés par les opérateurs à chaque passage.",
  },
  {
    document: "Fiches de traçabilité produits",
    obligatoire: true,
    source_reglementaire: "Règlement (CE) n° 178/2002 — traçabilité descendante article 18",
    applicable_a: ALL,
    description: "Bons de livraison, factures fournisseurs, étiquettes fournisseurs avec photos, numéros de lots. Conservation minimum 12 mois (5 ans recommandé denrées d'origine animale).",
  },
  {
    document: "Résultats d'analyses microbiologiques",
    obligatoire: false,
    source_reglementaire: "Plan d'autocontrôle interne (recommandation DGAL)",
    applicable_a: ALL,
    description: "Analyses périodiques sur surfaces, mains, produits finis. Recommandé au moins 1 fois par an. Obligatoire en cuisine collective et établissements à agrément CE.",
  },
  {
    document: "Contrat de lutte contre les nuisibles",
    obligatoire: true,
    source_reglementaire: ARRETE_2009,
    applicable_a: ALL,
    description: "Contrat avec entreprise de désinsectisation/dératisation OU procédure interne écrite. Bordereaux de passage conservés. Pièges visibles et entretenus.",
  },
  {
    document: "Fiches de Données de Sécurité (FDS) des produits d'entretien",
    obligatoire: true,
    source_reglementaire: "Code du travail R4624-22",
    applicable_a: ALL,
    description: "Pour chaque produit chimique de nettoyage utilisé, FDS à jour. Stockage des produits chimiques séparé des denrées alimentaires.",
  },
  {
    document: "Procédure de gestion des non-conformités et actions correctives",
    obligatoire: true,
    source_reglementaire: CE_852,
    applicable_a: ALL,
    description: "Procédure écrite + registre des incidents (rupture chaîne du froid, présence nuisibles, contamination). Pour chaque incident : date, nature, action prise, opérateur, date de clôture.",
  },
  {
    document: "Procédure de retrait/rappel des produits",
    obligatoire: true,
    source_reglementaire: "Règlement (CE) n° 178/2002 article 19 + Code de la consommation L412-1",
    applicable_a: ALL,
    description: "Procédure documentée pour identifier en moins de 30 minutes les lots concernés par un rappel et procéder au retrait. Cross-check RappelConso DGCCRF recommandé.",
  },
  {
    document: "Registre du personnel et attestations médicales d'aptitude",
    obligatoire: true,
    source_reglementaire: ARRETE_2009,
    applicable_a: ALL,
    description: "Liste des employés manipulant des denrées alimentaires + visites médicales d'aptitude annuelles. Personnel symptomatique interdit en cuisine.",
  },
  {
    document: "Protocole de gestion des allergènes",
    obligatoire: true,
    source_reglementaire: "Règlement (UE) n° 1169/2011 INCO",
    applicable_a: ALL,
    description: "Liste des 14 allergènes majeurs identifiés sur la carte ou affichage en boutique. Procédure pour éviter contamination croisée. Personnel formé à répondre aux allergies.",
  },

  // Spécifiques par type
  {
    document: "Fiches plats témoins",
    obligatoire: true,
    source_reglementaire: ARRETE_2009,
    applicable_a: ["restaurant", "traiteur", "collectivite"],
    description: "Conservation d'un échantillon de 80 g par préparation servie pendant 5 jours minimum à +3 °C. Obligatoire en restauration collective différée, fortement recommandé en traiteur événementiel.",
  },
  {
    document: "Registre huiles de friture",
    obligatoire: true,
    source_reglementaire: "Décret n° 2008-184 du 26 février 2008",
    applicable_a: ["restaurant", "traiteur", "collectivite"],
    description: "Suivi indice de polarité (≤ 25 %), changement d'huile documenté. Filtration entre changements.",
  },
  {
    document: "Fiches recettes avec allergènes",
    obligatoire: true,
    source_reglementaire: "Règlement (UE) n° 1169/2011 INCO",
    applicable_a: ["boulangerie", "patisserie", "traiteur"],
    description: "Pour chaque produit fini, liste des ingrédients avec allergènes déclarés (gluten, œufs, lait, fruits à coque, soja, sulfites). Affichage clients ou disponible sur demande.",
  },
  {
    document: "Registre températures vitrine pâtisserie",
    obligatoire: true,
    source_reglementaire: ARRETE_2009,
    applicable_a: ["boulangerie", "patisserie"],
    description: "Vitrines réfrigérées pâtisseries crème ≤ +4 °C, relevés pluriquotidiens (matin/midi/soir) en service prolongé.",
  },
  {
    document: "Agrément sanitaire CE (transformation)",
    obligatoire: true,
    source_reglementaire: ARRETE_AGREMENT,
    applicable_a: ["boucherie", "fromagerie", "poissonnerie", "traiteur"],
    description: "Obligatoire dès qu'il y a transformation ET cession à d'autres commerces (restaurants, traiteurs, autres revendeurs). Numéro estampillé sur les emballages livrés. Audit initial sur site et inspections régulières.",
  },
  {
    document: "Registre traçabilité viande (lot, origine, abattoir)",
    obligatoire: true,
    source_reglementaire: CE_852 + " + Règlement (CE) n° 853/2004",
    applicable_a: ["boucherie"],
    description: "Pour chaque pièce : numéro de lot abattoir, éleveur d'origine, date d'abattage, date de réception. Conservation 12 mois minimum.",
  },
  {
    document: "Protocole Listeria",
    obligatoire: true,
    source_reglementaire: "Règlement (CE) n° 2073/2005 — critères microbiologiques",
    applicable_a: ["fromagerie"],
    description: "Plan d'autocontrôles Listeria monocytogenes (absent dans 25 g) sur produits sensibles (pâtes molles, croûte fleurie/lavée). Surveillance particulière sur lait cru.",
  },
  {
    document: "Suivi affinage (température + hygrométrie)",
    obligatoire: true,
    source_reglementaire: BPH(),
    applicable_a: ["fromagerie"],
    description: "Relevés quotidiens température et hygrométrie par cave d'affinage. Seuils par famille de fromage (pâtes molles 90-95 % HR, pâtes pressées 85-90 % HR).",
  },
  {
    document: "Registre liaison froide/chaude",
    obligatoire: true,
    source_reglementaire: "Arrêté du 21 décembre 2009 — liaison froide",
    applicable_a: ["traiteur", "collectivite"],
    description: "Pour chaque livraison : températures au départ et à l'arrivée, durée transport, opérateur. Liaison froide ≤ +4 °C, liaison chaude ≥ +63 °C.",
  },
  {
    document: "Protocole transport (véhicule réfrigéré)",
    obligatoire: true,
    source_reglementaire: "Arrêté du 21 décembre 2009",
    applicable_a: ["traiteur"],
    description: "Contrôle technique groupe froid (annuel), nettoyage véhicule après chaque livraison, certificat de conformité du véhicule.",
  },
  {
    document: "Traçabilité maritime (zone FAO, bateau, date pêche)",
    obligatoire: true,
    source_reglementaire: "Règlement (UE) n° 1379/2013 — OCM produits de la pêche",
    applicable_a: ["poissonnerie"],
    description: "Étiquetage obligatoire avec zone FAO de capture, méthode de pêche, nom scientifique espèce, mention décongelé si applicable.",
  },
  {
    document: "Registre histamine (poissons à risque)",
    obligatoire: true,
    source_reglementaire: "Règlement (CE) n° 2073/2005",
    applicable_a: ["poissonnerie"],
    description: "Autocontrôles histamine périodiques sur thon, sardine, maquereau, anchois, hareng, bonite. Limite 100 mg/kg.",
  },
  {
    document: "Protocole pasteurisation mix",
    obligatoire: true,
    source_reglementaire: "Règlement (CE) n° 853/2004",
    applicable_a: ["glacier"],
    description: "Cycle pasteurisation 85 °C / 30 secondes (haute) ou 72 °C / 15 secondes (basse). Enregistrement automatique des cycles, archivage 12 mois.",
  },
  {
    document: "Traçabilité parfums (lots ingrédients par bac fabriqué)",
    obligatoire: true,
    source_reglementaire: "Règlement (CE) n° 178/2002",
    applicable_a: ["glacier"],
    description: "Pour chaque bac fabriqué : date, parfum, recette, lots ingrédients utilisés (lait, crème, œufs, fruits, chocolat). Permet retrait ciblé en cas d'incident.",
  },
  {
    document: "Registre traçabilité lots vins/spiritueux",
    obligatoire: true,
    source_reglementaire: "Réglementation viticole + INCO 1169/2011",
    applicable_a: ["caviste"],
    description: "Pour chaque cuvée : domaine, millésime, négociant éventuel, date d'arrivée. Conservation 5 ans.",
  },
  {
    document: "Suivi sulfites (allergène réglementé)",
    obligatoire: true,
    source_reglementaire: "Règlement (UE) n° 1169/2011 INCO",
    applicable_a: ["caviste"],
    description: "Mention « contient des sulfites » obligatoire sur étiquette si > 10 mg/L. Affichage en boutique pour les clients allergiques.",
  },
];

function BPH() {
  return "Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL)";
}
