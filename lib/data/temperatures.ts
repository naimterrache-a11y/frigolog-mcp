import type { TemperatureEntry } from '../types.js';

const ARRETE = "Arrêté du 21 décembre 2009 relatif aux règles sanitaires applicables aux activités de commerce de détail";
const CE_853 = "Règlement (CE) n° 853/2004 — règles spécifiques d'hygiène applicables aux denrées alimentaires d'origine animale";
const BPH = "Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL)";

export const TEMPERATURES: TemperatureEntry[] = [
  // Viandes
  {
    categorie: "viande",
    produit: "Viande hachée",
    temperature_max: 2,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "DLC très courte 24-48h. Mesure au cœur du produit obligatoire.",
  },
  {
    categorie: "viande",
    produit: "Viandes fraîches (volailles, porc, agneau, bœuf)",
    temperature_max: 4,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "Volailles et lapins ≤ +4 °C ; viandes rouges ≤ +4 °C en boucherie. Tolérance +2 °C pour boucheries spécialisées.",
  },
  {
    categorie: "viande",
    produit: "Préparations à base de viande",
    temperature_max: 4,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: ARRETE,
    notes: "Préparations crues sous-vide, marinades, mêlées charcuterie maison.",
  },
  {
    categorie: "viande",
    produit: "Abats",
    temperature_max: 3,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "DLC courte ; conservation séparée des autres viandes recommandée.",
  },
  {
    categorie: "viande",
    produit: "Charcuterie",
    temperature_max: 4,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: ARRETE,
    notes: "Charcuterie tranchée DLC très courte ; risque Listeria élevé.",
  },

  // Poisson
  {
    categorie: "poisson",
    produit: "Produits de la pêche frais (poissons, crustacés)",
    temperature_min: 0,
    temperature_max: 2,
    temperature_plage: "0 à +2 °C",
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "Conservation sous glace fondante obligatoire. Mesure au cœur du produit. Risque histamine sur thon, sardine, maquereau.",
  },
  {
    categorie: "poisson",
    produit: "Produits de la pêche congelés",
    temperature_max: -18,
    unite: "celsius",
    type: "conservation_negatif",
    source_reglementaire: CE_853,
  },
  {
    categorie: "poisson",
    produit: "Coquillages vivants",
    temperature_min: 5,
    temperature_max: 15,
    temperature_plage: "+5 à +15 °C",
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "Ne jamais immerger en eau douce. Étiquette d'identification individuelle conservée 60 jours.",
  },

  // Produits laitiers
  {
    categorie: "produits_laitiers",
    produit: "Produits laitiers frais (lait, crème, fromages frais)",
    temperature_max: 4,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: ARRETE,
  },
  {
    categorie: "produits_laitiers",
    produit: "Fromages affinés",
    temperature_max: 8,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: ARRETE,
    notes: "Selon variété : pâtes pressées peuvent tolérer températures plus élevées en cave d'affinage. Vitrine vente ≤ +8 °C.",
  },
  {
    categorie: "produits_laitiers",
    produit: "Lait cru en attente de transformation",
    temperature_max: 4,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "Délai max 72 h entre collecte et transformation.",
  },

  // Œufs
  {
    categorie: "oeufs",
    produit: "Œufs en coquille",
    temperature_min: 5,
    temperature_max: 8,
    temperature_plage: "+5 à +8 °C",
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: BPH,
    notes: "Pas de rupture de la chaîne du froid ; température stable plus importante que valeur exacte.",
  },
  {
    categorie: "oeufs",
    produit: "Ovoproduits liquides (œufs cassés industriels)",
    temperature_max: 4,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: CE_853,
    notes: "Pasteurisés ; DLC courte après ouverture (24-48 h).",
  },

  // Fruits & légumes
  {
    categorie: "fruits_legumes",
    produit: "Fruits et légumes frais",
    temperature_min: 6,
    temperature_max: 10,
    temperature_plage: "+6 à +10 °C",
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: BPH,
    notes: "Variable selon espèce ; bananes et tomates non réfrigérées.",
  },

  // Plats cuisinés
  {
    categorie: "plats_cuisines",
    produit: "Plats cuisinés réfrigérés",
    temperature_max: 3,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: ARRETE,
  },

  // Pâtisserie
  {
    categorie: "patisserie",
    produit: "Pâtisseries à la crème (crème pâtissière, chantilly, mousseline)",
    temperature_max: 3,
    unite: "celsius",
    type: "conservation_froid",
    source_reglementaire: ARRETE,
    notes: "DLC très courte 24-48 h. Risque Salmonella sur crèmes à base d'œufs.",
  },

  // Surgelés
  {
    categorie: "surgeles",
    produit: "Produits surgelés / congelés",
    temperature_max: -18,
    unite: "celsius",
    type: "conservation_negatif",
    source_reglementaire: ARRETE,
    notes: "Tolérance jusqu'à -15 °C en vitrine vente courte durée. Stockage longue durée -18 °C strict.",
  },

  // Glaces
  {
    categorie: "glaces",
    produit: "Glaces / sorbets — stockage réserve",
    temperature_max: -18,
    unite: "celsius",
    type: "conservation_negatif",
    source_reglementaire: BPH,
    notes: "Stockage longue durée des bacs réserve.",
  },
  {
    categorie: "glaces",
    produit: "Glaces / sorbets — vitrine vente",
    temperature_min: -14,
    temperature_max: -12,
    temperature_plage: "-12 à -14 °C",
    unite: "celsius",
    type: "conservation_negatif",
    source_reglementaire: BPH,
    notes: "Permet le portionnement à la boule sans recristallisation.",
  },

  // Service / chaud
  {
    categorie: "service_chaud",
    produit: "Préparations chaudes en service ou maintien",
    temperature_min: 63,
    unite: "celsius",
    type: "service_chaud",
    source_reglementaire: ARRETE,
    notes: "Bain-marie, étuve, plaque chauffante. Contrôle horaire en service prolongé.",
  },

  // Process
  {
    categorie: "process",
    produit: "Remise en température après cuisson",
    temperature_min: 63,
    unite: "celsius",
    type: "process",
    source_reglementaire: ARRETE,
    notes: "Atteindre +63 °C à cœur en moins d'1 h après sortie du froid.",
  },
  {
    categorie: "process",
    produit: "Refroidissement rapide après cuisson",
    temperature_max: 10,
    unite: "celsius",
    type: "process",
    source_reglementaire: ARRETE,
    notes: "Passage de +63 °C à +10 °C en moins de 2 h. Cellule de refroidissement rapide recommandée.",
  },
  {
    categorie: "process",
    produit: "Pasteurisation lait / mix glace",
    temperature_min: 72,
    unite: "celsius",
    type: "process",
    source_reglementaire: CE_853,
    notes: "Cycle 72 °C / 15 secondes minimum (équivalent légal). Pasteurisation haute glace : 85 °C / 30 s.",
  },
];
