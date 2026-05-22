import type { GbphSecteur } from '../types.js';

const LISTE_OFFICIELLE = "https://agriculture.gouv.fr/guides-de-bonnes-pratiques-dhygiene-gbph";
const SOURCE = "Liste officielle des GBPH validés — Ministère de l'Agriculture et de la Souveraineté alimentaire (agriculture.gouv.fr). Les GBPH sont d'application volontaire mais leur usage vaut présomption de conformité au règlement (CE) n° 852/2004.";

const OBLIGATIONS_COMMUNES = [
  "Règlement (CE) n° 852/2004 — plan de maîtrise sanitaire (PMS) et bonnes pratiques d'hygiène (présomption de conformité)",
  "Arrêté du 21 décembre 2009 — températures de conservation et relevés",
  "Règlement (CE) n° 178/2002 — traçabilité (art. 18) et procédures de retrait/rappel (art. 19)",
  "Règlement (UE) n° 1169/2011 (INCO) — information du consommateur sur les allergènes",
  "Décret n° 2011-731 / arrêté du 12 février 2024 — formation hygiène alimentaire obligatoire",
];

const PRIX = "Gratuit en téléchargement sur agriculture.gouv.fr ; version imprimée payante via La Documentation française (vie-publique.fr/catalogue) — prix à vérifier";

export const GBPH_SECTEURS: Record<string, GbphSecteur> = {
  restauration: {
    secteur: "restauration",
    titre: "Guide de bonnes pratiques d'hygiène — Restaurateur",
    editeur: "CGAD (Confédération générale de l'alimentation en détail)",
    annee: 2015,
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "Guide de référence de la restauration commerciale traditionnelle. Couvre la marche en avant, la maîtrise des températures (réception, stockage, cuisson, refroidissement, service), l'hygiène du personnel et des locaux, le plan de nettoyage-désinfection, la traçabilité et la gestion des non-conformités. Sert de base à la rédaction du PMS.",
    points_cles: [
      "Marche en avant et séparation secteur propre / secteur souillé",
      "Maîtrise des températures et de la chaîne du froid",
      "Refroidissement rapide (+63 °C → +10 °C en moins de 2 h)",
      "Plan de nettoyage-désinfection et autocontrôles",
      "Traçabilité et gestion des allergènes",
    ],
    obligations_liees: OBLIGATIONS_COMMUNES,
    source: SOURCE,
  },

  boucherie: {
    secteur: "boucherie",
    titre: "Guide de bonnes pratiques d'hygiène — Boucherie (plusieurs tomes)",
    editeur: "CFBCT (Confédération française de la boucherie, boucherie-charcuterie, traiteurs), via CGAD",
    annee: "1999 (révisions ultérieures — à vérifier)",
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "Guide dédié à la boucherie artisanale de détail : réception et traçabilité des viandes, maîtrise du froid, découpe et transformation, hygiène du matériel (billot, hachoir, trancheur), gestion des sous-produits animaux. Aborde l'agrément sanitaire en cas de cession à d'autres commerces.",
    points_cles: [
      "Traçabilité des viandes (lot, origine, abattoir)",
      "Maîtrise du froid en découpe (≤ +4 °C, ≤ +2 °C recommandé)",
      "Hygiène et bionettoyage du matériel de découpe",
      "Gestion des sous-produits animaux (catégories C1/C2/C3)",
      "Agrément sanitaire CE si transformation et cession",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Règlement (CE) n° 853/2004 — denrées d'origine animale",
      "Arrêté du 8 juin 2006 — agrément sanitaire (si cession à d'autres commerces)",
    ],
    source: SOURCE,
  },

  charcuterie: {
    secteur: "charcuterie",
    titre: "Guide de bonnes pratiques d'hygiène — Charcuterie artisanale",
    editeur: "CNCT (Confédération nationale des charcutiers-traiteurs et traiteurs)",
    annee: 2016,
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise:
      "https://agriculture.gouv.fr/sites/default/files/documents/pdf/gph_20085920_0001_p000_cle06a617.pdf",
    resume:
      "Guide de la charcuterie artisanale : fabrication des produits de charcuterie (cuisson, salaison, séchage), maîtrise des couples temps/température, risque Listeria monocytogenes, hygiène des ateliers et traçabilité. Inclut l'activité traiteur associée.",
    points_cles: [
      "Maîtrise des barèmes de cuisson et de la salaison",
      "Prévention de Listeria monocytogenes (CE 2073/2005)",
      "Refroidissement rapide et chaîne du froid",
      "Hygiène des ateliers et du matériel",
      "Traçabilité et étiquetage",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Règlement (CE) n° 853/2004 — denrées d'origine animale",
      "Règlement (CE) n° 2073/2005 — critères microbiologiques (Listeria)",
    ],
    source: SOURCE,
  },

  poissonnerie: {
    secteur: "poissonnerie",
    titre: "Guide de bonnes pratiques d'hygiène — Poissonnier détaillant",
    editeur: "CGAD (Confédération générale de l'alimentation en détail)",
    annee: 2001,
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "Guide du poissonnier détaillant : maintien des produits de la pêche sous glace fondante (0 à +2 °C), maîtrise de l'histamine, traçabilité (zone FAO, méthode de pêche), hygiène de l'étal et des eaux, transformation (filetage, écaillage).",
    points_cles: [
      "Conservation sous glace fondante (0 à +2 °C)",
      "Maîtrise de l'histamine (espèces scombridés)",
      "Traçabilité maritime (zone FAO, méthode de pêche, nom scientifique)",
      "Hygiène de l'étal et gestion des eaux",
      "Information sur les produits décongelés",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Règlement (CE) n° 853/2004 — produits de la pêche",
      "Règlement (UE) n° 1379/2013 — étiquetage des produits de la pêche",
      "Règlement (CE) n° 2073/2005 — histamine",
    ],
    source: SOURCE,
  },

  glacier: {
    secteur: "glacier",
    titre: "Guide de bonnes pratiques d'hygiène — Glacier fabricant",
    editeur: "CNGF (Confédération nationale des glaciers de France)",
    annee: 2000,
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "Guide du glacier fabricant : pasteurisation du mix, maturation, surgélation/conservation à -18 °C, vitrine de vente à -12/-14 °C, prévention de Salmonella et Listeria sur les mix à base d'œufs et de produits laitiers.",
    points_cles: [
      "Pasteurisation du mix (85 °C/30 s ou 72 °C/15 s) et enregistrements",
      "Conservation réserve à -18 °C, vitrine -12 à -14 °C",
      "Jamais de recongélation d'un produit décongelé",
      "Prévention Salmonella/Listeria (mix œufs et lait)",
      "Hygiène stricte de la turbine et des ustensiles de portionnage",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Règlement (CE) n° 853/2004 — produits laitiers et ovoproduits",
      "Règlement (CE) n° 2073/2005 — critères microbiologiques",
    ],
    source: SOURCE,
  },

  restauration_collective: {
    secteur: "restauration_collective",
    titre: "Guide de bonnes pratiques d'hygiène — Restauration collective de plein air (et guides associés)",
    editeur: "Confédération « La Jeunesse au Plein Air » (guide de plein air, 2010)",
    annee: 2010,
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "La restauration collective relève des principes du règlement (CE) n° 852/2004 et de l'arrêté du 21 décembre 2009 (liaison chaude/froide, plats témoins). Le GBPH validé spécifique concerne la restauration collective de plein air. La restauration collective à caractère social se réfère aussi aux recommandations nutritionnelles (GEMRCN).",
    points_cles: [
      "Liaison froide (≤ +4 °C) et liaison chaude (≥ +63 °C)",
      "Conservation des plats témoins (80 g, 5 jours, +3 °C)",
      "Maîtrise des grandes quantités et du refroidissement rapide",
      "Traçabilité renforcée et gestion des allergènes en collectivité",
      "Recommandations GEMRCN (volet nutritionnel) selon le public",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Arrêté du 21 décembre 2009 — liaison froide/chaude et plats témoins",
    ],
    note: "Plusieurs guides de restauration collective coexistent ; vérifier le guide applicable à l'activité précise sur la liste officielle agriculture.gouv.fr.",
    source: SOURCE,
  },

  boulangerie: {
    secteur: "boulangerie",
    titre: "GBPH boulangerie — non publié à ce jour dans la liste officielle",
    editeur: "à vérifier",
    annee: "à vérifier",
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "Aucun GBPH « boulangerie » distinct ne figure dans la liste officielle des guides validés à la date de vérification. Les boulangeries-pâtisseries appliquent les principes du règlement (CE) n° 852/2004 (PMS) ; pour la partie pâtisserie/crèmes, se référer aux pratiques du secteur pâtisserie et à la maîtrise des produits à la crème (DLC courte, +3 °C).",
    points_cles: [
      "Application du règlement (CE) n° 852/2004 et rédaction d'un PMS",
      "Maîtrise des préparations à la crème (risque Salmonella, +3 °C, DLC ≤ 48 h)",
      "Hygiène du pétrin, du four et de la chambre de pousse",
      "Gestion des allergènes (gluten, œufs, lait, fruits à coque)",
      "Conservation des matières premières (farine, levure, beurre)",
    ],
    obligations_liees: OBLIGATIONS_COMMUNES,
    note: "À vérifier : aucun GBPH boulangerie validé identifié. Consulter la liste officielle à jour sur agriculture.gouv.fr/guides-de-bonnes-pratiques-dhygiene-gbph.",
    source: SOURCE,
  },

  fromagerie: {
    secteur: "fromagerie",
    titre: "GBPH produits laitiers / fromages fermiers — à vérifier dans la liste officielle",
    editeur: "à vérifier (fédérations laitières / FNEC)",
    annee: "à vérifier",
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "Pour la transformation et l'affinage fromagers, un guide « produits laitiers / fromages fermiers » peut exister selon l'activité ; sa validation est à vérifier sur la liste officielle. Le risque dominant est Listeria monocytogenes (CE 2073/2005), avec plan d'autocontrôles, maîtrise de l'affinage (température/hygrométrie) et de l'agrément sanitaire le cas échéant.",
    points_cles: [
      "Plan d'autocontrôles Listeria monocytogenes (CE 2073/2005)",
      "Maîtrise de l'affinage (température et hygrométrie par famille)",
      "Surveillance du lait cru et des couples temps/température",
      "Agrément sanitaire CE si cession à d'autres commerces",
      "Hygiène des caves et du matériel de fabrication",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Règlement (CE) n° 853/2004 — produits laitiers",
      "Règlement (CE) n° 2073/2005 — critères microbiologiques (Listeria)",
    ],
    note: "À vérifier : validation et référence exactes du guide sur agriculture.gouv.fr/guides-de-bonnes-pratiques-dhygiene-gbph.",
    source: SOURCE,
  },

  traiteur: {
    secteur: "traiteur",
    titre: "GBPH traiteur — couvert par « Charcuterie artisanale » (CNCT) ou guide traiteur selon activité",
    editeur: "CNCT (charcutiers-traiteurs) — guide traiteur spécifique à vérifier",
    annee: "à vérifier",
    pages: "à vérifier",
    prix_eur: PRIX,
    lien_documentation_francaise: LISTE_OFFICIELLE,
    resume:
      "L'activité traiteur artisanale est en partie couverte par le GBPH « Charcuterie artisanale » (CNCT). Pour les traiteurs organisateurs de réception, vérifier l'existence d'un guide dédié sur la liste officielle. Points critiques : refroidissement rapide, liaison froide/chaude, transport réfrigéré et plats témoins en événementiel.",
    points_cles: [
      "Refroidissement rapide (+63 °C → +10 °C en moins de 2 h)",
      "Liaison froide (≤ +4 °C) et transport réfrigéré tracé",
      "Plats témoins fortement recommandés en événementiel",
      "Maîtrise des grandes quantités et de la marche en avant",
      "Traçabilité et gestion des allergènes",
    ],
    obligations_liees: [
      ...OBLIGATIONS_COMMUNES,
      "Règlement (CE) n° 853/2004 — denrées d'origine animale",
      "Arrêté du 21 décembre 2009 — liaison froide/chaude, transport, plats témoins",
    ],
    note: "À vérifier : guide traiteur dédié sur la liste officielle agriculture.gouv.fr. Le guide « Charcuterie artisanale » couvre une partie de l'activité.",
    source: SOURCE,
  },
};
