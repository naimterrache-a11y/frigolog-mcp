import type { RegleDlcEntry } from '../types.js';

const BPH = "Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL)";

export const REGLES_DLC: RegleDlcEntry[] = [
  // Viandes
  {
    preparation: "Préparations à base de viande cuite",
    dlc_jours: 3,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Viandes braisées, rôties, en sauce. À conserver à +3 °C dès refroidissement rapide (< 2 h après cuisson).",
  },
  {
    preparation: "Préparations à base de viande crue (tartare, carpaccio)",
    dlc_jours: 1,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Consommation jour de fabrication ou lendemain matin maximum. Viande hachée ne pas conserver.",
  },
  {
    preparation: "Viande hachée maison",
    dlc_jours: 0,
    temperature_conservation: "+2 °C max",
    source: "Règlement (CE) n° 853/2004",
    notes: "Consommation jour même obligatoire. Dégager la mention « jour de fabrication » sur étiquette si destinée à la vente directe.",
  },

  // Salades & assemblages
  {
    preparation: "Salades composées (sans produits de la mer)",
    dlc_jours: 3,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Salades césar, niçoise sans œuf cru, taboulé, riz composé. Réduire à 24 h si présence d'œufs durs.",
  },
  {
    preparation: "Salades composées avec produits de la mer",
    dlc_jours: 1,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Salades thon, crevettes, surimi, poisson fumé. Consommation J+1 maximum.",
  },
  {
    preparation: "Sandwiches",
    dlc_jours: 1,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "DLC J ou J+1 selon garniture. Sandwiches au poisson cru ou tartare : J uniquement.",
  },

  // Pâtisseries
  {
    preparation: "Pâtisseries à la crème (crème pâtissière, chantilly, mousseline)",
    dlc_jours: 2,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Éclairs, religieuses, mille-feuilles, fraisiers, choux. DLC max 48 h. Risque Salmonella et Listeria.",
  },
  {
    preparation: "Pâtisseries sans crème (chocolat, ganache, pâte d'amande)",
    dlc_jours: "3 à 5",
    temperature_conservation: "+4 °C max ou ambiante selon recette",
    source: BPH,
    notes: "Tartes au chocolat, opéras, gâteaux secs. Variabilité selon teneur en eau et acidité.",
  },
  {
    preparation: "Desserts à base d'œufs crus (mousse, tiramisu)",
    dlc_jours: 1,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Risque Salmonella élevé. Utiliser œufs extra-frais ou ovoproduits pasteurisés. DLC J+1 strict.",
  },

  // Sauces
  {
    preparation: "Sauces émulsionnées froides (mayonnaise maison, aïoli)",
    dlc_jours: 1,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Présence d'œufs crus = risque Salmonella. Préférer ovoproduits pasteurisés pour gagner DLC.",
  },
  {
    preparation: "Sauces cuites (bolognaise, béchamel, sauce tomate maison)",
    dlc_jours: 3,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Refroidissement rapide < 2 h après cuisson. Bain-marie inversé glace+eau ou cellule.",
  },

  // Soupes et plats
  {
    preparation: "Soupes / potages",
    dlc_jours: 3,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Refroidissement rapide < 2 h. Risque Bacillus cereus sur potages aux légumes féculents (poireaux, pommes de terre).",
  },
  {
    preparation: "Plats cuisinés réfrigérés",
    dlc_jours: 3,
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Lasagnes, gratins, plats en sauce. Au-delà de 3 jours : congeler ou jeter.",
  },

  // Sous-vide
  {
    preparation: "Produits sous-vide cuisson basse température",
    dlc_jours: "5 à 21",
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Variabilité forte selon barème de pasteurisation interne. Produits à risque (volaille, poisson) : DLC plus courte. Validation par tests de vieillissement recommandée.",
  },

  // Décongelés / entamés
  {
    preparation: "Produits décongelés (jamais recongeler)",
    dlc_jours: "1 à 3",
    temperature_conservation: "+3 °C max",
    source: BPH,
    notes: "Variabilité selon nature. Viande hachée décongelée : J. Légumes : J+3. Décongélation au froid uniquement (jamais à température ambiante).",
  },
  {
    preparation: "Produits entamés (jambon, fromage frais ouvert)",
    dlc_jours: "2 à 5",
    temperature_conservation: "+4 °C max",
    source: BPH,
    notes: "Étiqueter avec date d'ouverture. Jambon tranché J+2-3 ; fromages frais J+5 ; conserves ouvertes (ratatouille, légumes en boîte) J+5.",
  },
];
