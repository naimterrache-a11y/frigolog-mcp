import type { FormationHaccp } from '../types.js';

export const FORMATION_HACCP: FormationHaccp = {
  obligation_legale: {
    texte:
      "Au moins une personne au sein de chaque établissement de restauration commerciale doit pouvoir justifier d'une formation spécifique en matière d'hygiène alimentaire adaptée à l'activité. Cette obligation s'applique à tout établissement préparant, manipulant ou servant des denrées alimentaires en vue de leur consommation immédiate sur place ou à emporter.",
    base_legale:
      "Article L.233-4 du Code rural et de la pêche maritime — Arrêté du 5 octobre 2011 modifié par l'arrêté du 12 février 2024",
    entree_en_vigueur: "1er octobre 2012",
  },
  qui_est_concerne: [
    "Restauration traditionnelle (restaurants à table)",
    "Restauration rapide (fast-food, sandwicheries)",
    "Cafétérias et libres-services",
    "Vente à emporter (sushi shops, dark kitchens, food courts)",
    "Traiteurs (livraison ou réception)",
    "Food trucks et points de vente mobiles",
    "Salons de thé avec restauration légère",
  ],
  qui_est_exempte: [
    "Professionnels justifiant de 3 ans d'expérience à temps plein dans une entreprise du secteur alimentaire en tant que gestionnaire ou exploitant",
    "Titulaires d'un diplôme ou titre de niveau V ou supérieur en rapport avec le secteur de l'alimentation et incluant une composante hygiène alimentaire (CAP/BEP/Bac Pro/BTS hôtellerie-restauration, métiers de bouche, cuisine, pâtisserie, boulangerie, charcuterie-traiteur)",
  ],
  contenu_obligatoire: [
    "Aliments et risques pour le consommateur (introduction à la microbiologie alimentaire)",
    "Les dangers biologiques (bactéries, virus, parasites), chimiques (résidus, allergènes) et physiques (corps étrangers)",
    "Principes fondamentaux de la méthode HACCP (les 7 principes et 12 étapes)",
    "Mesures de surveillance et autocontrôles à mettre en place dans l'établissement",
    "Plan de Maîtrise Sanitaire (PMS) — bonnes pratiques d'hygiène, traçabilité, gestion des non-conformités",
    "Guide de Bonnes Pratiques d'Hygiène (GBPH) du secteur d'activité",
    "Traçabilité alimentaire et procédure de retrait/rappel",
    "Réglementation européenne (paquet hygiène : règlements CE 178/2002, 852/2004, 853/2004)",
  ],
  duree_formation: {
    minimum_legal:
      "Pas de durée minimale imposée réglementairement par l'arrêté du 5 octobre 2011 — c'est l'organisme qui détermine la durée pour couvrir le programme obligatoire",
    pratique_courante:
      "14 heures (2 jours pleins) en présentiel — durée standard du marché",
    en_ligne: "7 à 14 heures en e-learning certifié (Qualiopi)",
  },
  cout_moyen: {
    presentiel: "150 € à 400 € HT par personne",
    elearning: "80 € à 200 € HT par personne",
    financement:
      "Éligible OPCO Akto (HCR), AFDAS et FIF-PL pour les indépendants. Prise en charge totale ou partielle possible selon la situation et la branche professionnelle.",
  },
  validite:
    "Pas de durée de validité légale imposée. Renouvellement recommandé tous les 3 à 5 ans, ou en cas d'évolution réglementaire majeure (ex : nouvel arrêté du 12 février 2024).",
  sanction_absence:
    "Jusqu'à 1 500 € d'amende (contravention de 5e classe) en cas de contrôle DDPP sans présentation d'une attestation de formation HACCP. Peut entraîner une mise en demeure si combinée à d'autres manquements.",
  ou_se_former: {
    critere:
      "Choisir un organisme de formation déclaré et enregistré auprès de la DRAAF (Direction Régionale de l'Alimentation, de l'Agriculture et de la Forêt) de sa région. La certification Qualiopi est un gage supplémentaire de sérieux et conditionne la prise en charge OPCO.",
    recherche:
      "Liste officielle des organismes habilités via les DRAAF régionales ou data.gouv.fr. Sites spécialisés : CCI, CFA hôtellerie-restauration, organismes nationaux (CFEFP, AFPA).",
    validation:
      "À l'issue, l'organisme délivre une attestation de formation individuelle datée, signée et nominative — à conserver dans le PMS et présentable à l'inspecteur DDPP en cas de contrôle.",
  },
};
