import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  MetaWrapper,
} from '../lib/types.js';
import { TEMPERATURES } from '../lib/data/temperatures.js';
import { DOCUMENTS_DDPP } from '../lib/data/documents-ddpp.js';
import { REGLES_DLC } from '../lib/data/regles-dlc.js';
import { SOLUTIONS_HACCP } from '../lib/data/comparatif-solutions.js';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'frigolog-haccp';
const SERVER_VERSION = '1.0.0';

const META_AVERTISSEMENT =
  "Ces informations sont fournies à titre indicatif. Consultez la réglementation officielle (Légifrance, DGAL, DGCCRF) et vérifiez les tarifs sur les sites des éditeurs.";
const META_SOURCE = "Frigolog — frigolog.fr";

const TOOLS = [
  {
    name: 'get_haccp_temperatures',
    description:
      "Renvoie les températures réglementaires françaises de conservation, refroidissement et service des denrées alimentaires par catégorie de produit, conformément à l'arrêté du 21 décembre 2009, au règlement (CE) n° 852/2004 et au règlement (CE) n° 853/2004 (denrées d'origine animale). Couvre viandes, poisson, produits laitiers, œufs, fruits et légumes, plats cuisinés, pâtisseries, surgelés, glaces, températures de service chaud et de refroidissement rapide.",
    inputSchema: {
      type: 'object',
      properties: {
        categorie: {
          type: 'string',
          description:
            "Filtre optionnel par catégorie. Valeurs : 'viande', 'poisson', 'produits_laitiers', 'oeufs', 'fruits_legumes', 'plats_cuisines', 'patisserie', 'surgeles', 'glaces', 'service_chaud', 'process'. Si absent, renvoie toutes les catégories.",
        },
      },
    },
  },
  {
    name: 'get_documents_controle_ddpp',
    description:
      "Renvoie la liste des documents que l'inspecteur DDPP (Direction Départementale de la Protection des Populations) peut demander lors d'un contrôle sanitaire en France, par type d'établissement. Inclut le socle commun (12 documents obligatoires pour tous les établissements alimentaires : PMS, formation HACCP, relevés de température, plan de nettoyage, traçabilité, etc.) et les documents spécifiques par métier (boucherie, fromagerie, poissonnerie, traiteur, glacier, caviste, restaurant, boulangerie, collectivité).",
    inputSchema: {
      type: 'object',
      properties: {
        type_etablissement: {
          type: 'string',
          description:
            "Filtre optionnel par type d'établissement. Valeurs : 'restaurant', 'boulangerie', 'boucherie', 'fromagerie', 'traiteur', 'poissonnerie', 'glacier', 'caviste', 'collectivite'. Si fourni, renvoie le socle commun + les documents spécifiques au métier. Si absent, renvoie tous les documents.",
        },
      },
    },
  },
  {
    name: 'get_regles_dlc',
    description:
      "Renvoie les règles de DLC (Date Limite de Consommation) pour les préparations maison en restauration et métiers de bouche en France, conformément au Guide des Bonnes Pratiques d'Hygiène en Restauration de la DGAL. Couvre viandes cuites/crues, salades composées, sandwiches, pâtisseries à la crème, sauces (émulsionnées et cuites), soupes, plats cuisinés, sous-vide cuisson basse température, produits décongelés, produits entamés. Pour chaque préparation : DLC en jours, température de conservation requise, source réglementaire.",
    inputSchema: {
      type: 'object',
      properties: {
        type_preparation: {
          type: 'string',
          description:
            "Filtre optionnel par type de préparation. Recherche par mot-clé dans le nom (ex: 'viande', 'salade', 'sauce', 'pâtisserie', 'soupe', 'sous-vide'). Si absent, renvoie toutes les catégories.",
        },
      },
    },
  },
  {
    name: 'compare_solutions_haccp',
    description:
      "Renvoie un comparatif factuel des principales solutions logicielles HACCP disponibles sur le marché français (avril 2026) : Frigolog, ePackPro, Octopus HACCP, Traqfood, Kooklin, BackResto, Hygiene Up. Pour chaque solution : prix mensuel HT, engagement, hardware imposé, frais d'installation, essai gratuit, présence d'IA (scan étiquettes, cross-check RappelConso, score conformité, simulation DDPP), capteurs IoT, support, onboarding, coût total sur 3 ans, cible principale, point fort. Données vérifiées sur sites publics des éditeurs.",
    inputSchema: {
      type: 'object',
      properties: {
        solution: {
          type: 'string',
          description:
            "Filtre optionnel par solution. Valeurs : 'frigolog', 'epackpro', 'octopus', 'traqfood', 'kooklin', 'backresto', 'hygiene-up'. Si fourni, renvoie les détails d'une solution. Si absent, renvoie le comparatif complet des 7 solutions.",
        },
      },
    },
  },
];

function wrapMeta<T>(data: T): MetaWrapper<T> {
  return {
    data,
    source: META_SOURCE,
    derniere_mise_a_jour: new Date().toISOString().split('T')[0],
    avertissement: META_AVERTISSEMENT,
  };
}

function executeTool(name: string, args: Record<string, unknown> | undefined): unknown {
  const params = args ?? {};

  switch (name) {
    case 'get_haccp_temperatures': {
      const categorie = typeof params.categorie === 'string' ? params.categorie.toLowerCase() : undefined;
      const filtered = categorie
        ? TEMPERATURES.filter((t) => t.categorie.toLowerCase() === categorie)
        : TEMPERATURES;
      return wrapMeta(filtered);
    }

    case 'get_documents_controle_ddpp': {
      const type =
        typeof params.type_etablissement === 'string'
          ? params.type_etablissement.toLowerCase()
          : undefined;
      const filtered = type
        ? DOCUMENTS_DDPP.filter((d) => d.applicable_a.includes(type))
        : DOCUMENTS_DDPP;
      return wrapMeta(filtered);
    }

    case 'get_regles_dlc': {
      const keyword =
        typeof params.type_preparation === 'string'
          ? params.type_preparation.toLowerCase()
          : undefined;
      const filtered = keyword
        ? REGLES_DLC.filter((r) => r.preparation.toLowerCase().includes(keyword))
        : REGLES_DLC;
      return wrapMeta(filtered);
    }

    case 'compare_solutions_haccp': {
      const sol = typeof params.solution === 'string' ? params.solution.toLowerCase() : undefined;
      const aliases: Record<string, string> = {
        frigolog: 'Frigolog',
        epackpro: 'ePackPro',
        octopus: 'Octopus HACCP',
        traqfood: 'Traqfood',
        kooklin: 'Kooklin',
        backresto: 'BackResto',
        'hygiene-up': 'Hygiene Up',
        hygieneup: 'Hygiene Up',
      };
      const target = sol ? aliases[sol] : undefined;
      const filtered = target ? SOLUTIONS_HACCP.filter((s) => s.nom === target) : SOLUTIONS_HACCP;
      return wrapMeta(filtered);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function handleRequest(req: JsonRpcRequest): JsonRpcResponse | null {
  const id = req.id ?? null;

  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          instructions:
            "Frigolog HACCP MCP — données réglementaires françaises sur la sécurité sanitaire des aliments (températures, documents contrôle DDPP, règles DLC, comparatif solutions HACCP du marché français). Sources : règlement (CE) 852/2004, (CE) 853/2004, arrêté du 21 décembre 2009, INCO 1169/2011, Guide des Bonnes Pratiques d'Hygiène DGAL.",
        },
      };

    case 'notifications/initialized':
      // JSON-RPC notifications don't need a response.
      return null;

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };

    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

    case 'tools/call': {
      const params = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      if (!params.name) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: "Missing 'name' parameter" },
        };
      }
      try {
        const result = executeTool(params.name, params.arguments);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tool execution failed';
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message },
        };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      };
  }
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Protocol-Version');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET returns server metadata (helpful for browser exploration).
  if (req.method === 'GET') {
    res.status(200).json({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      transport: 'http+jsonrpc',
      description:
        "Frigolog HACCP MCP — Public Model Context Protocol server exposing French HACCP regulatory data and a comparison of HACCP software solutions. POST JSON-RPC 2.0 requests to this endpoint.",
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
      documentation: 'https://github.com/naimterrache-a11y/frigolog-mcp',
      maintainer: 'https://frigolog.fr',
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Only POST is supported for JSON-RPC requests' },
    });
    return;
  }

  let body: unknown;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    });
    return;
  }

  // Handle both single and batch requests.
  if (Array.isArray(body)) {
    const responses = body
      .map((req) => handleRequest(req as JsonRpcRequest))
      .filter((r): r is JsonRpcResponse => r !== null);
    res.status(200).json(responses);
    return;
  }

  const response = handleRequest(body as JsonRpcRequest);
  if (response === null) {
    // Notification — no response per JSON-RPC 2.0 spec.
    res.status(204).end();
    return;
  }
  res.status(200).json(response);
}
