import type { SanctionsDdpp } from '../types.js';

export const SANCTIONS_DDPP: SanctionsDdpp = {
  niveaux: [
    {
      niveau: "Observation",
      gravite: "mineure",
      declencheurs: [
        "Relevés de température incomplets sur moins de 7 jours consécutifs",
        "Étiquetage DLC incomplet sur quelques produits",
        "Plan de nettoyage non signé sur moins de 3 jours",
        "Erreurs ponctuelles sur la traçabilité fournisseurs",
      ],
      consequences:
        "Mention dans le rapport d'inspection sans suite immédiate. Délai de mise en conformité accordé.",
      delai_conformite: "1 à 3 mois",
      recours:
        "Aucun recours nécessaire. Mettre en conformité avant le prochain contrôle.",
    },
    {
      niveau: "Mise en demeure",
      gravite: "majeure",
      declencheurs: [
        "Absence de relevés de température sur plus de 7 jours",
        "Produits périmés en quantité significative",
        "Aucune traçabilité fournisseur",
        "Plan de maîtrise sanitaire (PMS) absent",
        "Non-conformité répétée depuis le contrôle précédent",
        "Absence d'attestation de formation HACCP",
      ],
      consequences:
        "Obligation légale de mise en conformité dans le délai imparti. Publication possible sur Alim'confiance.",
      delai_conformite: "15 jours à 3 mois",
      amende_possible:
        "Jusqu'à 1 500 € (contravention 5e classe) si non-respect de la mise en demeure dans le délai imparti",
      recours:
        "Recours gracieux auprès du préfet dans les 2 mois. Recours contentieux au tribunal administratif.",
    },
    {
      niveau: "Procès-verbal",
      gravite: "critique",
      declencheurs: [
        "Rupture de chaîne du froid entraînant un risque sanitaire avéré",
        "Produits périmés en grande quantité ou présentant un danger immédiat",
        "Refus de présenter les documents à l'inspecteur",
        "Obstruction au contrôle",
        "Récidive après mise en demeure non respectée",
      ],
      consequences:
        "Transmission au procureur de la République. Saisie et destruction des produits non conformes.",
      amende:
        "De 1 500 € à 15 000 € selon la gravité (article L.237-1 du Code rural et de la pêche maritime)",
      emprisonnement_possible:
        "Jusqu'à 2 ans en cas de mise en danger de la santé publique (article L.237-2 du Code rural)",
      recours: "Défense pénale. Avocat recommandé.",
    },
    {
      niveau: "Fermeture administrative",
      gravite: "critique",
      declencheurs: [
        "Danger immédiat et grave pour la santé publique",
        "Infestation de nuisibles active (rongeurs, blattes) en zone de production",
        "Absence totale de conditions d'hygiène élémentaires",
        "Refus réitéré de se conformer aux mises en demeure successives",
        "Toxi-infection alimentaire collective (TIAC) avec établissement identifié comme source",
      ],
      consequences:
        "Fermeture immédiate de l'établissement par arrêté préfectoral. Saisie des produits. Publication sur Alim'confiance.",
      duree:
        "Jusqu'à mise en conformité complète vérifiée par re-inspection sur site",
      reouverture:
        "Demande de levée de la mesure après travaux et mise en conformité, suivie d'une re-inspection.",
      amende:
        "Jusqu'à 75 000 € (article L.237-3 du Code rural pour mise en danger délibérée de la santé publique)",
    },
  ],
  base_legale: [
    "Code rural et de la pêche maritime — articles L.231-1 à L.237-3",
    "Règlement (CE) n° 852/2004 — hygiène des denrées alimentaires",
    "Arrêté du 21 décembre 2009 relatif aux règles sanitaires applicables aux activités de commerce de détail",
    "Règlement (CE) n° 882/2004 — contrôles officiels effectués pour assurer la conformité avec la législation alimentaire",
  ],
  conseil_frigolog:
    "Frigolog archive automatiquement tous vos enregistrements HACCP (relevés de température, nettoyages, traçabilité). En cas de contrôle DDPP, votre historique complet est accessible depuis le Mode Contrôle. Ce qui compte le jour d'un contrôle, c'est de pouvoir produire ses preuves immédiatement.",
};
