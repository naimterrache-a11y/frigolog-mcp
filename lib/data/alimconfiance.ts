import type { ScoreAlimconfiance } from '../types.js';

export const SCORE_ALIMCONFIANCE: ScoreAlimconfiance = {
  presentation:
    "Alim'confiance est le dispositif officiel de publication des résultats d'inspection sanitaire des établissements alimentaires français, mis en place par le Ministère de l'Agriculture et de la Souveraineté alimentaire depuis le 3 avril 2017. Il rend publics les niveaux d'hygiène constatés lors des contrôles officiels effectués par les services de la DDPP (Direction Départementale de la Protection des Populations) et de la DGAL.",
  url_officielle: "https://www.alim-confiance.gouv.fr/",
  niveaux: [
    {
      niveau: "Très satisfaisant",
      emoji: "😊",
      signification:
        "L'établissement présente un niveau d'hygiène très satisfaisant. Aucun écart réglementaire significatif n'a été constaté lors de l'inspection.",
      action_requise: "Aucune. Maintenir les bonnes pratiques en place.",
      impact_client:
        "Affichage positif sur le site Alim'confiance. Argument commercial fort, peut être valorisé en vitrine ou sur les supports de communication.",
    },
    {
      niveau: "Satisfaisant",
      emoji: "😐",
      signification:
        "Quelques écarts mineurs ont été constatés, sans risque sanitaire immédiat pour le consommateur. L'établissement reste conforme dans l'ensemble.",
      action_requise:
        "Mise en conformité recommandée avant le prochain contrôle. Pas d'obligation immédiate, mais traçabilité de l'amélioration souhaitable.",
      impact_client:
        "Visible sur Alim'confiance. Peut freiner certains clients très exigeants, mais reste un niveau acceptable.",
    },
    {
      niveau: "À améliorer",
      emoji: "😕",
      signification:
        "Des non-conformités significatives ont été relevées. Un plan d'action correctif est attendu de la part de l'exploitant.",
      action_requise:
        "Mise en conformité obligatoire dans le délai imparti par l'inspecteur. Contrôle de suivi probable dans les 6 mois.",
      impact_client:
        "Affichage public sur Alim'confiance. Impact négatif sur la réputation. Possible vigilance accrue des consommateurs.",
    },
    {
      niveau: "À corriger de manière urgente",
      emoji: "😨",
      signification:
        "Des non-conformités graves ont été constatées avec un risque sanitaire identifié pour le consommateur. Action immédiate requise.",
      action_requise:
        "Mise en demeure préfectorale ou fermeture administrative possibles selon la gravité. Contrôle de suivi systématique sous 1 à 3 mois.",
      impact_client:
        "Publication forcée et immédiate sur Alim'confiance. Risque de fermeture visible publiquement. Impact réputationnel majeur.",
    },
  ],
  criteres_inspection: [
    "Hygiène des denrées alimentaires (température, DLC, traçabilité, contamination croisée)",
    "Hygiène des locaux (propreté, état des sols et murs, ventilation) et du matériel (équipements en bon état, maintenance)",
    "Hygiène du personnel (tenue de travail, lavage des mains, état de santé, formation HACCP)",
    "Respect du Plan de Maîtrise Sanitaire (PMS) et application effective des procédures écrites",
    "Maîtrise des températures à toutes les étapes (réception, stockage froid/chaud, cuisson, service)",
    "Gestion des non-conformités, plan de nettoyage et désinfection, lutte contre les nuisibles",
  ],
  frequence_inspection: {
    generale:
      "En moyenne tous les 3 à 7 ans pour les établissements bien notés et sans antécédent. Variable selon les départements et la pression d'inspection locale.",
    risque_eleve:
      "Tous les 1 à 2 ans pour les établissements ayant obtenu 'À améliorer' ou 'À corriger de manière urgente', ou ayant fait l'objet d'une plainte récente.",
    inopinee:
      "Possible à tout moment, notamment suite à une plainte consommateur, une toxi-infection alimentaire collective (TIAC) déclarée à l'ARS, ou un signalement de la DGCCRF.",
  },
  comment_ameliorer: [
    "Tenir les relevés de température à jour quotidiennement (matin et soir minimum sur tous les frigos et congélateurs)",
    "Archiver le plan de nettoyage signé et daté par les opérateurs à chaque passage",
    "Maintenir la traçabilité fournisseurs sur 6 mois minimum (bons de livraison, étiquettes, photos d'emballages)",
    "Vérifier et dater toutes les DLC, retirer immédiatement les produits dépassés",
    "Former au moins un salarié à l'hygiène alimentaire (formation HACCP 14h obligatoire)",
    "Rédiger, afficher et tenir à jour le Plan de Maîtrise Sanitaire (PMS)",
    "Maintenir un registre des non-conformités avec les actions correctives mises en place",
    "Effectuer des autocontrôles microbiologiques périodiques (surfaces, mains, produits finis)",
  ],
  frigolog_et_alimconfiance:
    "Frigolog génère automatiquement les preuves de conformité attendues lors d'un contrôle : relevés de température horodatés, validations de nettoyage, traçabilité fournisseurs archivée, étiquettes DLC normées. Le jour du contrôle, le dossier complet est accessible depuis le Mode Contrôle.",
};
