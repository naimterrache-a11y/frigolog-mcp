import type { ActionCorrective } from '../types.js';

export const ACTIONS_CORRECTIVES: ActionCorrective[] = [
  {
    id: "temperature",
    intitule: "Température frigo trop haute (> +4 °C en positif, > -18 °C en négatif)",
    gravite: "moyenne",
    action_immediate: [
      "Vérifier que le frigo n'est pas en mode dégivrage automatique (cycle normal de 30 min à 2 h)",
      "Contrôler la fermeture de la porte et la présence d'éventuelles ouvertures prolongées récentes",
      "Vérifier l'encombrement intérieur (l'air doit circuler — ne pas obstruer les bouches de soufflage)",
      "Si l'écart persiste plus de 30 min : déplacer les produits sensibles dans un autre frigo conforme",
      "Noter la température mesurée, l'heure, l'opérateur et l'action prise",
    ],
    action_documentaire: [
      "Inscrire l'incident dans le registre des non-conformités du PMS (date, heure, équipement, T° relevée)",
      "Renseigner l'action corrective appliquée (dégivrage, maintenance, déplacement produits)",
      "Conserver la fiche signée 12 mois minimum",
    ],
    delai_resolution:
      "Retour à T° conforme sous 2 h maximum. Au-delà : intervention SAV obligatoire.",
    quand_alerter_ddpp:
      "Pas d'obligation de signalement DDPP pour un dépassement ponctuel résolu rapidement. Signalement obligatoire si T° > +8 °C maintenue plus de 2 h avec produits à risque (viandes, produits laitiers, produits de la mer) — risque de TIAC.",
    exemple_fiche_correction:
      "Le 06/05/2026 à 09:15, frigo Cuisine 2 relevé à +7,2 °C. Vérification : porte fermée, dégivrage non en cours. Produits déplacés vers frigo Réserve 1 (+2,8 °C). Appel SAV à 09:30. Réparation 14:00 — joint de porte HS remplacé. Retour T° conforme +3,1 °C à 15:30. Signé : Nadia, cheffe de partie.",
  },
  {
    id: "dlc_depassee",
    intitule: "Produit périmé découvert en stock (DLC dépassée)",
    gravite: "moyenne",
    action_immediate: [
      "Retirer immédiatement le produit du stock et l'isoler en zone DLC dépassée (étagère identifiée 'À DÉTRUIRE')",
      "Vérifier l'ensemble des produits de la même famille pour exclure une dérive systémique",
      "Détruire ou retourner au fournisseur selon les conditions du contrat",
      "Documenter la destruction (registre, ou en cas de retour : bon de retour signé)",
    ],
    action_documentaire: [
      "Inscrire dans le registre du PMS : date, produit, lot, quantité, DLC, action (destruction/retour)",
      "Signer la fiche par le manager et l'opérateur",
      "Conserver les bons de destruction ou retour fournisseur 12 mois",
    ],
    delai_resolution:
      "Retrait sous 30 minutes. Destruction documentée sous 24 h.",
    quand_alerter_ddpp:
      "Pas de signalement DDPP requis si retrait en interne avant service. Obligation de retrait actif et de signalement à la DGCCRF (formulaire SignalConso) si le produit a été servi à des consommateurs.",
    exemple_fiche_correction:
      "Le 06/05/2026, découverte en chambre froide d'un lot de saumon fumé Marque X — DLC 04/05/2026 dépassée. Quantité : 1,2 kg. Retrait immédiat 11:20. Destruction documentée 11:45 (poubelle scellée + photo). Vérification de tous les saumons : aucun autre produit hors DLC. Signé : Karim, second.",
  },
  {
    id: "rupture_chaine_froid",
    intitule: "Rupture de chaîne du froid à la réception (livraison à T° excessive)",
    gravite: "critique",
    action_immediate: [
      "Refuser la livraison sur place, ne pas signer le bon de livraison ou y mentionner explicitement la non-conformité",
      "Mesurer la température au cœur du produit avec un thermomètre étalonné (ne pas se fier à la T° d'air seule)",
      "Photographier le bon de livraison, la T° relevée et l'état de l'emballage",
      "Contacter immédiatement le fournisseur pour formaliser le refus",
      "Si la livraison ne peut être refusée totalement : mettre en quarantaine et déclencher analyse",
    ],
    action_documentaire: [
      "Annoter le bon de livraison : 'Refusé pour non-conformité — T° relevée X °C à H:MM' + signature opérateur",
      "Conserver une copie du BL avec annotations dans le PMS (registre des non-conformités fournisseur)",
      "Envoyer un email récapitulatif au fournisseur sous 24 h avec photos en pièces jointes",
    ],
    delai_resolution:
      "Refus immédiat à réception. Litige fournisseur réglé sous 7 jours.",
    quand_alerter_ddpp:
      "Pas d'alerte DDPP si refus immédiat. Alerte DGCCRF si défaillance répétée du fournisseur (3 incidents en 6 mois) ou si suspicion de fraude organisée.",
    exemple_fiche_correction:
      "Le 06/05/2026, livraison fournisseur Métro 08:30. Carton de viandes fraîches : T° au cœur d'un steak +9,4 °C (limite : +4 °C). Livraison refusée sur place, BL annoté 'Refus chaîne du froid rompue +9,4 °C 08:30 — Naïm'. Photos prises. Email envoyé à Métro 09:15 — accord pour avoir + relivraison conforme à 14:00.",
  },
  {
    id: "livraison_non_conforme",
    intitule:
      "Livraison non conforme (emballage abîmé, DLC trop courte, produit absent ou erroné)",
    gravite: "moyenne",
    action_immediate: [
      "Identifier précisément la non-conformité (emballage percé, DLC < 5 jours, mauvaise référence, quantité erronée)",
      "Décider du sort du produit : refus total, refus partiel ou acceptation avec réserve",
      "Annoter le bon de livraison avec la nature précise de la réserve",
      "Photographier le défaut constaté",
      "Contacter le fournisseur sous 24 h",
    ],
    action_documentaire: [
      "Bon de livraison signé avec mention 'sous réserve' et description précise",
      "Conserver les photos dans le dossier traçabilité fournisseur",
      "Inscrire au registre des non-conformités fournisseurs (PMS)",
    ],
    delai_resolution: "Litige réglé sous 7 jours ouvrés.",
    quand_alerter_ddpp:
      "Pas d'alerte DDPP requise. Alerte DGCCRF si fraude commerciale soupçonnée (faux étiquetage, faux poids, faux origine).",
    exemple_fiche_correction:
      "Le 06/05/2026, livraison fruits & légumes Pomona. Lot de fraises gariguette commandé 10 kg, livré 7 kg avec une barquette écrasée. BL annoté 'Réserve : 3 kg manquants + 1 barquette écrasée'. Photo jointe. Avoir fournisseur reçu sous 48 h.",
  },
  {
    id: "nuisibles",
    intitule: "Présence active de nuisibles (rongeurs, blattes, mouches en quantité)",
    gravite: "critique",
    action_immediate: [
      "Fermer immédiatement la zone concernée et retirer tous les produits exposés",
      "Détruire les denrées potentiellement contaminées (contact direct ou proximité immédiate)",
      "Contacter en urgence le prestataire de désinsectisation/dératisation (intervention sous 24 h)",
      "Procéder à un nettoyage et désinfection renforcés de la zone (sols, surfaces, matériel)",
      "Identifier et boucher les points d'entrée potentiels (fissures, conduits, sous-portes)",
    ],
    action_documentaire: [
      "Registre des incidents : date, nature de l'infestation (espèce, ampleur), zone touchée, produits détruits",
      "Bon d'intervention du prestataire conservé en pièce justificative",
      "Mise à jour du contrat de lutte contre les nuisibles (renforcement de la fréquence)",
    ],
    delai_resolution:
      "Intervention prestataire sous 24 h. Levée de l'incident sous 7 jours après vérification de l'absence de récidive.",
    quand_alerter_ddpp:
      "Obligation de signalement DDPP si infestation active majeure non maîtrisée sous 48 h, ou si présence dans une zone de production. Signalement systématique à l'ARS en cas de TIAC associée.",
    exemple_fiche_correction:
      "Le 06/05/2026 18:00, présence de souris constatée en réserve sèche (crottes + sachet de riz percé). Zone fermée immédiatement. 3 sacs de riz et 2 paquets de pâtes détruits. Appel ATBlatt 18:15 — intervention 09:00 le 07/05. Pose de pièges + bouchage d'un trou en plinthe. Re-nettoyage complet de la réserve. Suivi 7 jours sans nouvelle trace.",
  },
  {
    id: "nettoyage",
    intitule: "Plan de nettoyage non réalisé ou retardé",
    gravite: "faible",
    action_immediate: [
      "Identifier le motif du retard ou de l'omission (oubli, sous-effectif, panne de matériel, indisponibilité d'un produit)",
      "Effectuer le nettoyage manquant dès que possible — au plus tard avant la prochaine prise de service",
      "Si la zone a été utilisée entre-temps : nettoyage renforcé (désinfection complète + rinçage à l'eau chaude)",
    ],
    action_documentaire: [
      "Inscrire dans le plan de nettoyage la mention 'rattrapage' avec la cause du retard",
      "Signature de l'opérateur ayant effectué le rattrapage",
      "Si récurrence : revoir l'organisation de l'équipe ou renforcer la planification",
    ],
    delai_resolution: "Rattrapage sous 24 h maximum.",
    quand_alerter_ddpp:
      "Aucune obligation de signalement. Mais en cas de contrôle DDPP, un retard isolé documenté avec rattrapage est mieux toléré qu'une absence de traçabilité.",
    exemple_fiche_correction:
      "Le 06/05/2026, plan de nettoyage du soir non signé pour la plonge (cause : oubli, fin de service tardive). Constaté le 07/05 au matin. Nettoyage renforcé effectué 07:30 — désinfection complète + brossage évier. Signé : Pauline, plongeuse. Note : revoir checklist fin de service.",
  },
];
