# INTEGRATION_ROADMAP — Écosystème Frigolog × MCP HACCP

> Brief d'intégration des 19 tools du MCP `frigolog-haccp` dans l'écosystème Frigolog
> (app, marketing, prospection, vendeurs, emails). Document de référence pour le repo
> principal `frigolog` et le sous-projet `marketing/`.
>
> Version MCP au moment de l'écriture : **2.2.0** (19 tools / 5 resources / 3 prompts).
> Date : 2026-06-01.

---

## ⚠️ P0 BLOQUANT découvert pendant le build 2.2.0 — à vérifier dans l'app principale

Le dataset RappelConso `rappelconso0` (data.economie.gouv.fr) **a été renommé/restructuré**
et renvoie désormais **HTTP 404**. Le MCP a été migré vers `rappelconso-v2-gtin-trie`
(champs renommés : `numero_fiche`, `libelle`, `marque_produit`, `risques_encourus`,
`date_publication`, `sous_categorie_produit`…).

**Action immédiate côté app `frigolog`** : le cross-check RappelConso est un **moat produit**
(simulation DDPP, alertes). Si l'app interroge encore `rappelconso0` ou data.gouv.fr avec
l'ancien schéma, **l'alerte rappels est silencieusement cassée**. Chercher dans le repo
`frigolog` toute occurrence de `rappelconso0` / `categorie_de_produit` / `reference_fiche`
/ `noms_des_produits_concernes` et migrer vers le schéma v2 (cf. `api/mcp.ts` du MCP,
fonction `mapRappelRecord` + `fetchRappelsActifs` pour le mapping exact).

---

## A. Récapitulatif MCP (état post-build 2.2.0)

### 19 tools par catégorie

**Réglementaire (statique, sourcé Légifrance/EUR-Lex/DGAL)** — 11
- `get_haccp_temperatures` · `get_temperatures_cuisson` · `get_regles_dlc`
- `get_documents_controle_ddpp` · `get_allergenes_reglementaires` · `get_sanctions_ddpp`
- `get_formation_haccp_obligatoire` · `get_score_alimconfiance` · `get_actions_correctives`
- `get_guide_bonnes_pratiques_secteur` · `get_seuils_microbiologiques`

**Guide pratique (GBPH, modèles)** — 2
- `get_plan_nettoyage_type` · `get_checklist_ouverture_etablissement`

**Live (API publique d'État, temps réel)** — 2
- `get_rappels_produits_actifs` (RappelConso) · `get_alimconfiance_etablissement` (DGAL)

**Market / commercial** — 1
- `compare_solutions_haccp` (conflit d'intérêt assumé, sources publiques par éditeur)

**Automation-ready (nouveaux 2.2.0)** — 3
- `get_rappels_par_categorie_etablissement` — live, filtré par métier (catégorie : live + automation)
- `get_calendrier_obligations` — échéances HACCP avec urgence vert/orange/rouge
- `get_risque_inspection` — risque DDPP par type + département

### 5 resources (`resources/read`)
`haccp://reglementation/ce-852-2004` · `…/arrete-21-decembre-2009` ·
`…/reglement-inco-1169-2011` · `haccp://guide/7-principes-haccp` ·
`haccp://guide/pms-structure-type`

### 3 prompts (`prompts/get`)
`prepare_controle_ddpp` · `audit_conformite_rapide` · `verifier_securite_produit`

### Endpoints & distribution
| Canal | Référence |
|---|---|
| HTTP | `https://frigolog.fr/api/mcp` · `https://frigologmcp.vercel.app/api/mcp` |
| Smithery | `https://frigolog-haccp--naimterrache.run.tools` |
| npm | `frigolog-mcp@2.2.0` |
| Official Registry | `io.github.naimterrache-a11y/frigolog-haccp` |
| Autres | Glama · PulseMCP · MCP.directory |
| Trafic | ~471 appels/semaine (avant les 3 nouveaux tools) |

> **Note transport** : les tools 17/18/19 sont conçus pour être appelés **en routine
> automatique** (cron), pas seulement en interactif. C'est le pivot de toute la section
> B/D ci-dessous : le même tool qui répond à Claude/ChatGPT répond aussi à un cron Frigolog.

---

## B. Email marketing (Resend)

> Infra existante : crons `api/_lib` du projet app (cf. `jobDealFollowupAlerts`,
> cron daily ~07:28 UTC gated `CRON_SECRET`) + templates Resend. Règle CLAUDE.md :
> tout template lead doit être synchronisé entre `marketing/api/_lib/*EmailTemplates.ts`
> (canonique) et `api/_lib/*EmailTemplates.js` (mirror cron). Appliquer la même règle aux
> nouveaux emails MCP-driven.

### B.1 — Email « Veille RappelConso » hebdomadaire (lundi matin)
- **Déclencheur** : cron lundi. Pour chaque client actif, appeler
  `get_rappels_par_categorie_etablissement({ type_etablissement })`.
- **Branche 1 (rappels pertinents > 0)** : email Resend personnalisé avec la liste
  (`nom_produit`, `marque`, `motif_rappel`, `conduite_a_tenir`, `ref_fiche` → lien fiche).
  - Sujet : `🛡️ [N] rappel(s) RappelConso cette semaine pour [NOM_ÉTABLISSEMENT]`
- **Branche 2 (zéro rappel)** : email « Tout est clair cette semaine ».
  - Sujet : `🛡️ Veille RappelConso — 0 rappel cette semaine pour [NOM_ÉTABLISSEMENT]`
- **CTA** : « Ouvrir Frigolog pour voir le détail ».
- **Valeur** : preuve de valeur continue → rétention. C'est exactement le moat « PMS vivant ».
- **Garde-fous** : respecter le lien désinscription HMAC (`UNSUBSCRIBE_SECRET`, déjà partagé
  entre les 2 projets Vercel). Ne pas spammer : 1 envoi/semaine max, opt-out honoré.

### B.2 — Email « Échéances HACCP » mensuel (1er du mois)
- **Déclencheur** : cron mensuel. Appeler `get_calendrier_obligations` avec les dates
  connues du client (formation, dernier contrôle, audit, MAJ PMS — à stocker côté app).
- **Condition d'envoi** : au moins une obligation `orange` ou `rouge`
  (le tool renvoie `alerte_prioritaire` non-null → utilisable directement comme déclencheur).
  - Sujet : `⚠️ [obligation] — échéance proche, voici quoi faire`
- **CTA** : « Planifier ma formation » (lien partenaire formation / page Frigolog).
- **Valeur** : upsell formation + rétention.
- **Pré-requis data** : stocker en base `derniere_formation_haccp`, `dernier_controle_ddpp`,
  `dernier_audit_interne`, `dernier_maj_pms` par établissement (4 colonnes / table dédiée).
  Sans ces dates, le tool renvoie tout en `rouge` (« date inconnue ») → premier email = invitation
  à renseigner les dates.

### B.3 — Email « Score Alim'confiance » post-inspection
- **Déclencheur** : cron quotidien qui appelle `get_alimconfiance_etablissement({ siret })`
  pour chaque client ayant un SIRET, compare `date_inspection` à la dernière vue stockée.
- **Si nouvelle inspection détectée** : email avec score + recommandations.
  - Sujet : `✅ Votre score Alim'confiance vient de tomber : [SCORE]`
- **CTA** : « Voir votre historique dans Frigolog ».
- **Note** : nécessite que le SIRET du client soit en base. Refresh dataset DGAL périodique
  (pas temps réel) → un poll quotidien suffit largement.

### B.4 — Nurture prospect J+3/J+6/J+9 (séquence existante)
- Enrichir les templates nurture existants avec des données MCP par type d'établissement :
  - boulanger → stats rappels boulangerie du mois (`get_rappels_par_categorie_etablissement`)
  - restaurateur → `get_risque_inspection` de son département
- **Honnêteté** : ne pas inventer un risque ; afficher l'`avertissement` du tool
  (« estimation basée sur données publiques agrégées »).

---

## C. Site marketing (`marketing/` Astro, frigolog.fr)

### C.1 — Page `/veille-rappels-conso` (SEO, cron quotidien)
- Page Astro alimentée par `get_rappels_produits_actifs` (build-time ou ISR via cron).
- Tableau filtrable par catégorie. Titre : « Rappels de produits alimentaires en France — alerte en temps réel ».
- **CTA** : « Recevez ces alertes par email gratuitement avec Frigolog » → capture email.
- **SEO cible** : « rappel produit alimentaire », « rappel conso alimentaire », « rappel [produit] ».
- **Maillage** : lien vers `/fonctionnalites/rappels-produits` + `/reglementation-haccp`.

### C.2 — Page `/score-hygiene-restaurant` (SEO, recherche live)
- Formulaire (nom + ville **ou** SIRET) → `get_alimconfiance_etablissement`.
- Titre : « Score hygiène restaurant — vérifiez le résultat d'inspection DDPP ».
- **SEO cible** : « note hygiène restaurant [ville] », « résultat inspection restaurant », « alim confiance [ville] ».
- **CTA** : « Vous êtes restaurateur ? Améliorez votre score avec Frigolog. »
- **Attention RGPD/réput** : afficher la source officielle (DGAL) + date d'inspection ;
  ne pas réinterpréter le score. Données publiques mais sensibles pour l'établissement cité.

### C.3 — Widget « Risque inspection » (landing, lead capture)
- Widget : type d'établissement + département → `get_risque_inspection`.
- Affiche `score_risque`, `mois_a_risque`, `recommandations`, `avertissement`.
- **CTA** : « Préparez votre prochain contrôle — essai gratuit 14 jours ».

### C.4 — Contenu SEO structuré (19 tools = 19 sujets sans hallucination)
- Chaque tool = source de vérité pour une page « Tout savoir sur [sujet] »
  (allergènes, sanctions DDPP, températures, seuils micro, formation, GBPH…).
- Données structurées + sourcées = contenu exact = zéro hallucination = SEO durable.
- **Croise la roadmap pSEO existante** (30 pages secteurs/fonctionnalités/comparatifs déjà live).

---

## D. App Frigolog (`app.frigolog.fr`)

### D.1 — Module « Veille automatique » (dashboard)
- Nouveau panneau agrégeant, par établissement, rafraîchi par cron quotidien :
  `get_rappels_par_categorie_etablissement` + `get_calendrier_obligations` + `get_risque_inspection`.
- **Réutilise le moat « PMS vivant »** : la veille est pilotée par le type/secteur de l'établissement,
  comme le registry PMS (cf. `api/_lib/pms/sections.js`). Même philosophie : pertinent par activité réelle.

### D.2 — Notifications in-app / push
- Rappel pertinent détecté → badge + notif. Échéance HACCP `rouge` → alerte.
- Push natif = nécessite Capacitor (déjà identifié roadmap app native) — d'ici là, in-app + email.

### D.3 — Mode Contrôle enrichi
- Le Mode Contrôle (`/controle`) restitue déjà les documents (`get_documents_controle_ddpp` côté esprit).
- Enrichir avec `get_risque_inspection` (niveau de risque affiché en tête du dossier) et
  `get_calendrier_obligations` (échéances : formation à jour ? PMS récent ?).
- Cohérent avec le backlog « score de complétude par module » et « export PDF transparent ».

### D.4 — Simulation DDPP améliorée
- La simulation DDPP (métrique nord : « % trials avec une simu DDPP < J7 ») peut contextualiser
  par département (`get_risque_inspection`) et vérifier la fraîcheur formation/PMS (`get_calendrier_obligations`).

---

## E. Prospection (`prospection.frigolog.fr`)

### E.1 — Enrichissement Alim'confiance
- `get_alimconfiance_etablissement` enrichit un prospect avec son dernier score.
- Un prospect « À améliorer » / « À corriger de manière urgente » = **prospect chaud** (pipeline B Alim'confiance déjà cadré dans CLAUDE.md).

### E.2 — Cold email personnalisé (sous garde-fous RGPD)
- Trame : « Votre établissement [NOM] a reçu un score "[SCORE]" le [DATE]. Frigolog aide à passer
  à "Très satisfaisant". 59€/mois, essai gratuit. »
- **BLOQUANT RGPD (checklist CLAUDE.md, non négociable)** : lien désinscription, sujet en rapport
  métier, identité expéditeur + base légale (intérêt légitime B2B), **mention source des données
  (« Alim'confiance »), opt-out honoré, conservation ≤ 3 ans**. Ne rien envoyer avant que ces points
  soient en place (cf. warmup Instantly `thierry@frigolog-haccp.fr`).

### E.3 — Score de priorité prospection
- Combiner : score Alim'confiance + ancienneté du dernier contrôle (`get_risque_inspection`
  → `temps_depuis_dernier_controle_mois`) + département → score de priorité.
- Mauvais score **ET** contrôle ancien = priorité maximale (terrain Damien + phoning Sarah).

---

## F. Réseau vendeurs (`vendeurs.frigolog.fr`)

### F.1 — Argument de vente en RDV
- En direct pendant un RDV, le vendeur affiche le score Alim'confiance du prospect
  (`get_alimconfiance_etablissement` par nom + ville).

### F.2 — Démo personnalisée
- « Votre dernier contrôle date du [DATE], score [SCORE]. Avec Frigolog vous êtes alerté
  automatiquement des rappels et vous préparez le prochain contrôle. »
- **Attention SSO** : vendeurs et prospection sont sur des sous-domaines distincts (localStorage
  isolé). Si un outil interne consomme le MCP, le faire côté serveur (clé/cron), pas via le front vendeur.

---

## G. Roadmap technique (planning)

| Priorité | Action | Dépendance | Estimé |
|---|---|---|---|
| **P0** | 3 nouveaux tools MCP (2.2.0) | — | ✅ Fait |
| **P0** | Republier npm 2.2.0 + Smithery (auto-deploy Vercel) | build OK | 30 min |
| **P0** | **Vérifier/migrer RappelConso dans l'app `frigolog`** (dataset v2) | grep `rappelconso0` | 0.5 j |
| P1 | Stocker dates HACCP par établissement (4 colonnes) — pré-requis B.2 / D.3 | migration DB | 0.5 j |
| P1 | Page SEO `/veille-rappels-conso` | cron + Astro | 1 j |
| P1 | Page SEO `/score-hygiene-restaurant` | API Alim'confiance + Astro | 1 j |
| P1 | Email Resend « Veille RappelConso » hebdo | cron + Resend + tool 17 | 1 j |
| P2 | Email Resend « Échéances HACCP » mensuel | dates HACCP + tool 18 | 0.5 j |
| P2 | Widget risque inspection (landing) | React + tool 19 | 0.5 j |
| P2 | Dashboard « Veille auto » dans l'app | crons + tools 17/18/19 | 2 j |
| P2 | Enrichissement prospects Alim'confiance | prospection + tool 11 | 1 j |
| P3 | Notif push rappels in-app | Capacitor + crons | 1 j |
| P3 | Cold email Alim'confiance (après checklist RGPD) | prospection + Resend | 0.5 j |
| P3 | Simulation DDPP enrichie (dept + fraîcheur formation) | chatbot + tools 18/19 | 1 j |

### Principes de mise en œuvre
- **Une seule source de vérité** : le MCP. App, marketing, emails consomment les mêmes tools →
  pas de duplication des données réglementaires, pas de divergence.
- **Tout cron qui appelle un tool live (17, 11) doit gérer l'indisponibilité API** (le MCP renvoie
  déjà un message clair « API temporairement indisponible » → ne pas envoyer un email vide/cassé).
- **RGPD d'abord** sur tout ce qui sort vers un prospect (section E) : la checklist CLAUDE.md prime.
- **Honnêteté DDPP** : les tools 18/19 sont des *estimations* (urgence, risque). Toujours afficher
  leur `avertissement`. Ne jamais présenter une estimation comme une certitude réglementaire.
