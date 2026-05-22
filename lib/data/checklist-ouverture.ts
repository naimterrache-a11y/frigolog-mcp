import type { ChecklistItem } from '../types.js';

function c(
  categorie: string,
  verification: string,
  critere_ok: string,
  action_si_ko: string,
  obligatoire: boolean,
): ChecklistItem {
  return { categorie, verification, critere_ok, action_si_ko, obligatoire };
}

export const SOURCE_CHECKLIST =
  "Bonnes pratiques HACCP + Guide des Bonnes Pratiques d'Hygiène (DGAL) + Arrêté du 21 décembre 2009 (relevés de température) + Règlement (CE) n° 852/2004. Checklist modèle indicative — à adapter au PMS de l'établissement.";

// Socle commun à tous les établissements alimentaires — 21 items, 5 catégories.
export const CHECKLIST_COMMUNE: ChecklistItem[] = [
  // 1. Contrôles visuels
  c("Contrôles visuels", "Propreté générale des locaux (sols, surfaces, plans de travail)", "Aucune souillure visible ; plan de nettoyage de la veille réalisé et signé", "Refaire le nettoyage manquant et le tracer avant ouverture", true),
  c("Contrôles visuels", "État et propreté des équipements (fours, frigos, plonge)", "Équipements propres et fonctionnels", "Nettoyer ou signaler la panne ; isoler l'équipement non conforme", true),
  c("Contrôles visuels", "Absence de nuisibles (pièges, traces, déjections)", "Aucune trace ; pièges en place et entretenus", "Isoler la zone, retirer les denrées exposées, contacter le prestataire de dératisation", true),
  c("Contrôles visuels", "Fonctionnement des lave-mains (eau chaude, savon, essuie-mains)", "Savon bactéricide et essuie-mains à usage unique disponibles, eau chaude", "Réapprovisionner avant la prise de poste", true),
  c("Contrôles visuels", "Évacuation des déchets de la veille / local déchets", "Local déchets propre, poubelles vidées, couvercles en place", "Évacuer et nettoyer le local déchets", false),

  // 2. Relevés de température
  c("Relevés de température", "Relevé des réfrigérateurs et armoires positives", "≤ +4 °C", "Déplacer les denrées sensibles vers une enceinte conforme, déclencher l'action corrective, appeler le SAV", true),
  c("Relevés de température", "Relevé des congélateurs et chambres négatives", "≤ -18 °C", "Vérifier l'état des denrées, action corrective, ne pas recongeler un produit décongelé", true),
  c("Relevés de température", "Relevé des vitrines réfrigérées", "≤ +4 °C (≤ +8 °C pour fromages affinés)", "Régler la vitrine, déplacer les denrées", true),
  c("Relevés de température", "Thermomètre / sonde fonctionnel et étalonné", "Thermomètre opérationnel, étalonnage à jour", "Utiliser un thermomètre de secours, planifier l'étalonnage", true),

  // 3. Vérifications de stock
  c("Vérifications de stock", "Contrôle des DLC/DLUO des produits ouverts et stockés", "Aucun produit périmé ; entamés étiquetés et datés", "Retirer immédiatement et tracer les produits périmés (registre PMS)", true),
  c("Vérifications de stock", "Rotation des stocks selon le principe FEFO (premier périmé, premier sorti)", "Produits classés par DLC croissante", "Reclasser les stocks", false),
  c("Vérifications de stock", "Vérification des produits faisant l'objet d'un rappel (RappelConso)", "Aucun lot concerné par un rappel en cours", "Isoler et retirer le lot, appliquer la procédure de retrait/rappel", true),
  c("Vérifications de stock", "État des stocks et conformité des denrées (aspect, emballage)", "Stock suffisant, denrées conformes", "Écarter les denrées non conformes, commander le réassort", false),

  // 4. Hygiène du personnel
  c("Hygiène du personnel", "Tenue de travail propre et complète (coiffe, tablier, chaussures)", "Tenue propre, cheveux couverts, pas de tenue de ville en production", "Changer de tenue avant la prise de poste", true),
  c("Hygiène du personnel", "Lavage des mains à la prise de poste", "Lavage effectué, ongles courts et sans vernis, pas de bijoux aux mains", "Rappeler et afficher la procédure de lavage des mains", true),
  c("Hygiène du personnel", "État de santé / plaies couvertes", "Personnel apte ; plaies protégées par pansement détectable (bleu)", "Écarter de la manipulation des denrées tout personnel symptomatique (gastro, plaie infectée)", true),
  c("Hygiène du personnel", "Attestations de formation HACCP et aptitudes médicales à jour", "Au moins une personne formée à l'hygiène alimentaire présente ; suivi médical à jour", "Régulariser la formation et le suivi médical", true),

  // 5. Préparation documentaire
  c("Préparation documentaire", "Classeur / Plan de Maîtrise Sanitaire (PMS) accessible et à jour", "PMS présent, à jour, daté et signé", "Mettre à jour et compléter le PMS", true),
  c("Préparation documentaire", "Affichage / disponibilité de l'information sur les allergènes", "Information allergènes disponible pour la clientèle (carte ou support écrit)", "Mettre l'information allergènes à disposition avant le service", true),
  c("Préparation documentaire", "Registres de traçabilité fournisseurs disponibles (bons de livraison, étiquettes)", "Documents conservés et classés (≥ 6 mois)", "Réclamer et archiver les justificatifs de traçabilité", true),
  c("Préparation documentaire", "Plan de nettoyage du jour prêt et tâches attribuées", "Plan disponible, opérateurs désignés", "Réorganiser l'équipe et planifier les tâches", false),
];

// Items spécifiques ajoutés selon le type d'établissement.
export const CHECKLIST_SPECIFIQUE: Record<string, ChecklistItem[]> = {
  boucherie: [
    c("Vérifications de stock", "Traçabilité des viandes (n° de lot, origine, abattoir, n° d'agrément)", "Étiquetage et traçabilité complets à réception", "Refuser la marchandise non tracée, tracer la non-conformité", true),
    c("Relevés de température", "Température de la chambre froide viandes", "≤ +4 °C (≤ +2 °C recommandé pour la découpe)", "Action corrective, déplacement des viandes", true),
  ],
  poissonnerie: [
    c("Contrôles visuels", "Renouvellement de la glace de l'étal et écoulement des eaux", "Glace fondante propre, évacuation libre", "Renouveler la glace, déboucher l'évacuation", true),
    c("Vérifications de stock", "Fraîcheur des produits de la pêche (aspect, odeur, œil, branchies) et traçabilité (zone FAO)", "Produits frais, étiquetage zone de capture/élevage présent", "Écarter les produits douteux, vérifier l'historique de température", true),
  ],
  glacier: [
    c("Préparation documentaire", "Enregistrements de pasteurisation du mix disponibles", "Cycles de pasteurisation conformes et archivés", "Refaire un cycle conforme, ne pas commercialiser un mix non pasteurisé", true),
  ],
  traiteur: [
    c("Relevés de température", "Contrôle du véhicule réfrigéré et relevé avant tournée", "Liaison froide ≤ +4 °C / liaison chaude ≥ +63 °C", "Reporter la livraison, corriger le groupe froid", true),
  ],
  boulangerie: [
    c("Vérifications de stock", "Conservation des pâtons / produits intermédiaires (DLC, température)", "Pâtons conservés au froid, datés", "Écarter les pâtons hors DLC", false),
  ],
  pizzeria: [
    c("Relevés de température", "Température de la saladette à garnitures", "≤ +4 °C", "Régler la saladette, déplacer les garnitures sensibles", true),
  ],
  fromagerie: [
    c("Relevés de température", "Température et hygrométrie de la cave d'affinage", "Conformes par famille de fromage (relevés quotidiens)", "Ajuster la régulation, tracer l'écart", true),
  ],
};
