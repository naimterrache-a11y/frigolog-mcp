import type { McpResource } from '../types.js';

// MCP resources — long structured reference texts the agent can read on demand.
// These are pedagogical SUMMARIES with article references, NOT the integral legal
// texts (which remain on Légifrance / EUR-Lex). Each text ends with its official link.

const CE_852: McpResource = {
  uri: 'haccp://reglementation/ce-852-2004',
  name: 'Règlement (CE) n° 852/2004 — Résumé structuré',
  description:
    "Résumé pédagogique du règlement (CE) n° 852/2004 relatif à l'hygiène des denrées alimentaires : objet, champ d'application, obligation HACCP, enregistrement, bonnes pratiques d'hygiène (annexes I et II). Avec références aux articles.",
  mimeType: 'text/markdown',
  text: `# Règlement (CE) n° 852/2004 — hygiène des denrées alimentaires

> Résumé structuré (non officiel). Texte intégral : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0852

## Objet
Le règlement (CE) n° 852/2004 du 29 avril 2004 fixe les **règles générales d'hygiène** que doivent respecter tous les exploitants du secteur alimentaire (ESA). C'est le texte socle du « Paquet hygiène » européen, complété par le règlement (CE) n° 853/2004 (denrées d'origine animale) et le règlement (CE) n° 178/2002 (sécurité générale, traçabilité).

## Champ d'application
S'applique à **toutes les étapes** de la production, de la transformation et de la distribution des denrées alimentaires, **sauf** la production primaire pour usage domestique privé. Concerne donc restaurants, métiers de bouche, commerces de détail, fabricants, transporteurs, etc.

## Principes fondateurs
- **Responsabilité de l'exploitant** (art. 1) : la sécurité sanitaire incombe en premier lieu à l'ESA.
- **Approche fondée sur le risque** : maîtrise des dangers tout au long de la chaîne (« de la fourche à la fourchette »).

## Obligations principales
- **Article 4 — Bonnes pratiques d'hygiène (BPH)** : respect des prescriptions générales d'hygiène figurant en **annexe I** (production primaire) et **annexe II** (autres étapes : locaux, équipements, déchets, alimentation en eau, hygiène du personnel, denrées, conditionnement, traitement thermique, formation).
- **Article 5 — Procédures fondées sur les principes HACCP** : tout ESA (sauf production primaire) doit mettre en place, appliquer et maintenir des procédures permanentes fondées sur les **7 principes HACCP** (analyse des dangers, CCP, limites critiques, surveillance, actions correctives, vérification, documentation). La souplesse est admise pour les petites structures via les **guides de bonnes pratiques d'hygiène (GBPH)**.
- **Article 6 — Enregistrement / agrément** : tout établissement doit être **enregistré** auprès de l'autorité compétente (en France : déclaration à la DDecPP/DDPP). L'**agrément sanitaire** (règlement 853/2004) est requis en cas de manipulation de denrées d'origine animale destinées à d'autres commerces.

## Annexe II (points clés pour la restauration et les métiers de bouche)
1. Locaux : propres, en bon état, conçus pour permettre le nettoyage et éviter les contaminations (marche en avant).
2. Locaux de préparation : surfaces lavables, lave-mains équipés, séparation propre/souillé.
3. Équipements : matériaux aptes au contact alimentaire, nettoyables et désinfectables.
4. Déchets : évacuation et stockage hygiéniques.
5. Eau : potable.
6. Hygiène du personnel : propreté, tenue adaptée, exclusion des personnes malades.
7. Denrées : protection contre la contamination, maîtrise des températures.
8. Conditionnement / emballage : matériaux propres et adaptés.
9. Traitement thermique : maîtrise des couples temps/température.
10. **Formation** : le personnel doit être formé/encadré en matière d'hygiène alimentaire.

## Articulation
- **Règlement (CE) n° 853/2004** : règles spécifiques aux denrées d'origine animale (agrément, traçabilité renforcée).
- **Règlement (CE) n° 178/2002** : traçabilité (art. 18) et procédures de retrait/rappel (art. 19).
- **Règlement (CE) n° 2073/2005** : critères microbiologiques.
- En France : **arrêté du 21 décembre 2009** (températures, commerce de détail) et **Code rural** (sanctions, art. L.231-1 à L.237-3).

## Sanctions
Les manquements relèvent des contrôles officiels (DDPP) et peuvent entraîner observation, mise en demeure, procès-verbal ou fermeture administrative (voir Code rural et arrêté du 21 décembre 2009).

## En pratique
La conformité au règlement 852/2004 se matérialise par un **Plan de Maîtrise Sanitaire (PMS)** : BPH + plan HACCP + traçabilité/gestion des non-conformités. L'usage d'un **GBPH validé** vaut présomption de conformité.

_Source officielle : EUR-Lex, CELEX 32004R0852._`,
};

const ARRETE_2009: McpResource = {
  uri: 'haccp://reglementation/arrete-21-decembre-2009',
  name: 'Arrêté du 21 décembre 2009 — Températures réglementaires',
  description:
    "Résumé de l'arrêté du 21 décembre 2009 (règles sanitaires du commerce de détail) : tableau des températures de conservation par catégorie, tolérances, liaison froide/chaude, transport.",
  mimeType: 'text/markdown',
  text: `# Arrêté du 21 décembre 2009 — températures réglementaires

> Résumé structuré (non officiel). Texte intégral : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000021573483

## Objet
Fixe les **règles sanitaires** applicables aux activités de **commerce de détail, d'entreposage et de transport** de produits d'origine animale et de denrées en contenant. C'est la référence française pour les **températures de conservation**.

## Températures de conservation (valeurs usuelles)
| Catégorie | Température |
|---|---|
| Viande hachée | ≤ +2 °C |
| Viandes fraîches (volailles, porc, agneau, bœuf), abats | ≤ +4 °C (abats ≤ +3 °C) |
| Préparations de viande, charcuterie | ≤ +4 °C |
| Produits de la pêche frais | 0 à +2 °C (sous glace fondante) |
| Produits laitiers frais, plats cuisinés réfrigérés | ≤ +4 °C (plats cuisinés souvent ≤ +3 °C) |
| Pâtisseries à la crème | ≤ +3 °C |
| Produits congelés / surgelés | ≤ -18 °C |
| Glaces et crèmes glacées | ≤ -18 °C (vitrine -12 à -14 °C) |
| Préparations chaudes en maintien / service | ≥ +63 °C |

## Procédés
- **Refroidissement rapide** : de +63 °C à +10 °C en **moins de 2 heures** (cellule de refroidissement recommandée).
- **Remise/maintien en température** : +63 °C à cœur.
- **Liaison froide** : ≤ +4 °C ; **liaison chaude** : ≥ +63 °C.

## Tolérances et cas particuliers
- Tolérances ponctuelles admises lors de la manipulation, de la livraison ou en vitrine de vente courte durée, sous réserve de ne pas compromettre la sécurité.
- Les températures fixées par le **fabricant** sur l'étiquette priment lorsqu'elles sont plus strictes.
- Les denrées non préemballées exposées à la vente doivent respecter ces seuils.

## Enregistrements
Relevés de température horodatés et conservés (preuve en cas de contrôle DDPP). Au moins deux relevés par jour recommandés (matin/soir) sur les enceintes froides.

_Source officielle : Légifrance, JORFTEXT000021573483._`,
};

const INCO_1169: McpResource = {
  uri: 'haccp://reglementation/reglement-inco-1169-2011',
  name: 'Règlement INCO (UE) n° 1169/2011 — Obligations allergènes',
  description:
    "Résumé du règlement INCO (UE) n° 1169/2011 : information du consommateur, liste des 14 allergènes (annexe II), affichage obligatoire en restauration, mentions obligatoires.",
  mimeType: 'text/markdown',
  text: `# Règlement (UE) n° 1169/2011 (INCO) — information du consommateur

> Résumé structuré (non officiel). Texte intégral : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169

## Objet
Le règlement « INCO » (Information du consommateur) harmonise l'**information sur les denrées alimentaires**. Applicable depuis le **13 décembre 2014**. Il rend obligatoire l'information sur les **allergènes**, y compris pour les denrées **non préemballées** (restauration, vente à la coupe).

## Les 14 allergènes à déclaration obligatoire (annexe II)
1. Céréales contenant du **gluten** (blé, seigle, orge, avoine…)
2. **Crustacés**
3. **Œufs**
4. **Poissons**
5. **Arachides**
6. **Soja**
7. **Lait** (y compris lactose)
8. **Fruits à coque** (amande, noisette, noix, cajou, pécan, Brésil, pistache, macadamia)
9. **Céleri**
10. **Moutarde**
11. **Graines de sésame**
12. **Anhydride sulfureux et sulfites** (> 10 mg/kg ou 10 mg/L)
13. **Lupin**
14. **Mollusques**

## Obligations en restauration (denrées non préemballées)
- Information sur la **présence d'allergènes** dans les plats, **par écrit** et accessible au consommateur (carte, support, ardoise, classeur), ou modalité d'information affichée.
- En France, l'information peut être disponible **sur demande** à condition qu'un **écriteau** signale où la trouver (décret n° 2015-447).
- Procédure interne pour éviter les **contaminations croisées** et personnel capable de répondre.

## Mentions obligatoires (denrées préemballées, rappel)
Dénomination, liste des ingrédients (allergènes mis en évidence), quantité de certains ingrédients (QUID), quantité nette, DDM/DLC, conditions de conservation, nom/adresse de l'exploitant, origine si requise, mode d'emploi, déclaration nutritionnelle, titre alcoométrique le cas échéant.

## Sanctions
Manquement à l'information allergènes : contravention pouvant aller jusqu'à **1 500 €** par produit non conforme (5e classe), doublée en cas de récidive ; responsabilité civile engagée en cas de réaction allergique.

_Source officielle : EUR-Lex, CELEX 32011R1169._`,
};

const PRINCIPES_7: McpResource = {
  uri: 'haccp://guide/7-principes-haccp',
  name: 'Les 7 principes HACCP expliqués',
  description:
    "Explication claire des 7 principes de la méthode HACCP (Codex Alimentarius / règlement CE 852/2004 art. 5), avec un exemple concret en restauration pour chacun.",
  mimeType: 'text/markdown',
  text: `# Les 7 principes HACCP expliqués

> HACCP = *Hazard Analysis Critical Control Points*. Méthode du Codex Alimentarius, rendue obligatoire par l'**article 5 du règlement (CE) n° 852/2004**. La démarche complète comporte 12 étapes, dont les 7 principes ci-dessous.

## Principe 1 — Analyse des dangers
Identifier les dangers **biologiques** (bactéries, virus, parasites), **chimiques** (allergènes, résidus) et **physiques** (corps étrangers) à chaque étape, et évaluer leur gravité/probabilité.
*Exemple : à la réception du poulet cru, danger Salmonella et Campylobacter.*

## Principe 2 — Déterminer les points critiques (CCP)
Identifier les étapes où la maîtrise est **essentielle** pour éliminer ou réduire un danger à un niveau acceptable.
*Exemple : la cuisson de la volaille est un CCP (destruction des pathogènes).*

## Principe 3 — Fixer les limites critiques
Définir des seuils mesurables séparant l'acceptable de l'inacceptable.
*Exemple : cuisson de la volaille à **74 °C à cœur**.*

## Principe 4 — Surveiller les CCP
Mettre en place une surveillance des limites critiques (qui, quoi, comment, quand).
*Exemple : relevé de la température à cœur au thermomètre-sonde à chaque fournée.*

## Principe 5 — Actions correctives
Définir à l'avance ce qu'on fait si une limite critique n'est pas respectée.
*Exemple : si la volaille n'atteint pas 74 °C, prolonger la cuisson ; tracer l'incident.*

## Principe 6 — Vérification
S'assurer que le système HACCP fonctionne (contrôles, étalonnage des sondes, analyses, audits internes).
*Exemple : étalonner le thermomètre, analyser périodiquement les surfaces.*

## Principe 7 — Documentation et enregistrements
Conserver les preuves : procédures, relevés, fiches de non-conformité.
*Exemple : registre des cuissons et des températures, archivé pour la DDPP.*

## En pratique
Les 7 principes structurent le **plan HACCP**, l'un des trois volets du **Plan de Maîtrise Sanitaire (PMS)**. Les petites structures peuvent s'appuyer sur un **GBPH validé** pour appliquer ces principes de façon proportionnée.

_Référence : Codex Alimentarius (CAC/RCP 1-1969) et article 5 du règlement (CE) n° 852/2004._`,
};

const PMS_STRUCTURE: McpResource = {
  uri: 'haccp://guide/pms-structure-type',
  name: "Structure type d'un Plan de Maîtrise Sanitaire (PMS)",
  description:
    "Les sections obligatoires d'un Plan de Maîtrise Sanitaire (PMS), ce que chacune doit contenir et comment le présenter à un inspecteur DDPP.",
  mimeType: 'text/markdown',
  text: `# Structure type d'un Plan de Maîtrise Sanitaire (PMS)

> Le PMS est le document qui décrit les dispositions prises par l'établissement pour assurer la sécurité sanitaire des aliments. Il est exigé par le **règlement (CE) n° 852/2004** et constitue le **premier document demandé** lors d'un contrôle DDPP.

## Volet 1 — Bonnes pratiques d'hygiène (BPH / prérequis)
- **Personnel** : plan de formation hygiène, attestations HACCP, tenue, lavage des mains, suivi médical.
- **Locaux et équipements** : plan des locaux, marche en avant, plan de **nettoyage-désinfection** (postes, fréquences, produits, fiches techniques + FDS).
- **Maîtrise du froid et du chaud** : relevés de température, procédures.
- **Eau** : potabilité.
- **Lutte contre les nuisibles** : contrat ou procédure, plan de pose, bordereaux.
- **Gestion des déchets**.

## Volet 2 — Plan HACCP
- **Champ d'étude** et diagramme de fabrication.
- **Analyse des dangers** (7 principes) et identification des **CCP**.
- **Limites critiques**, surveillance, **actions correctives**.
- Tableau HACCP synthétique par étape.

## Volet 3 — Traçabilité et gestion des non-conformités
- **Traçabilité** amont (fournisseurs, BL, étiquettes, lots) et interne.
- **Procédure de retrait/rappel** (art. 19 du règlement 178/2002 ; cross-check RappelConso).
- **Registre des non-conformités** et actions correctives associées.
- Gestion des **alertes** et information des autorités.

## Annexes utiles
Fiches techniques produits, plannings de nettoyage signés, relevés de température, attestations de formation, résultats d'analyses, contrats prestataires, plan de lutte contre les nuisibles.

## Présentation à l'inspecteur
- PMS **à jour, daté, signé**, accessible immédiatement (classeur ou format numérique).
- Les **enregistrements** (relevés, nettoyages, traçabilité) doivent être **cohérents** avec le PMS et couvrir les 30 derniers jours au minimum.
- Un dossier **honnête** (avec mention « non utilisé » pour un module non employé) est mieux perçu qu'un dossier incomplet ou faussé.

_Références : règlement (CE) n° 852/2004 (art. 4 et 5), règlement (CE) n° 178/2002 (art. 18-19), arrêté du 21 décembre 2009._`,
};

export const RESOURCES: McpResource[] = [
  CE_852,
  ARRETE_2009,
  INCO_1169,
  PRINCIPES_7,
  PMS_STRUCTURE,
];

export const RESOURCE_BY_URI: Record<string, McpResource> = Object.fromEntries(
  RESOURCES.map((r) => [r.uri, r]),
);
