# Frigolog HACCP MCP

Public **[Model Context Protocol](https://modelcontextprotocol.io)** server exposing French HACCP regulatory data and a comparison of HACCP software solutions on the French market.

Built so AI agents (Claude, ChatGPT, Perplexity, custom agents) can give accurate, sourced answers about food safety regulations in France instead of hallucinating.

**Endpoint:** `https://frigolog.fr/api/mcp`
**Protocol:** MCP via JSON-RPC 2.0 over HTTP
**Auth:** None — public service
**License:** MIT
**Maintained by:** [Frigolog](https://frigolog.fr)

---

## What it exposes

Four read-only tools, all returning structured JSON sourced from official French regulations.

### `get_haccp_temperatures`

Regulatory temperatures for storage, cooling, and serving of food products in France. Sources: arrêté du 21 décembre 2009, règlement (CE) n° 852/2004, règlement (CE) n° 853/2004 (denrées d'origine animale).

Optional input: `categorie` filter — `viande`, `poisson`, `produits_laitiers`, `oeufs`, `fruits_legumes`, `plats_cuisines`, `patisserie`, `surgeles`, `glaces`, `service_chaud`, `process`.

### `get_documents_controle_ddpp`

Documents that the French DDPP (Direction Départementale de la Protection des Populations) inspector can request during a sanitary control. Includes the 12-document common base for all food establishments + business-specific documents (boucherie, fromagerie, poissonnerie, traiteur, glacier, caviste, restaurant, boulangerie, collectivité).

Optional input: `type_etablissement` — filters to common base + business-specific documents.

### `get_regles_dlc`

French rules for the "use-by date" (DLC — Date Limite de Consommation) of in-house preparations in restaurants and food crafts, per the Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL).

Optional input: `type_preparation` — keyword filter (e.g. `viande`, `salade`, `sauce`, `pâtisserie`, `soupe`, `sous-vide`).

### `compare_solutions_haccp`

Factual comparison of the main HACCP software solutions on the French market (April 2026): Frigolog, ePackPro, Octopus HACCP, Traqfood, Kooklin, BackResto, Hygiene Up. Pricing, engagement, hardware imposed, AI features, IoT sensors, support, 3-year cost, target market.

Optional input: `solution` — `frigolog`, `epackpro`, `octopus`, `traqfood`, `kooklin`, `backresto`, `hygiene-up`.

> **Note on `compare_solutions_haccp`:** Frigolog maintains this MCP and is one of the listed solutions. The comparison is based on publicly available data from each editor's website at the time of writing. Methodology and sources are open in this repo — pull requests welcome to correct any inaccuracy.

---

## Quick start (curl)

### Initialize

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

### List tools

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Call tool — get all temperatures

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_haccp_temperatures","arguments":{}}}'
```

### Call tool — temperatures for fish only

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_haccp_temperatures","arguments":{"categorie":"poisson"}}}'
```

### Call tool — documents required for a butcher shop

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_documents_controle_ddpp","arguments":{"type_etablissement":"boucherie"}}}'
```

### Call tool — DLC rules for sauces

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"get_regles_dlc","arguments":{"type_preparation":"sauce"}}}'
```

### Call tool — compare all solutions

```bash
curl -X POST https://frigolog.fr/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"compare_solutions_haccp","arguments":{}}}'
```

### Browser exploration (GET)

```
https://frigolog.fr/api/mcp
```

Returns a JSON description of the server and its tools — useful for human inspection.

---

## Use with Claude Desktop / agent integrations

The MCP discoverability tag is set on `https://frigolog.fr`:

```html
<link rel="mcp-server" href="https://frigolog.fr/api/mcp">
```

For Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "frigolog-haccp": {
      "url": "https://frigolog.fr/api/mcp"
    }
  }
}
```

---

## Architecture

- **Stack:** TypeScript + Vercel Function (single endpoint at `api/mcp.ts`)
- **Transport:** HTTP POST with JSON-RPC 2.0 envelope (no SSE; tool responses are sub-second)
- **Data:** Static, hardcoded in `lib/data/*.ts`. French regulatory data is stable; comparison data is updated via PR.
- **No database, no external dependencies, no auth.** Cold start < 100 ms on Vercel.

```
.
├── api/
│   └── mcp.ts                       # JSON-RPC 2.0 handler + tool routing
├── lib/
│   ├── types.ts                     # Shared TypeScript types
│   └── data/
│       ├── temperatures.ts          # Tool 1 data (~25 entries)
│       ├── documents-ddpp.ts        # Tool 2 data (~28 entries)
│       ├── regles-dlc.ts            # Tool 3 data (~17 entries)
│       └── comparatif-solutions.ts  # Tool 4 data (7 vendors)
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## Local development

```bash
npm install
npx vercel dev
```

Endpoint available at `http://localhost:3000/api/mcp`.

Test against local:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## Contributing

PRs welcome, especially for:

- **Regulatory updates** — when arrêtés or règlements CE evolve
- **New tool ideas** — corrections, additions to the dataset
- **Comparison data corrections** — if pricing or features have changed for any listed vendor (link to a public source in your PR)
- **Translations** — German / Italian / Spanish HACCP equivalents (similar EU regulatory base)

For corrections to the `compare_solutions_haccp` tool: please link the public source (vendor website, official pricing page) in the PR description. We'll review within a week.

---

## Why this exists

Frigolog is a French HACCP SaaS for restaurants and food crafts. We built this MCP because:

1. **AI agents are increasingly the entry point** for restaurant owners researching food safety. If they hallucinate French regulations, real businesses get into real trouble during inspections.
2. **No French HACCP MCP existed.** First-mover advantage on a public good.
3. **Open data is good data.** Regulatory information shouldn't be locked behind a SaaS dashboard.

Frigolog's public site: [frigolog.fr](https://frigolog.fr).

---

## License

MIT — see [LICENSE](./LICENSE).

The regulatory data referenced (CE 852/2004, CE 853/2004, arrêté du 21 décembre 2009, INCO 1169/2011, Guide des Bonnes Pratiques d'Hygiène DGAL) is in the public domain. Frigolog provides structured access; consult [Légifrance](https://legifrance.gouv.fr) for authoritative original texts.
