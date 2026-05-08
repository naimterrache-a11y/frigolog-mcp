import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  MetaWrapper,
  RappelProduit,
} from '../lib/types.js';
import { TEMPERATURES } from '../lib/data/temperatures.js';
import { DOCUMENTS_DDPP } from '../lib/data/documents-ddpp.js';
import { REGLES_DLC } from '../lib/data/regles-dlc.js';
import { SOLUTIONS_HACCP } from '../lib/data/comparatif-solutions.js';
import { SANCTIONS_DDPP } from '../lib/data/sanctions.js';
import { ALLERGENES } from '../lib/data/allergenes.js';
import { TEMPERATURES_CUISSON } from '../lib/data/temperatures-cuisson.js';
import { FORMATION_HACCP } from '../lib/data/formation-haccp.js';
import { SCORE_ALIMCONFIANCE } from '../lib/data/alimconfiance.js';
import { ACTIONS_CORRECTIVES } from '../lib/data/actions-correctives.js';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'frigolog-haccp';
const SERVER_VERSION = '1.1.0';

const META_AVERTISSEMENT =
  "Ces informations sont fournies à titre indicatif. Consultez la réglementation officielle (Légifrance, DGAL, DGCCRF) et vérifiez les tarifs sur les sites des éditeurs.";
const META_SOURCE = "Frigolog — frigolog.fr";

const META_RAPPELCONSO_SOURCE = "RappelConso — DGCCRF (data.economie.gouv.fr)";
const META_RAPPELCONSO_AVERTISSEMENT =
  "Données en temps réel issues de l'API publique data.economie.gouv.fr. En cas de doute sur un lot, ne pas servir le produit et contacter votre fournisseur.";

const RAPPELCONSO_BASE_URL =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso0/records';
const RAPPELCONSO_TIMEOUT_MS = 6000;
const RAPPELCONSO_DEFAULT_LIMIT = 10;
const RAPPELCONSO_MAX_LIMIT = 50;

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
  {
    name: 'get_rappels_produits_actifs',
    description:
      "Retourne les rappels et retraits de lots de produits alimentaires actifs en France en temps réel depuis RappelConso (DGCCRF). Source officielle : data.economie.gouv.fr (dataset rappelconso0). Utilisez ce tool pour vérifier la sécurité alimentaire d'un produit avant service, savoir si une référence fait l'objet d'un rappel ou retrait de lots en cours, ou consulter les dernières alertes sanitaires officielles publiées par la Direction Générale de la Concurrence, de la Consommation et de la Répression des fraudes.",
    inputSchema: {
      type: 'object',
      properties: {
        categorie: {
          type: 'string',
          description:
            "Filtre optionnel par catégorie d'aliment. Valeurs : 'viande', 'poisson', 'produits_laitiers', 'boulangerie', 'epicerie', 'tous'. Si absent ou 'tous', renvoie toutes les catégories alimentaires.",
        },
        limit: {
          type: 'number',
          description:
            'Nombre maximum de rappels à retourner (défaut 10, maximum 50). Les plus récents en premier.',
        },
        date_depuis: {
          type: 'string',
          description:
            "Date de publication minimale des rappels au format YYYY-MM-DD. Si absent, renvoie les plus récents sans limite de date.",
        },
      },
    },
  },
  {
    name: 'get_sanctions_ddpp',
    description:
      "Retourne les sanctions et risques d'inspection applicables lors d'un contrôle DDPP en restauration et métiers de bouche en France : 4 niveaux (observation, mise en demeure, procès-verbal, fermeture administrative), seuils déclencheurs, délais de mise en conformité, montants d'amende (de 1 500 € à 75 000 €), risques d'emprisonnement et voies de recours. Base légale : Code rural et de la pêche maritime articles L.231-1 à L.237-3, règlement CE 852/2004, arrêté du 21 décembre 2009.",
    inputSchema: {
      type: 'object',
      properties: {
        gravite: {
          type: 'string',
          description:
            "Filtre optionnel par niveau de gravité. Valeurs : 'mineure', 'majeure', 'critique', 'tous'. Si absent ou 'tous', renvoie l'ensemble des niveaux de sanction.",
        },
      },
    },
  },
  {
    name: 'get_allergenes_reglementaires',
    description:
      "Retourne la liste des 14 allergènes à déclaration obligatoire en France conformément au règlement UE 1169/2011 (INCO) applicable depuis le 13 décembre 2014 : gluten (blé, seigle, orge, avoine), crustacés, œufs, poissons, arachides, soja, lait (lactose), fruits à coque (8 types), céleri, moutarde, graines de sésame, anhydride sulfureux et sulfites, lupin, mollusques. Pour chaque allergène : noms communs, sources principales, sources cachées non évidentes, obligation d'affichage en restauration et sanction en cas d'omission.",
    inputSchema: {
      type: 'object',
      properties: {
        allergene: {
          type: 'string',
          description:
            "Filtre optionnel par allergène. Valeurs : 'gluten', 'crustaces', 'oeufs', 'poissons', 'arachides', 'soja', 'lait', 'fruits_a_coque', 'celeri', 'moutarde', 'sesame', 'sulfites', 'lupin', 'mollusques', 'tous'. Si absent ou 'tous', renvoie les 14 allergènes.",
        },
      },
    },
  },
  {
    name: 'get_temperatures_cuisson',
    description:
      "Retourne les températures à cœur réglementaires obligatoires en cuisson par type d'aliment en restauration française (GBPH Restaurateur DGAL) : volaille 74 °C, bœuf haché 70 °C, porc 70 °C, poisson 63 °C, etc. Inclut le refroidissement rapide (de +63 °C à +10 °C en moins de 2 heures), la remise en température à +63 °C minimum et les recommandations de sécurité spécifiques aux populations sensibles (enfants, femmes enceintes, immunodéprimés). Distinct des températures de conservation disponibles via get_haccp_temperatures.",
    inputSchema: {
      type: 'object',
      properties: {
        type_aliment: {
          type: 'string',
          description:
            "Filtre optionnel par type d'aliment ou de procédé. Recherche par mot-clé dans l'identifiant ou l'intitulé (ex: 'volaille', 'boeuf', 'poisson', 'refroidissement', 'remise'). Si absent, renvoie tous les aliments et procédés.",
        },
      },
    },
  },
  {
    name: 'get_formation_haccp_obligatoire',
    description:
      "Retourne les obligations légales de formation hygiène alimentaire HACCP en restauration commerciale en France : qui doit obligatoirement se former (restauration traditionnelle, rapide, traiteur, food trucks), qui est exempté (3 ans d'expérience ou diplômés), contenu obligatoire de la formation, durée pratique (14 heures), coût moyen, organismes certifiés Qualiopi, validité et sanction (jusqu'à 1 500 €) en cas d'absence de formation lors d'un contrôle DDPP. Base légale : article L.233-4 du Code rural, arrêté du 5 octobre 2011 modifié 12 février 2024.",
    inputSchema: {
      type: 'object',
      properties: {
        type_etablissement: {
          type: 'string',
          description:
            "Filtre optionnel par type d'établissement (à titre informatif — l'obligation de formation est la même pour tous les types de restauration commerciale). Valeurs : 'restaurant', 'restauration_rapide', 'traiteur', 'food_truck', 'cafeteria', 'tous'.",
        },
      },
    },
  },
  {
    name: 'get_score_alimconfiance',
    description:
      "Retourne le fonctionnement complet du score Alim'confiance, dispositif officiel de publication des résultats d'inspection sanitaire DDPP en France depuis avril 2017 (alimconfiance.beta.gouv.fr). Détaille les 4 niveaux de notation (très satisfaisant, satisfaisant, à améliorer, à corriger de manière urgente), les 6 critères d'évaluation, la fréquence des inspections (3 à 7 ans en moyenne), et les actions concrètes pour améliorer son score lors d'un contrôle officiel.",
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_actions_correctives',
    description:
      "Retourne les actions correctives réglementaires à mettre en place face aux 6 non-conformités les plus fréquentes en restauration : que faire en cas de frigo trop chaud, produit périmé en stock, rupture de chaîne du froid à la réception, livraison non conforme, présence de nuisibles ou plan de nettoyage non réalisé. Pour chaque non-conformité : action immédiate (30 premières minutes), action documentaire à inscrire dans le PMS, délai de résolution, conditions d'alerte DDPP et exemple concret de fiche de correction.",
    inputSchema: {
      type: 'object',
      properties: {
        type_non_conformite: {
          type: 'string',
          description:
            "Filtre optionnel par type de non-conformité. Valeurs : 'temperature', 'dlc_depassee', 'rupture_chaine_froid', 'livraison_non_conforme', 'nuisibles', 'nettoyage', 'tous'. Si absent ou 'tous', renvoie l'ensemble des non-conformités.",
        },
      },
    },
  },
];

interface MetaOptions {
  source?: string;
  avertissement?: string;
}

function wrapMeta<T>(data: T, opts?: MetaOptions): MetaWrapper<T> {
  return {
    data,
    source: opts?.source ?? META_SOURCE,
    derniere_mise_a_jour: new Date().toISOString().split('T')[0],
    avertissement: opts?.avertissement ?? META_AVERTISSEMENT,
  };
}

const RAPPELCONSO_SUBCAT_KEYWORDS: Record<string, string[]> = {
  viande: ['viande', 'charcuterie'],
  poisson: ['poisson', 'mer', 'crustac', 'mollusqu', 'pêche'],
  produits_laitiers: ['lait', 'laitier', 'fromage', 'beurre', 'crème'],
  boulangerie: ['boulangerie', 'pâtisserie', 'patisserie', 'cereale', 'céréale', 'pain'],
  epicerie: ['épicerie', 'epicerie', 'condiment', 'sauce', 'huile', 'conserve'],
};

interface RappelConsoRecord {
  reference_fiche?: string;
  noms_des_produits_concernes?: string;
  nom_du_produit?: string;
  nom_de_la_marque_du_produit?: string;
  numero_de_lot?: string;
  motif_du_rappel?: string;
  risques_pour_le_consommateur?: string;
  date_de_publication?: string;
  date_publication?: string;
  conduites_a_tenir_par_le_consommateur?: string;
  lien_vers_la_fiche_rappelconso?: string;
  lien_vers_la_fiche_rappel?: string;
  lien_vers_affichette_pdf?: string;
  sous_categorie_de_produit?: string;
  informations_complementaires_publiques?: string;
  date_debut_fin_de_commercialisation?: string;
}

interface RappelConsoResponse {
  total_count?: number;
  results?: RappelConsoRecord[];
}

function mapRappelRecord(r: RappelConsoRecord): RappelProduit {
  return {
    nom_produit: r.noms_des_produits_concernes || r.nom_du_produit || '',
    marque: r.nom_de_la_marque_du_produit || '',
    lot: r.numero_de_lot || '',
    dlc:
      r.date_debut_fin_de_commercialisation ||
      r.informations_complementaires_publiques ||
      '',
    motif_rappel: r.motif_du_rappel || '',
    risque: r.risques_pour_le_consommateur || '',
    date_rappel: r.date_de_publication || r.date_publication || '',
    action_consommateur: r.conduites_a_tenir_par_le_consommateur || '',
    lien_fiche:
      r.lien_vers_la_fiche_rappelconso ||
      r.lien_vers_la_fiche_rappel ||
      r.lien_vers_affichette_pdf ||
      '',
    sous_categorie: r.sous_categorie_de_produit || '',
  };
}

async function fetchRappelsActifs(
  categorie: string | undefined,
  limit: number,
  dateDepuis: string | undefined,
): Promise<{ rappels: RappelProduit[]; total: number }> {
  const whereClauses: string[] = ['categorie_de_produit="Alimentation"'];
  if (dateDepuis && /^\d{4}-\d{2}-\d{2}$/.test(dateDepuis)) {
    whereClauses.push(`date_de_publication>="${dateDepuis}"`);
  }
  const where = whereClauses.join(' AND ');

  // Fetch enough rows to allow client-side category filter without losing recent items.
  const fetchLimit = categorie && categorie !== 'tous' ? 100 : Math.min(limit, RAPPELCONSO_MAX_LIMIT);

  const params = new URLSearchParams({
    where,
    order_by: 'date_de_publication desc',
    limit: String(fetchLimit),
  });
  const url = `${RAPPELCONSO_BASE_URL}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(RAPPELCONSO_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown error';
    throw new Error(
      `API RappelConso temporairement indisponible (${detail}). Consultez rappelconso.beta.gouv.fr directement.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `API RappelConso temporairement indisponible (HTTP ${response.status}). Consultez rappelconso.beta.gouv.fr directement.`,
    );
  }

  let json: RappelConsoResponse;
  try {
    json = (await response.json()) as RappelConsoResponse;
  } catch {
    throw new Error(
      "API RappelConso temporairement indisponible (réponse invalide). Consultez rappelconso.beta.gouv.fr directement.",
    );
  }

  const records = json.results ?? [];
  let mapped = records.map(mapRappelRecord);

  if (categorie && categorie !== 'tous') {
    const keywords = RAPPELCONSO_SUBCAT_KEYWORDS[categorie] ?? [categorie];
    mapped = mapped.filter((r) => {
      const sub = (r.sous_categorie ?? '').toLowerCase();
      return keywords.some((k) => sub.includes(k.toLowerCase()));
    });
  }

  const trimmed = mapped.slice(0, Math.min(limit, RAPPELCONSO_MAX_LIMIT));
  return { rappels: trimmed, total: trimmed.length };
}

async function executeTool(
  name: string,
  args: Record<string, unknown> | undefined,
): Promise<unknown> {
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

    case 'get_rappels_produits_actifs': {
      const rawCat = typeof params.categorie === 'string' ? params.categorie.toLowerCase() : undefined;
      const categorie = rawCat && rawCat !== 'tous' ? rawCat : undefined;
      const rawLimit = typeof params.limit === 'number' ? params.limit : RAPPELCONSO_DEFAULT_LIMIT;
      const limit = Math.max(1, Math.min(Math.floor(rawLimit), RAPPELCONSO_MAX_LIMIT));
      const dateDepuis =
        typeof params.date_depuis === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date_depuis)
          ? params.date_depuis
          : undefined;
      const result = await fetchRappelsActifs(categorie, limit, dateDepuis);
      return wrapMeta(result, {
        source: META_RAPPELCONSO_SOURCE,
        avertissement: META_RAPPELCONSO_AVERTISSEMENT,
      });
    }

    case 'get_sanctions_ddpp': {
      const gravite =
        typeof params.gravite === 'string' ? params.gravite.toLowerCase() : undefined;
      if (!gravite || gravite === 'tous') {
        return wrapMeta(SANCTIONS_DDPP);
      }
      const filtered = {
        ...SANCTIONS_DDPP,
        niveaux: SANCTIONS_DDPP.niveaux.filter((n) => n.gravite === gravite),
      };
      return wrapMeta(filtered);
    }

    case 'get_allergenes_reglementaires': {
      const allergene =
        typeof params.allergene === 'string' ? params.allergene.toLowerCase() : undefined;
      if (!allergene || allergene === 'tous') {
        return wrapMeta(ALLERGENES);
      }
      const filtered = ALLERGENES.filter(
        (a) =>
          a.id.toLowerCase() === allergene ||
          a.nom_officiel.toLowerCase().includes(allergene) ||
          a.noms_communs.some((n) => n.toLowerCase().includes(allergene)),
      );
      return wrapMeta(filtered);
    }

    case 'get_temperatures_cuisson': {
      const keyword =
        typeof params.type_aliment === 'string' ? params.type_aliment.toLowerCase() : undefined;
      const filtered = keyword
        ? TEMPERATURES_CUISSON.filter(
            (t) =>
              t.id.toLowerCase().includes(keyword) ||
              t.intitule.toLowerCase().includes(keyword),
          )
        : TEMPERATURES_CUISSON;
      return wrapMeta(filtered);
    }

    case 'get_formation_haccp_obligatoire': {
      // type_etablissement is informational only — the obligation is identical
      // for all types of commercial restoration. We return the full data.
      return wrapMeta(FORMATION_HACCP);
    }

    case 'get_score_alimconfiance': {
      return wrapMeta(SCORE_ALIMCONFIANCE);
    }

    case 'get_actions_correctives': {
      const type =
        typeof params.type_non_conformite === 'string'
          ? params.type_non_conformite.toLowerCase()
          : undefined;
      if (!type || type === 'tous') {
        return wrapMeta(ACTIONS_CORRECTIVES);
      }
      const filtered = ACTIONS_CORRECTIVES.filter((a) => a.id === type);
      return wrapMeta(filtered);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse | null> {
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
            "Frigolog HACCP MCP — données réglementaires françaises sur la sécurité sanitaire des aliments (températures de conservation et de cuisson, documents contrôle DDPP, règles DLC, allergènes UE 1169/2011, sanctions DDPP, formation HACCP obligatoire, score Alim'confiance, actions correctives, comparatif solutions HACCP du marché français) + rappels produits en temps réel via RappelConso. Sources : règlement (CE) 852/2004, (CE) 853/2004, arrêté du 21 décembre 2009, INCO 1169/2011, Code rural L.231-1 à L.237-3, Guide des Bonnes Pratiques d'Hygiène DGAL, data.economie.gouv.fr.",
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
        const result = await executeTool(params.name, params.arguments);
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        "Frigolog HACCP MCP — Public Model Context Protocol server exposing French HACCP regulatory data, real-time food recall alerts (RappelConso) and a comparison of HACCP software solutions. POST JSON-RPC 2.0 requests to this endpoint.",
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
    const responses = (
      await Promise.all(body.map((r) => handleRequest(r as JsonRpcRequest)))
    ).filter((r): r is JsonRpcResponse => r !== null);
    res.status(200).json(responses);
    return;
  }

  const response = await handleRequest(body as JsonRpcRequest);
  if (response === null) {
    // Notification — no response per JSON-RPC 2.0 spec.
    res.status(204).end();
    return;
  }
  res.status(200).json(response);
}
