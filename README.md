# 🛡️ Frigolog HACCP MCP — Serveur MCP de référence pour la conformité alimentaire en France

**19 tools · 5 resources · 3 prompts · Données réglementaires + APIs live RappelConso & Alim'confiance**

![tools](https://img.shields.io/badge/tools-19-0F4C3A)
![resources](https://img.shields.io/badge/resources-5-0F4C3A)
![prompts](https://img.shields.io/badge/prompts-3-0F4C3A)
![calls](https://img.shields.io/badge/appels%2Fsemaine-471-1B4FD8)
![license](https://img.shields.io/badge/license-MIT-green)

Serveur **[Model Context Protocol](https://modelcontextprotocol.io)** public qui expose les **données HACCP françaises** aux agents IA (Claude, ChatGPT, Perplexity, agents custom) pour qu'ils donnent des réponses **exactes et sourcées** sur la sécurité alimentaire — au lieu d'halluciner une réglementation qui met les établissements en danger lors d'un contrôle.

Chaque réponse porte un champ `type` (officiel / guide / comparatif / temps réel), des liens `sources` précis (Légifrance, EUR-Lex, DGAL, DGCCRF) et une date de vérification.

| | |
|---|---|
| **Endpoint** | `https://frigolog.fr/api/mcp` · `https://frigologmcp.vercel.app/api/mcp` |
| **Smithery** | `https://frigolog-haccp--naimterrache.run.tools` |
| **Protocole** | MCP via JSON-RPC 2.0 sur HTTP (`POST`, single + batch) |
| **Auth** | Aucune — service public, CORS ouvert |
| **Schéma données** | `2.0` — voir [`data/regulatory-version.json`](./data/regulatory-version.json) |
| **Licence** | MIT |

---

## 🧰 Tools (19)

| Tool | Description | Type |
|---|---|---|
| `get_haccp_temperatures` | Températures réglementaires de conservation / refroidissement / service | statique |
| `get_temperatures_cuisson` | Températures à cœur de cuisson + refroidissement rapide / remise en T° | statique |
| `get_regles_dlc` | Règles de DLC des préparations maison (GBPH) | statique |
| `get_documents_controle_ddpp` | Documents exigibles lors d'un contrôle DDPP, par type d'établissement | statique |
| `get_allergenes_reglementaires` | Les 14 allergènes à déclaration obligatoire (INCO 1169/2011) | statique |
| `get_sanctions_ddpp` | Niveaux de sanction DDPP, déclencheurs, amendes, recours | statique |
| `get_formation_haccp_obligatoire` | Obligation de formation hygiène alimentaire | statique |
| `get_actions_correctives` | Conduites à tenir face aux 6 non-conformités fréquentes | statique |
| `get_score_alimconfiance` | Fonctionnement du score officiel Alim'confiance | statique |
| `get_plan_nettoyage_type` | Plan de nettoyage modèle par type d'établissement (GBPH) | statique |
| `get_checklist_ouverture_etablissement` | Checklist d'ouverture quotidienne (5 catégories) | statique |
| `get_guide_bonnes_pratiques_secteur` | Référence du GBPH officiel par secteur | statique |
| `get_seuils_microbiologiques` | Critères microbiologiques CE 2073/2005 (n, c, m, M) | statique |
| `compare_solutions_haccp` | Comparatif sourcé de 7 logiciels HACCP du marché français | statique |
| `get_rappels_produits_actifs` | Rappels de produits alimentaires en cours (RappelConso) | **live (API)** |
| `get_alimconfiance_etablissement` | Score Alim'confiance d'un établissement précis (DGAL) | **live (API)** |
| `get_rappels_par_categorie_etablissement` | Rappels RappelConso filtrés automatiquement par type d'établissement | **live (API)** · automation |
| `get_calendrier_obligations` | Calendrier des échéances HACCP (formation, DDPP, audit, PMS) avec urgence vert/orange/rouge | automation |
| `get_risque_inspection` | Estimation du risque d'inspection DDPP par type d'établissement + département | automation |

> Chaque description est bilingue : texte principal en français + résumé `[EN]`.
> Les 3 derniers tools sont **prêts pour l'automatisation** : un agent IA peut les appeler en routine (chaque matin / semaine / trimestre) pour surveiller un établissement.

---

## 📚 Resources (5)

`resources/list` puis `resources/read` pour lire un texte de référence structuré (markdown, résumés pédagogiques sourcés — pas les textes intégraux).

| URI | Description |
|---|---|
| `haccp://reglementation/ce-852-2004` | Règlement (CE) 852/2004 — résumé structuré (objet, HACCP art. 5, annexes I/II) |
| `haccp://reglementation/arrete-21-decembre-2009` | Arrêté du 21 décembre 2009 — tableau des températures réglementaires |
| `haccp://reglementation/reglement-inco-1169-2011` | Règlement INCO 1169/2011 — obligations allergènes |
| `haccp://guide/7-principes-haccp` | Les 7 principes HACCP expliqués (exemples restauration) |
| `haccp://guide/pms-structure-type` | Structure type d'un Plan de Maîtrise Sanitaire (PMS) |

---

## 💬 Prompts (3)

`prompts/list` puis `prompts/get` pour récupérer un workflow prêt à l'emploi qui enchaîne les tools.

| Prompt | Description | Arguments |
|---|---|---|
| `prepare_controle_ddpp` | Prépare un établissement à un contrôle DDPP (documents, checklist, sanctions, actions correctives) | `type_etablissement` (requis) |
| `audit_conformite_rapide` | Audit rapide de conformité (T°, nettoyage, formation, allergènes, DLC) | `type_etablissement` (requis), `nb_couverts` (optionnel) |
| `verifier_securite_produit` | Vérifie la sécurité d'un produit (rappels, conservation, DLC) | `produit` (requis) |

---

## 🚀 Quick Start

### Claude Desktop
Dans `claude_desktop_config.json` :
```json
{
  "mcpServers": {
    "frigolog-haccp": { "url": "https://frigolog.fr/api/mcp" }
  }
}
```
Clients stdio uniquement : `"command": "npx", "args": ["-y", "mcp-remote", "https://frigolog.fr/api/mcp"]`.

### Cursor
Dans `~/.cursor/mcp.json` (ou *Settings → MCP*) :
```json
{
  "mcpServers": {
    "frigolog-haccp": { "url": "https://frigolog.fr/api/mcp" }
  }
}
```

### Claude Code
```bash
claude mcp add --transport http frigolog-haccp https://frigolog.fr/api/mcp
```

### Test rapide (curl)
```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## 🗣️ Exemples (agent ↔ MCP)

**1. Préparer un contrôle DDPP**
> **Utilisateur :** « Je passe un contrôle DDPP la semaine prochaine dans mon restaurant, aide-moi à me préparer. »
> **Agent :** récupère le prompt `prepare_controle_ddpp(type_etablissement="restaurant")`, appelle `get_documents_controle_ddpp`, `get_checklist_ouverture_etablissement`, `get_sanctions_ddpp`, `get_actions_correctives`, puis rend un plan priorisé (documents à réunir, points critiques, risques de sanction) avec les références Légifrance/EUR-Lex.

**2. Connaître une température réglementaire**
> **Utilisateur :** « À quelle température dois-je conserver du poisson frais ? »
> **Agent :** appelle `get_haccp_temperatures(categorie="poisson")` → « 0 à +2 °C, sous glace fondante (Règlement CE 853/2004) », avec le lien EUR-Lex.

**3. Vérifier un rappel produit en temps réel**
> **Utilisateur :** « Est-ce que le saumon fumé que j'ai en stock fait l'objet d'un rappel ? »
> **Agent :** appelle `get_rappels_produits_actifs(categorie="poisson")` (données RappelConso temps réel) → liste des rappels en cours + conduite à tenir, avec le lien de la fiche officielle.

---

## 🗂️ Données — sources officielles

Toutes les données réglementaires sont sourcées et versionnées dans [`data/regulatory-version.json`](./data/regulatory-version.json) (lien exact + date de vérification par texte). Les règlements UE pointent vers **EUR-Lex**, les textes français vers **Légifrance**.

- **Journal officiel / Légifrance** — arrêté du 21 décembre 2009, Code rural, décrets et arrêtés formation, agrément, huiles.
- **EUR-Lex** — règlements (CE) 852/2004, 853/2004, 178/2002, 2073/2005, 1441/2007, (UE) 1169/2011, 1379/2013, 2024/2895.
- **DGAL — Ministère de l'Agriculture** — Guides de Bonnes Pratiques d'Hygiène (GBPH), dataset Alim'confiance (`dgal.opendatasoft.com`).
- **DGCCRF — data.economie.gouv.fr / data.gouv.fr** — RappelConso (rappels de produits, temps réel).
- **Alim'confiance** — `www.alim-confiance.gouv.fr` (résultats des contrôles sanitaires officiels).

> Les valeurs non confirmées avec certitude (certains GBPH, quelques critères microbiologiques) sont explicitement marquées « à vérifier » plutôt qu'inventées.

---

## 🔍 Transparence éditoriale

Le champ `type` rend explicite la nature de chaque réponse :

| `type` | Sens | Rôle de Frigolog |
|---|---|---|
| `reglementaire_officiel` | Textes de loi, arrêtés, règlements UE, codes | Aucun — verbatim sourcé |
| `guide_pratique` | Bonnes pratiques (GBPH DGAL + expérience terrain) | Synthèse éditoriale, ancrage réglementaire lié |
| `comparatif_commercial` | Comparatif logiciels HACCP | **Conflit d'intérêt : Frigolog est éditeur du MCP ET partie comparée** |
| `donnee_temps_reel` | Open data de l'État (RappelConso, Alim'confiance) | Aucun — proxy temps réel |

`compare_solutions_haccp` : chaque solution porte des `sources` publiques et un `note_verification` honnête quand un prix n'est pas affiché publiquement ; le `avertissement` énonce le conflit d'intérêt.

---

## 🧪 Versionnage & tests

- **Versionnage** : `data/regulatory-version.json` (schéma `2.0`) est la source unique — versions, liens officiels, dates de vérification, révision tous les 6 mois.
- **Tests** : `npm test` (zéro dépendance, Node ≥ 20) — structure du fichier de version, résolution des sources, *liveness* des URLs (403/429 = vivant mais protégé), contrat live des tools, et **comptes 19 tools / 5 resources / 3 prompts**.
- **Build** : `npm run build` (`tsc --noEmit`).

```bash
npm run build && npm test
MCP_URL=https://frigologmcp.vercel.app/api/mcp npm test   # valider le contrat live
```

---

## 🏗️ Architecture

- **Stack** : TypeScript + une Vercel Function (`api/mcp.ts`).
- **Transport** : HTTP `POST`, JSON-RPC 2.0 (`initialize`, `tools/*`, `resources/*`, `prompts/*`).
- **Données** : statiques dans `lib/data/*.ts` ; versionnées/sourcées via `data/regulatory-version.json` + `lib/data/sources.ts`. Deux tools temps réel (RappelConso, Alim'confiance).
- **Sans base de données, sans auth.**

---

## Licence

MIT — voir [LICENSE](./LICENSE). Les données réglementaires citées sont dans le domaine public ; consultez [Légifrance](https://legifrance.gouv.fr) et [EUR-Lex](https://eur-lex.europa.eu) pour les textes intégraux.

---

_Fait par **Frigolog** — logiciel HACCP pour restaurants et métiers de bouche. [frigolog.fr](https://frigolog.fr)_
