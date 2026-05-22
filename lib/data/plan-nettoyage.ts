import type { PlanNettoyage, PosteNettoyage } from '../types.js';

const PROTOCOLE_5 =
  "Protocole de nettoyage-désinfection en 5 étapes (bionettoyage) : " +
  "1) Pré-nettoyage — élimination des déchets et résidus visibles (grattage, balayage humide, trempage si besoin) ; " +
  "2) Nettoyage — application d'un détergent adapté, action mécanique (brosse, lavette), respect du temps de contact ; " +
  "3) Rinçage intermédiaire à l'eau potable pour éliminer le détergent ; " +
  "4) Désinfection — application d'un désinfectant agréé contact alimentaire (norme EN 13697 / EN 1276), respect de la concentration et du temps d'action indiqués par le fabricant ; " +
  "5) Rinçage final à l'eau potable (si le désinfectant l'exige) puis séchage à l'air libre ou essuie-tout à usage unique. " +
  "Toute surface en contact avec les aliments requiert un bionettoyage (nettoyage + désinfection).";

const SOURCE =
  "GBPH du secteur (DGAL) + Règlement (CE) n° 852/2004 annexe II (locaux, équipements, nettoyage/désinfection). Plan modèle indicatif — à adapter au plan de maîtrise sanitaire (PMS) de l'établissement.";

function p(
  nom: string,
  zone: string,
  frequence: string,
  produit_type: string,
  methode: string,
  verification: string,
): PosteNettoyage {
  return { nom, zone, frequence, produit_type, methode, verification };
}

// Postes communs à tous les établissements alimentaires (socle 8).
const COMMUN: PosteNettoyage[] = [
  p(
    "Plans de travail et surfaces de découpe",
    "Production",
    "Après chaque usage et en fin de service",
    "Détergent-désinfectant contact alimentaire",
    "Bionettoyage en 5 étapes ; insister sur les angles et joints ; désinfectant rincé si requis",
    "Surface visuellement propre, absence de résidus gras (contrôle visuel ; test de surface ATP possible)",
  ),
  p(
    "Sols de la zone de production",
    "Cuisine / Production",
    "Quotidienne (fin de service)",
    "Détergent dégraissant alcalin",
    "Balayage humide puis lavage à la raclette, rinçage ; siphons nettoyés",
    "Sol propre, siphons dégagés, absence d'eau stagnante",
  ),
  p(
    "Réfrigérateurs et chambres froides (intérieur)",
    "Stockage froid",
    "Hebdomadaire et dès souillure",
    "Détergent-désinfectant contact alimentaire",
    "Vidage, nettoyage parois/clayettes/joints, désinfection, rinçage ; relevé de température contrôlé",
    "Parois et joints propres, absence de moisissure, température conforme (≤ +4 °C positif / ≤ -18 °C négatif)",
  ),
  p(
    "Plonge et éviers",
    "Plonge",
    "Après chaque service",
    "Détergent dégraissant",
    "Récurage des bacs, rinçage, désinfection ; détartrage périodique",
    "Bacs propres, absence de dépôt gras ou calcaire",
  ),
  p(
    "Poubelles et local déchets",
    "Zone déchets",
    "Quotidienne",
    "Détergent-désinfectant",
    "Lavage intérieur/extérieur des contenants, désinfection ; sacs changés",
    "Contenants propres, couvercles fonctionnels, absence d'odeur et de nuisibles",
  ),
  p(
    "Lave-mains du personnel",
    "Toutes zones",
    "Quotidienne (plusieurs fois par jour)",
    "Détergent-désinfectant",
    "Nettoyage robinetterie (commande non manuelle), réapprovisionnement savon et essuie-mains",
    "Savon bactéricide et essuie-mains à usage unique disponibles, robinet propre",
  ),
  p(
    "Sanitaires",
    "Sanitaires",
    "Quotidienne (au minimum 1 fois par jour)",
    "Détergent-désinfectant sanitaire",
    "Nettoyage cuvettes, sols, points de contact (poignées) ; aération",
    "Propreté visuelle, consommables réapprovisionnés, séparation stricte des sanitaires et de la zone alimentaire",
  ),
  p(
    "Hotte et filtres d'extraction",
    "Cuisson",
    "Filtres : hebdomadaire ; conduits : annuel (entreprise spécialisée)",
    "Dégraissant alcalin fort",
    "Démontage des filtres, trempage dégraissant, rinçage, séchage",
    "Filtres dégraissés, absence d'accumulation de graisse (risque incendie et contamination)",
  ),
];

export const PLAN_NETTOYAGE: Record<string, PlanNettoyage> = {
  restaurant: {
    type_etablissement: "restaurant",
    postes: [
      ...COMMUN,
      p(
        "Matériel de cuisson (fours, plaques, friteuses)",
        "Cuisson",
        "Quotidienne",
        "Dégraissant alimentaire",
        "Grattage à chaud, dégraissage, rinçage ; vidange et filtration des huiles selon suivi",
        "Absence de résidus carbonisés ; huile de friture < 25 % de composés polaires",
      ),
      p(
        "Salle, tables et banquettes",
        "Salle",
        "Après chaque service",
        "Détergent-désinfectant tables",
        "Essuyage des tables et points de contact, nettoyage du sol de salle",
        "Tables et sol de salle propres",
      ),
      p(
        "Petit matériel (trancheur, robot, batteur)",
        "Production",
        "Après chaque usage",
        "Détergent-désinfectant (pièces démontables)",
        "Démontage, bionettoyage de chaque pièce, séchage à l'air libre",
        "Pièces démontées propres et sèches, lame de trancheur désinfectée",
      ),
      p(
        "Réserve sèche et étagères",
        "Réserve",
        "Mensuelle",
        "Détergent",
        "Dépoussiérage et lavage des étagères ; vérification de la rotation des stocks (FEFO)",
        "Étagères propres, denrées non au sol, absence de nuisibles",
      ),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  boulangerie: {
    type_etablissement: "boulangerie",
    postes: [
      ...COMMUN,
      p("Pétrin et batteur", "Fabrication", "Après chaque usage", "Détergent-désinfectant (pièces démontables)", "Démontage de la cuve et du crochet, bionettoyage, séchage", "Cuve et outils propres et secs, absence de pâte sèche"),
      p("Four à sole / four ventilé", "Cuisson", "Quotidienne (sole) ; hebdomadaire (parois)", "Dégraissant alimentaire", "Brossage de la sole à froid, dégraissage des parois", "Absence de dépôts carbonisés"),
      p("Chambre de pousse / étuve", "Fermentation", "Hebdomadaire", "Détergent-désinfectant", "Nettoyage parois et clayettes, désinfection, contrôle hygrométrie", "Parois propres, absence de moisissure, hygrométrie maîtrisée"),
      p("Bacs et silos à farine, plan de façonnage", "Fabrication", "Façonnage : après service ; bacs : mensuel", "Détergent à sec puis humide", "Vidage, dépoussiérage à sec (farine), lavage humide périodique", "Absence d'accumulation de farine (risque d'altération et de nuisibles)"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  boucherie: {
    type_etablissement: "boucherie",
    postes: [
      ...COMMUN,
      p("Billot et plans de découpe", "Découpe", "Après chaque usage et en fin de service", "Détergent-désinfectant contact alimentaire", "Grattage, bionettoyage complet, désinfection ; billot bois gratté et salé si traditionnel", "Surface saine, absence de rainures contaminées"),
      p("Hachoir et scie à os", "Transformation", "Après chaque usage", "Détergent-désinfectant (pièces démontables)", "Démontage complet, bionettoyage de chaque pièce, séchage", "Pièces démontées propres et sèches, absence de résidus de viande"),
      p("Trancheur à jambon", "Transformation", "Après chaque usage", "Détergent-désinfectant", "Démontage, bionettoyage de la lame et du chariot, séchage", "Lame désinfectée, absence de résidus"),
      p("Vitrine réfrigérée et chambre froide viandes", "Vente / Stockage froid", "Vitrine : quotidienne ; chambre : hebdomadaire", "Détergent-désinfectant", "Nettoyage des bacs, parois, crochets et rails ; désinfection", "Parois propres, crochets sains, température ≤ +4 °C (≤ +2 °C recommandé)"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  fromagerie: {
    type_etablissement: "fromagerie",
    postes: [
      ...COMMUN,
      p("Cave d'affinage", "Affinage", "Hebdomadaire (sols/parois) — sans biocide agressif", "Détergent doux + désinfection ciblée", "Nettoyage des sols et parois ; désinfection maîtrisée pour ne pas perturber les flores d'affinage ; contrôle température/hygrométrie", "Parois propres, hygrométrie et température conformes par famille de fromage"),
      p("Claies, planches et grilles d'affinage", "Affinage", "Selon le cycle d'affinage et entre deux lots", "Détergent-désinfectant (bois : brossage)", "Brossage des planches bois, lavage des grilles, séchage", "Supports sains, absence de moisissures indésirables"),
      p("Vitrine et banc de coupe fromages", "Vente", "Quotidienne", "Détergent-désinfectant", "Bionettoyage de la vitrine, du fil et des outils de coupe", "Surfaces propres, température ≤ +8 °C (frais ≤ +4 °C)"),
      p("Table de moulage / matériel de fabrication (si transformation)", "Fabrication", "Après chaque fabrication", "Détergent-désinfectant", "Bionettoyage complet, désinfection renforcée (risque Listeria)", "Surfaces et moules désinfectés (plan d'autocontrôle Listeria)"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  poissonnerie: {
    type_etablissement: "poissonnerie",
    postes: [
      ...COMMUN,
      p("Étal réfrigéré et banc à glace", "Vente", "Après chaque service", "Détergent-désinfectant contact alimentaire", "Évacuation de la glace, bionettoyage de l'étal, désinfection, rinçage", "Étal propre, écoulement libre, absence d'odeur, glace renouvelée"),
      p("Bacs, caisses et contenants poisson", "Réception / Stockage", "Quotidienne", "Détergent-désinfectant", "Lavage et désinfection des bacs et caisses, séchage", "Contenants propres, absence de résidus"),
      p("Billot d'écaillage / plan de filetage et couteaux", "Transformation", "Après chaque usage", "Détergent-désinfectant", "Bionettoyage du plan et des couteaux, désinfection", "Surfaces et couteaux désinfectés"),
      p("Évacuations, siphons et zone humide", "Production", "Quotidienne", "Détergent dégraissant + désinfectant", "Nettoyage des siphons et caniveaux, désinfection, contrôle des odeurs", "Évacuations dégagées, absence d'odeur, pas d'eau stagnante"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  traiteur: {
    type_etablissement: "traiteur",
    postes: [
      ...COMMUN,
      p("Cellule de refroidissement rapide", "Production", "Quotidienne et après chaque cycle", "Détergent-désinfectant", "Bionettoyage de la cellule, désinfection, contrôle du cycle (+63 °C → +10 °C en < 2 h)", "Cellule propre, cycle de refroidissement conforme"),
      p("Bacs gastronormes et contenants de transport", "Conditionnement", "Après chaque usage", "Détergent-désinfectant", "Lavage en machine ou bionettoyage manuel, séchage", "Contenants propres et secs, absence de résidus"),
      p("Véhicule réfrigéré de livraison", "Transport", "Après chaque tournée", "Détergent-désinfectant", "Nettoyage de la caisse, désinfection, contrôle du groupe froid", "Caisse propre, liaison froide ≤ +4 °C maîtrisée"),
      p("Zone d'allotissement / dressage", "Conditionnement", "Après chaque préparation de commande", "Détergent-désinfectant", "Bionettoyage des surfaces de dressage, désinfection", "Surfaces désinfectées, séparation des denrées par commande"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  glacier: {
    type_etablissement: "glacier",
    postes: [
      ...COMMUN,
      p("Turbine / sorbetière", "Fabrication", "Après chaque production", "Détergent-désinfectant contact alimentaire", "Démontage, bionettoyage strict des pièces, désinfection, séchage", "Pièces désinfectées (risque Listeria/Salmonella sur mix à base d'œufs et de lait)"),
      p("Pasteurisateur de mix", "Fabrication", "Cycle de nettoyage en place (NEP/CIP) après chaque série", "Détergent alcalin + acide (cycle CIP)", "Cycle NEP automatique, contrôle des températures de pasteurisation enregistrées", "Cycle de pasteurisation conforme (85 °C/30 s ou 72 °C/15 s), enregistrements archivés"),
      p("Bacs à glace et vitrine de vente", "Vente", "Selon rotation et à chaque réassort", "Détergent-désinfectant", "Bionettoyage des bacs vidés, désinfection ; jamais de recongélation", "Bacs propres, température de vitrine -12 à -14 °C"),
      p("Portionneuses, cuillères et bac à eau", "Vente", "Eau courante en continu ; bionettoyage quotidien", "Eau potable courante + détergent-désinfectant", "Maintien des portionneuses sous eau courante renouvelée, bionettoyage en fin de service", "Eau renouvelée, ustensiles propres"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },

  pizzeria: {
    type_etablissement: "pizzeria",
    postes: [
      ...COMMUN,
      p("Four à pizza (sole et chambre)", "Cuisson", "Quotidienne (sole) ; hebdomadaire (parois)", "Brosse + dégraissant à froid", "Brossage de la sole, dégraissage des parois à froid", "Sole propre, absence de dépôts carbonisés"),
      p("Pétrin", "Fabrication", "Après chaque usage", "Détergent-désinfectant", "Démontage cuve et crochet, bionettoyage, séchage", "Cuve et outils propres et secs"),
      p("Plan de façonnage et bacs à pâtons", "Fabrication", "Après chaque service", "Détergent-désinfectant", "Bionettoyage du plan, lavage et désinfection des bacs à pâtons", "Surfaces désinfectées, bacs propres"),
      p("Trancheur et râpe à fromage, bacs garnitures", "Préparation", "Après chaque usage", "Détergent-désinfectant", "Démontage, bionettoyage des pièces, désinfection des bacs à garniture (en saladette ≤ +4 °C)", "Pièces désinfectées, garnitures maintenues au froid"),
    ],
    protocole_5_etapes: PROTOCOLE_5,
    source: SOURCE,
  },
};
