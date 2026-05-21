# Frigolog HACCP MCP Server

Public **[Model Context Protocol](https://modelcontextprotocol.io)** server exposing **French HACCP regulatory data** — every datum carries a precise, verifiable link to the official source (Légifrance, EUR-Lex, DGAL, DGCCRF).

Built so AI agents (Claude, ChatGPT, Perplexity, custom agents) give **accurate, sourced** answers about food safety in France instead of hallucinating regulations that put real businesses at risk during inspections.

| | |
|---|---|
| **Endpoint** | `https://frigolog.fr/api/mcp` (also `https://frigologmcp.vercel.app/api/mcp`) |
| **Protocol** | MCP over JSON-RPC 2.0, HTTP `POST` (single + batch) |
| **Auth** | None — public service, CORS open |
| **Tools** | 12 (10 static + sourced, 2 real-time gov open-data) |
| **Schema version** | `2.0` — see [`data/regulatory-version.json`](./data/regulatory-version.json) |
| **License** | MIT |
| **Maintained by** | [Frigolog](https://frigolog.fr) |

---

## What it is

A single Vercel serverless function (`api/mcp.ts`) that answers JSON-RPC 2.0 calls. Ten tools serve **static regulatory data** hardcoded in `lib/data/*.ts` (stable French/EU law); two tools proxy **live French government open-data** (RappelConso recalls, Alim'confiance inspection scores).

Every response is wrapped with a metadata envelope (see [Response envelope](#response-envelope)) that makes the data **self-describing and citable**:

- a `type` classifying the response (`reglementaire_officiel` / `guide_pratique` / `comparatif_commercial` / `donnee_temps_reel`),
- a `sources` array of `{ titre, url }` precise links — at the response level **and** on each individual datum,
- a `derniere_verification` date, a `version_schema`, and a `prochaine_revision` date.

---

## Installation

### Claude Desktop (native remote MCP)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "frigolog-haccp": {
      "url": "https://frigolog.fr/api/mcp"
    }
  }
}
```

### Clients that only speak stdio (bridge via `mcp-remote`)

```json
{
  "mcpServers": {
    "frigolog-haccp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://frigolog.fr/api/mcp"]
    }
  }
}
```

### Discovery tag

`https://frigolog.fr` advertises the server in its `<head>`:

```html
<link rel="mcp-server" href="https://frigolog.fr/api/mcp">
```

### Raw HTTP (curl)

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

A `GET` on the endpoint returns a human-readable JSON description of the server and its tools.

---

## Available tools

| Tool | `type` | Returns | Optional input |
|---|---|---|---|
| `get_haccp_temperatures` | reglementaire_officiel | Storage / cooling / serving temperatures by product category | `categorie` |
| `get_temperatures_cuisson` | guide_pratique | Core cooking temperatures + rapid cooling / reheating | `type_aliment` |
| `get_regles_dlc` | guide_pratique | Use-by-date (DLC) rules for in-house preparations | `type_preparation` |
| `get_documents_controle_ddpp` | reglementaire_officiel | Documents a DDPP inspector can demand, by business type | `type_etablissement` |
| `get_allergenes_reglementaires` | reglementaire_officiel | The 14 mandatory allergens (INCO 1169/2011) | `allergene` |
| `get_sanctions_ddpp` | reglementaire_officiel | 4 inspection-sanction levels, triggers, fines, recourse | `gravite` |
| `get_formation_haccp_obligatoire` | reglementaire_officiel | Mandatory food-hygiene training rules | `type_etablissement` |
| `get_actions_correctives` | guide_pratique | Corrective playbooks for 6 common non-conformities | `type_non_conformite` |
| `get_score_alimconfiance` | reglementaire_officiel | How the official Alim'confiance scoring works | — |
| `compare_solutions_haccp` | **comparatif_commercial** | Sourced comparison of 7 French HACCP software | `solution` |
| `get_rappels_produits_actifs` | **donnee_temps_reel** | Live food recalls from RappelConso (DGCCRF) | `categorie`, `limit`, `date_depuis` |
| `get_alimconfiance_etablissement` | **donnee_temps_reel** | Live inspection score lookup of one establishment | `siret`, `nom`, `code_postal`, `commune`, `limit` |

---

## Response envelope

Every `tools/call` returns `result.content[0].text` containing a stringified JSON object with this shape:

```jsonc
{
  "data": /* tool-specific payload (object or array; array items also carry "sources") */,
  "type": "reglementaire_officiel",     // editorial classification (FIX 4)
  "sources": [                          // precise verifiable links (FIX 1)
    { "titre": "…", "url": "https://…" }
  ],
  "derniere_verification": "2026-05-21", // last manual check of the references (FIX 3)
  "version_schema": "2.0",               // dataset schema version (FIX 3)
  "prochaine_revision": "2026-11-21",    // next scheduled review (FIX 3)
  "source": "Frigolog — frigolog.fr",
  "avertissement": "…"
}
```

---

## Response examples (per tool)

### `get_haccp_temperatures` — fish only

**Request**
```json
{"name":"get_haccp_temperatures","arguments":{"categorie":"poisson"}}
```

**Response** (`content[0].text`, parsed; data array trimmed)
```jsonc
{
  "data": [
    {
      "categorie": "poisson",
      "produit": "Produits de la pêche frais (poissons, crustacés)",
      "temperature_min": 0,
      "temperature_max": 2,
      "temperature_plage": "0 à +2 °C",
      "unite": "celsius",
      "type": "conservation_froid",
      "source_reglementaire": "Règlement (CE) n° 853/2004 — règles spécifiques d'hygiène applicables aux denrées alimentaires d'origine animale",
      "notes": "Conservation sous glace fondante obligatoire. Mesure au cœur du produit. Risque histamine sur thon, sardine, maquereau.",
      "sources": [
        { "titre": "Règlement (CE) n° 853/2004 — règles spécifiques d'hygiène applicables aux denrées d'origine animale", "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0853" }
      ]
    }
    /* … */
  ],
  "type": "reglementaire_officiel",
  "sources": [
    { "titre": "Règlement (CE) n° 853/2004 — règles spécifiques d'hygiène applicables aux denrées d'origine animale", "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0853" }
  ],
  "derniere_verification": "2026-05-21",
  "version_schema": "2.0",
  "prochaine_revision": "2026-11-21",
  "source": "Frigolog — frigolog.fr",
  "avertissement": "Ces informations sont fournies à titre indicatif. Consultez la réglementation officielle via les liens du champ 'sources' (Légifrance, EUR-Lex, DGAL, DGCCRF) et vérifiez les tarifs sur les sites des éditeurs."
}
```

### `get_documents_controle_ddpp` — butcher shop

**Request**
```json
{"name":"get_documents_controle_ddpp","arguments":{"type_etablissement":"boucherie"}}
```

**Response** (trimmed)
```jsonc
{
  "data": [
    {
      "document": "Plan de Maîtrise Sanitaire (PMS)",
      "obligatoire": true,
      "source_reglementaire": "Règlement (CE) n° 852/2004 — hygiène des denrées alimentaires",
      "applicable_a": ["restaurant", "boulangerie", "boucherie", "…"],
      "description": "Document écrit décrivant l'ensemble des dispositions… Premier document demandé par l'inspecteur.",
      "sources": [
        { "titre": "Règlement (CE) n° 852/2004 — hygiène des denrées alimentaires", "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0852" }
      ]
    }
    /* … socle commun (12) + spécifiques boucherie (agrément CE, traçabilité viande) … */
  ],
  "type": "reglementaire_officiel",
  "sources": [ /* union dédupliquée de tous les textes cités */ ],
  "derniere_verification": "2026-05-21",
  "version_schema": "2.0",
  "prochaine_revision": "2026-11-21",
  "source": "Frigolog — frigolog.fr",
  "avertissement": "…"
}
```

### `get_regles_dlc` — sauces

**Request**
```json
{"name":"get_regles_dlc","arguments":{"type_preparation":"sauce"}}
```

**Response** (trimmed)
```jsonc
{
  "data": [
    {
      "preparation": "Sauces cuites (bolognaise, béchamel, sauce tomate maison)",
      "dlc_jours": 3,
      "temperature_conservation": "+3 °C max",
      "source": "Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL)",
      "notes": "Refroidissement rapide < 2 h après cuisson. Bain-marie inversé glace+eau ou cellule.",
      "sources": [
        { "titre": "Guides de bonnes pratiques d'hygiène (GBPH) — DGAL, agriculture.gouv.fr", "url": "https://agriculture.gouv.fr/guides-de-bonnes-pratiques-dhygiene-gbph" }
      ]
    }
    /* … */
  ],
  "type": "guide_pratique",
  "sources": [
    { "titre": "Guides de bonnes pratiques d'hygiène (GBPH) — DGAL, agriculture.gouv.fr", "url": "https://agriculture.gouv.fr/guides-de-bonnes-pratiques-dhygiene-gbph" }
  ],
  "derniere_verification": "2026-05-21",
  "version_schema": "2.0",
  "prochaine_revision": "2026-11-21",
  "source": "Frigolog — frigolog.fr",
  "avertissement": "…"
}
```

### `get_allergenes_reglementaires` — gluten

**Request**
```json
{"name":"get_allergenes_reglementaires","arguments":{"allergene":"gluten"}}
```

**Response** (trimmed)
```jsonc
{
  "data": [
    {
      "id": "gluten",
      "nom_officiel": "Céréales contenant du gluten",
      "noms_communs": ["Gluten", "Blé", "Seigle", "Orge", "Avoine", "Épeautre", "Kamut"],
      "sources_cachees": ["Sauce soja (souvent à base de blé)", "Bouillons cubes…", "…"],
      "obligation_affichage": "… Règlement (UE) n° 1169/2011 (INCO), applicable depuis le 13 décembre 2014.",
      "sanction_omission": "Jusqu'à 1 500 € par produit non conforme…",
      "symbole_allergene": "Annexe II — point 1",
      "sources": [
        { "titre": "Règlement (UE) n° 1169/2011 (INCO) — information du consommateur, 14 allergènes (annexe II)", "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169" }
      ]
    }
  ],
  "type": "reglementaire_officiel",
  "sources": [
    { "titre": "Règlement (UE) n° 1169/2011 (INCO) — information du consommateur, 14 allergènes (annexe II)", "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169" }
  ],
  "derniere_verification": "2026-05-21",
  "version_schema": "2.0",
  "prochaine_revision": "2026-11-21",
  "source": "Frigolog — frigolog.fr",
  "avertissement": "…"
}
```

### `compare_solutions_haccp` — Frigolog

**Request**
```json
{"name":"compare_solutions_haccp","arguments":{"solution":"frigolog"}}
```

**Response** (trimmed — note the per-vendor `sources` + `note_verification`, and the conflict-of-interest `avertissement`)
```jsonc
{
  "data": [
    {
      "nom": "Frigolog",
      "prix_mensuel_ht": 59,
      "engagement": "Sans engagement",
      "hardware_impose": false,
      "essai_gratuit": "14 jours sans carte bancaire",
      "cout_3_ans": 2124,
      "sources": [
        { "titre": "Tarifs Frigolog (page publique)", "url": "https://frigolog.fr/tarifs" },
        { "titre": "Site Frigolog", "url": "https://frigolog.fr/" }
      ],
      "note_verification": "Éditeur de ce MCP. Prix, fonctionnalités et conditions affichés publiquement sur frigolog.fr."
      /* … */
    }
  ],
  "type": "comparatif_commercial",
  "sources": [ { "titre": "Tarifs Frigolog (page publique)", "url": "https://frigolog.fr/tarifs" }, /* … */ ],
  "derniere_verification": "2026-05-21",
  "version_schema": "2.0",
  "prochaine_revision": "2026-11-21",
  "source": "Frigolog — frigolog.fr",
  "avertissement": "Conflit d'intérêt assumé : Frigolog est l'éditeur de ce MCP ET l'une des solutions comparées (juge et partie). Les données concurrents proviennent de sources publiques vérifiables… Les tarifs non affichés publiquement (ePackPro, Kooklin, BackResto) sont indicatifs et signalés dans 'note_verification'. Pour une comparaison indépendante, ouvrez les liens 'sources' de chaque éditeur. Données vérifiées le 2026-05-21."
}
```

### `get_rappels_produits_actifs` — live recalls

**Request**
```json
{"name":"get_rappels_produits_actifs","arguments":{"categorie":"viande","limit":3}}
```

**Response** (live data — values vary)
```jsonc
{
  "data": {
    "rappels": [
      {
        "nom_produit": "…",
        "marque": "…",
        "lot": "…",
        "motif_rappel": "…",
        "risque": "…",
        "date_rappel": "2026-05-19",
        "action_consommateur": "Ne pas consommer / rapporter au point de vente",
        "lien_fiche": "https://rappel.conso.gouv.fr/fiche/…"
      }
    ],
    "total": 3
  },
  "type": "donnee_temps_reel",
  "sources": [
    { "titre": "RappelConso — portail public officiel des rappels de produits (DGCCRF / DGAL / DGS)", "url": "https://rappel.conso.gouv.fr/" },
    { "titre": "RappelConso — jeu de données ouvert (data.economie.gouv.fr / data.gouv.fr)…", "url": "https://www.data.gouv.fr/fr/datasets/rappelconso/" }
  ],
  "derniere_verification": "2026-05-21",
  "version_schema": "2.0",
  "prochaine_revision": "2026-11-21",
  "source": "RappelConso — DGCCRF / DGAL / DGS (rappel.conso.gouv.fr)",
  "avertissement": "Données en temps réel issues de l'API publique data.economie.gouv.fr (dataset rappelconso0)…"
}
```

---

## Regulatory sources

Each official text is referenced once in [`data/regulatory-version.json`](./data/regulatory-version.json) with its **exact** Légifrance / EUR-Lex link and a verification date. EU regulations link to **EUR-Lex** (the canonical, consolidated EU-law source); French texts (arrêtés, décrets, codes) link to **Légifrance**.

| Source | Link |
|---|---|
| Arrêté du 21 décembre 2009 (commerce de détail) | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000021573483) |
| Règlement (CE) n° 852/2004 (hygiène des denrées) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0852) |
| Règlement (CE) n° 853/2004 (denrées d'origine animale) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0853) |
| Règlement (CE) n° 178/2002 (traçabilité, retrait/rappel) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32002R0178) |
| Règlement (UE) n° 1169/2011 (INCO, allergènes) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169) |
| Règlement (CE) n° 2073/2005 (critères microbiologiques) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32005R2073) |
| Règlement (UE) n° 1379/2013 (OCM produits de la pêche) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32013R1379) |
| Règlement (CE) n° 882/2004 (contrôles officiels) | [EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R0882) |
| Code rural et de la pêche maritime — Titre III | [Légifrance](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000022657336) |
| Décret n° 2011-731 (formation hygiène) | [Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000024266465) |
| Arrêté du 5 octobre 2011 (cahier des charges formation) | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000024686280) |
| Arrêté du 12 février 2024 (formation, en vigueur) | [Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049171606) |
| Arrêté du 8 juin 2006 (agrément sanitaire) | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000819750) |
| Décret n° 2008-184 (huiles comestibles, ≤ 25 % polaires) | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000018188420) |
| GBPH — guides de bonnes pratiques d'hygiène (DGAL) | [agriculture.gouv.fr](https://agriculture.gouv.fr/guides-de-bonnes-pratiques-dhygiene-gbph) |
| RappelConso (portail + open data) | [rappel.conso.gouv.fr](https://rappel.conso.gouv.fr/) · [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/rappelconso/) |
| Alim'confiance (portail + open data DGAL) | [alim-confiance.gouv.fr](https://www.alim-confiance.gouv.fr/) · [dgal.opendatasoft.com](https://dgal.opendatasoft.com/explore/dataset/export_alimconfiance/) |

> **Note on Légifrance links:** Légifrance protects against automated traffic and returns `HTTP 403` to bots; EUR-Lex serves an async `202`. Both are *live* — open them in a browser. The test suite treats `403/429` as live-but-protected (see [Tests](#tests)).

---

## Transparence éditoriale (editorial transparency)

This MCP mixes three kinds of content. The `type` field on every response makes which is which **explicit**:

| `type` | Meaning | Frigolog's role |
|---|---|---|
| `reglementaire_officiel` | Hard law — arrêtés, décrets, EU regulations, codes. | None. Verbatim from official texts; links in `sources`. |
| `guide_pratique` | Field best practices grounded in the DGAL **GBPH** + Frigolog user experience (DLC, cooking temps, corrective actions). | Editorial synthesis; the regulatory anchor is linked in `sources`. |
| `comparatif_commercial` | Market comparison of HACCP software. | **Conflict of interest: Frigolog is the publisher of this MCP AND one of the compared products.** |
| `donnee_temps_reel` | Live French-government open data (RappelConso, Alim'confiance). | None. Proxied from official APIs in real time. |

### The comparison tool — conflict of interest

`compare_solutions_haccp` is the one tool where Frigolog is **juge et partie** (judge and party). To keep it honest:

- every solution carries a `sources` array linking to **public, verifiable pages** (editor website, public pricing page);
- a `note_verification` flags, per vendor, any field that is **not publicly documented** (e.g. ePackPro / Kooklin / BackResto pricing is communicated in a sales demo, not on a public page) — those values are explicitly labelled *indicatif*;
- the response `avertissement` states the conflict of interest in plain language;
- corrections are welcome by PR (link a public source).

We deliberately do **not** invent a distinct source URL per claim where none exists publicly — flagging "non affiché publiquement" is more honest than fabricating a citation.

---

## Versionnage des données (data versioning)

[`data/regulatory-version.json`](./data/regulatory-version.json) is the **single source of truth**:

- `schema_version` (currently `2.0`) — surfaced in every response as `version_schema`;
- `last_updated` / `next_review` — surfaced as `derniere_verification` / `prochaine_revision`;
- `regulations[]` and `data_sources[]` — each with `id`, `reference`, `url`, `type`, `verified_at`;
- `resolver_patterns[]` — maps the free-text references in `lib/data/*.ts` to a source `id`, so each datum gets its precise link automatically (`lib/data/sources.ts`).

Review cadence: **every 6 months** (`next_review`), or sooner when an arrêté / règlement evolves. Bump `verified_at` on the touched entries and `last_updated` on each review.

---

## Tests

```bash
npm test          # = node tests/mcp.test.js
npm run build     # tsc --noEmit (type-check)
```

`tests/mcp.test.js` has zero dependencies (Node ≥ 20) and runs four groups:

1. **Version file** — `regulatory-version.json` structure, ISO dates, https URLs, unique ids, valid `type` values.
2. **Source resolver** — registry consistency, curated determinism (real reference strings → expected source ids, including composite references), and the no-empty safety net.
3. **URL liveness** — fetches every source URL. `2xx/3xx` = OK; `403/429` = live-but-protected (Légifrance WAF / rate-limit) → PASS; `404/410/5xx` → FAIL; network error → SKIP.
4. **Live MCP contract** — POSTs `initialize` + `tools/call` to `MCP_URL` (default `https://frigologmcp.vercel.app/api/mcp`) and asserts each tool response carries `type`, non-empty `sources` (`{titre, https url}`), a valid `derniere_verification`, and `version_schema`. **Skips gracefully** if the endpoint is unreachable or still on a pre-2.0 schema (run again after deploy to validate the live contract).

```bash
# validate the live contract against a specific deployment
MCP_URL=https://frigologmcp.vercel.app/api/mcp npm test
```

The suite exits non-zero only on a real FAIL; network-unavailable checks SKIP.

---

## Architecture

- **Stack:** TypeScript + a single Vercel Function (`api/mcp.ts`).
- **Transport:** HTTP `POST`, JSON-RPC 2.0 (single + batch); `GET` returns server metadata.
- **Data:** static in `lib/data/*.ts`; versioned/sourced via `data/regulatory-version.json` + `lib/data/sources.ts`.
- **No database, no auth, no external deps** beyond two French-gov open-data APIs (RappelConso, Alim'confiance).

```
.
├── api/
│   └── mcp.ts                       # JSON-RPC 2.0 handler + tool routing + meta envelope
├── data/
│   └── regulatory-version.json      # single source of truth: versions, source links, resolver
├── lib/
│   ├── types.ts                     # shared types (MetaWrapper, SourceLink, DataType, …)
│   └── data/
│       ├── sources.ts               # SRC registry + resolveSources() (from the JSON)
│       ├── temperatures.ts          # get_haccp_temperatures
│       ├── temperatures-cuisson.ts  # get_temperatures_cuisson
│       ├── regles-dlc.ts            # get_regles_dlc
│       ├── documents-ddpp.ts        # get_documents_controle_ddpp
│       ├── allergenes.ts            # get_allergenes_reglementaires
│       ├── sanctions.ts             # get_sanctions_ddpp
│       ├── formation-haccp.ts       # get_formation_haccp_obligatoire
│       ├── actions-correctives.ts   # get_actions_correctives
│       ├── alimconfiance.ts         # get_score_alimconfiance
│       └── comparatif-solutions.ts  # compare_solutions_haccp
├── tests/
│   └── mcp.test.js                  # zero-dep test suite
├── public/index.html                # human landing page
├── package.json · tsconfig.json · vercel.json
└── README.md
```

---

## Local development

```bash
npm install
npx vercel dev          # endpoint at http://localhost:3000/api/mcp
npm test                # MCP_URL defaults to the prod deployment; override for local
```

---

## Contributing

PRs welcome — especially:

- **Regulatory updates** when an arrêté / règlement evolves (update `data/regulatory-version.json`: `url` + `verified_at`).
- **New tools / dataset corrections.**
- **Comparison corrections** — link a public source in the PR; values not publicly documented stay flagged in `note_verification`.
- **Translations** — German / Italian / Spanish HACCP equivalents (shared EU regulatory base).

---

## Why this exists

1. AI agents are increasingly the entry point for restaurateurs researching food safety. Hallucinated French regulations get real businesses in trouble during inspections.
2. No French HACCP MCP existed — first-mover advantage on a public good.
3. Regulatory information shouldn't be locked behind a SaaS dashboard.

Frigolog's public site: [frigolog.fr](https://frigolog.fr).

---

## License

MIT — see [LICENSE](./LICENSE).

The regulatory data referenced (CE 852/2004, CE 853/2004, arrêté du 21 décembre 2009, INCO 1169/2011, GBPH DGAL, etc.) is in the public domain. Frigolog provides structured, sourced access; consult [Légifrance](https://legifrance.gouv.fr) and [EUR-Lex](https://eur-lex.europa.eu) for the authoritative original texts.
