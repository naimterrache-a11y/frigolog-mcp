import type { CritereMicrobiologique, SeuilsMicrobiologiques } from '../types.js';

const REGLEMENT = "Règlement (CE) n° 2073/2005 modifié par le règlement (CE) n° 1441/2007 (annexe I, versions consolidées ultérieures)";

const NOTES_GLOBALES =
  "n = nombre d'unités composant l'échantillon ; c = nombre d'unités tolérées entre m et M (critères d'hygiène) ou pouvant dépasser la limite (critères de sécurité). " +
  "Critère de sécurité des denrées : non-respect = denrée dangereuse → retrait/rappel et information des autorités. " +
  "Critère d'hygiène des procédés : non-respect = action sur l'hygiène de fabrication (pas de retrait automatique). " +
  "⚠️ Le règlement (UE) 2024/2895 fait évoluer le critère Listeria monocytogenes des denrées prêtes à consommer à compter du 1er juillet 2026 — vérifier la version applicable. " +
  "Valeurs complètes et exactes : annexe I du règlement (CE) n° 2073/2005 consolidé (EUR-Lex).";

const SOURCE = "Règlement (CE) n° 2073/2005 (EUR-Lex) — critères microbiologiques applicables aux denrées alimentaires.";

function cm(
  categorie_aliment: string,
  germe: string,
  n: number | string,
  c: number | string,
  m: string,
  M: string,
  stade: string,
  action_si_depassement: string,
  note?: string,
): CritereMicrobiologique {
  return { categorie_aliment, germe, n, c, m, M, stade, action_si_depassement, note };
}

export const SEUILS_MICRO: Record<string, SeuilsMicrobiologiques> = {
  viandes: {
    categorie: "viandes",
    criteres_securite: [
      cm("Viande hachée et préparations de viande destinées à être consommées cuites", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Denrée dangereuse : retrait/rappel + information DDPP/DGCCRF"),
      cm("Viande séparée mécaniquement (VSM)", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
      cm("Viandes hachées et préparations de viande de volaille destinées à être consommées cuites", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
    ],
    criteres_hygiene_procede: [
      cm("Viande hachée", "E. coli", 5, 2, "50 ufc/g", "500 ufc/g", "Fin du procédé de fabrication", "Amélioration de l'hygiène de production et de la sélection/origine des matières premières"),
      cm("Viande hachée", "Germes aérobies (flore aérobie mésophile à 30 °C)", 5, 2, "5 × 10⁵ ufc/g", "5 × 10⁶ ufc/g", "Fin du procédé de fabrication", "Amélioration de l'hygiène de production"),
      cm("Préparations de viande", "E. coli", 5, 2, "500 ufc/g", "5 000 ufc/g", "Fin du procédé de fabrication", "Amélioration de l'hygiène", "Unités selon présentation (g ou cm²) — à vérifier annexe I"),
      cm("Carcasses de bovins, ovins, caprins et équidés", "Enterobacteriaceae", "—", "—", "1,5 log ufc/cm² (moyenne log journalière)", "2,5 log ufc/cm²", "Après habillage, avant réfrigération", "Amélioration de l'hygiène d'abattage", "Plan d'échantillonnage spécifique (moyenne logarithmique journalière) — à vérifier annexe I"),
    ],
    reglement: REGLEMENT,
    notes: NOTES_GLOBALES,
    source: SOURCE,
  },

  produits_laitiers: {
    categorie: "produits_laitiers",
    criteres_securite: [
      cm("Denrées prêtes à consommer permettant le développement de L. monocytogenes (hors nourrissons / usages médicaux spéciaux)", "Listeria monocytogenes", 5, 0, "—", "100 ufc/g", "Produits mis sur le marché pendant leur durée de conservation", "Denrée dangereuse : retrait/rappel", "Avant que le producteur n'en ait perdu la maîtrise et s'il ne peut démontrer le respect de 100 ufc/g : critère « absence dans 25 g ». ⚠️ Évolution au 1er juillet 2026 (UE 2024/2895)."),
      cm("Denrées prêtes à consommer ne permettant pas le développement de L. monocytogenes (pH ≤ 4,4 ou aw ≤ 0,92, etc.)", "Listeria monocytogenes", 5, 0, "—", "100 ufc/g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
      cm("Fromages, lait en poudre et lactosérum en poudre", "Entérotoxines staphylococciques", 5, 0, "—", "Non détectées dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel + recherche de la cause (staphylocoques)"),
    ],
    criteres_hygiene_procede: [
      cm("Fromages au lait cru ou ayant subi un traitement thermique inférieur à la pasteurisation", "E. coli", 5, 2, "100 ufc/g", "1 000 ufc/g", "Au moment où le nombre d'E. coli est le plus élevé durant la fabrication", "Amélioration de l'hygiène de production et sélection du lait"),
      cm("Fromages au lait cru", "Staphylocoques à coagulase positive", 5, 2, "10⁴ ufc/g", "10⁵ ufc/g", "Au moment où le nombre est le plus élevé durant la fabrication", "Amélioration de l'hygiène ; si > 10⁵ ufc/g : recherche d'entérotoxines staphylococciques"),
    ],
    reglement: REGLEMENT,
    notes: NOTES_GLOBALES,
    source: SOURCE,
  },

  plats_cuisines: {
    categorie: "plats_cuisines",
    criteres_securite: [
      cm("Denrées prêtes à consommer permettant le développement de L. monocytogenes", "Listeria monocytogenes", 5, 0, "—", "100 ufc/g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel", "Ou « absence dans 25 g » avant perte de maîtrise par le producteur. ⚠️ Évolution au 1er juillet 2026 (UE 2024/2895)."),
      cm("Denrées prêtes à consommer contenant des œufs crus / plats cuisinés prêts à consommer concernés", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
    ],
    criteres_hygiene_procede: [],
    reglement: REGLEMENT,
    notes:
      "Les plats cuisinés prêts à consommer relèvent principalement des critères de sécurité (Listeria monocytogenes, Salmonella). Les critères d'hygiène des procédés (E. coli, Enterobacteriaceae, germes aérobies) s'appliquent aux matières premières et étapes de fabrication concernées (voir catégories viandes, produits laitiers, etc.). " +
      NOTES_GLOBALES,
    source: SOURCE,
  },

  produits_mer: {
    categorie: "produits_mer",
    criteres_securite: [
      cm("Produits de la pêche d'espèces à forte teneur en histidine (Scombridés, Clupéidés, Engraulidés, Coryphénidés, Pomatomidés, Scombrésocidés)", "Histamine", 9, 2, "100 mg/kg", "200 mg/kg", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
      cm("Produits de la pêche ayant subi une maturation enzymatique en saumure (espèces à forte histidine)", "Histamine", 9, 2, "200 mg/kg", "400 mg/kg", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
      cm("Mollusques bivalves vivants, échinodermes, tuniciers et gastéropodes vivants", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel ; réexamen du classement de la zone"),
      cm("Produits de la pêche prêts à consommer (ex. poisson fumé)", "Listeria monocytogenes", 5, 0, "—", "100 ufc/g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel", "Ou « absence dans 25 g » avant perte de maîtrise. ⚠️ Évolution au 1er juillet 2026 (UE 2024/2895)."),
    ],
    criteres_hygiene_procede: [
      cm("Mollusques bivalves vivants", "E. coli", "—", "—", "—", "230 NPP/100 g de chair et de liquide intervalvaire", "Production / mise sur le marché", "Reparcage/purification, réexamen du classement de la zone de production", "Plan d'échantillonnage spécifique aux coquillages — à vérifier annexe I"),
    ],
    reglement: REGLEMENT,
    notes: NOTES_GLOBALES,
    source: SOURCE,
  },

  fruits_legumes: {
    categorie: "fruits_legumes",
    criteres_securite: [
      cm("Graines germées prêtes à consommer", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
      cm("Graines germées prêtes à consommer", "E. coli STEC (sérogroupes O157, O26, O111, O103, O145, O104:H4)", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
      cm("Fruits et légumes précoupés prêts à consommer / jus de fruits et légumes non pasteurisés", "Salmonella", 5, 0, "—", "Absence dans 25 g", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
    ],
    criteres_hygiene_procede: [
      cm("Fruits et légumes précoupés prêts à consommer", "E. coli", 5, 2, "100 ufc/g", "1 000 ufc/g", "Procédé de fabrication", "Amélioration de l'hygiène de production et sélection des matières premières"),
      cm("Jus de fruits et de légumes non pasteurisés prêts à consommer", "E. coli", 5, 2, "100 ufc/g", "1 000 ufc/g", "Procédé de fabrication", "Amélioration de l'hygiène de production"),
    ],
    reglement: REGLEMENT,
    notes: NOTES_GLOBALES,
    source: SOURCE,
  },

  ovoproduits: {
    categorie: "ovoproduits",
    criteres_securite: [
      cm("Ovoproduits", "Salmonella", 5, 0, "—", "Absence dans 25 g (ou 25 ml)", "Produits mis sur le marché pendant leur durée de conservation", "Retrait/rappel"),
    ],
    criteres_hygiene_procede: [
      cm("Ovoproduits", "Enterobacteriaceae", 5, 2, "10 ufc/g (ou ml)", "100 ufc/g (ou ml)", "Fin du procédé de fabrication", "Amélioration de l'hygiène de production"),
    ],
    reglement: REGLEMENT,
    notes: NOTES_GLOBALES,
    source: SOURCE,
  },
};
