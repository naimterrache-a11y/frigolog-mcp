// ═══════════════════════════════════════════════════════════════════════
// /api/mcp-prive — le MCP d'un établissement, pour son propre gérant
// ═══════════════════════════════════════════════════════════════════════
// Fichier SÉPARÉ de api/mcp.ts, et c'est structurel : les 19 outils publics ne
// doivent jamais être modifiés ni cassés, et /api/mcp doit continuer à répondre
// sans authentification. Ce fichier n'importe rien d'eux, et réciproquement.
//
// ── Quatre différences avec le MCP public, toutes voulues ──────────────
//
//  1. AUTHENTIFICATION SUR TOUT. Pas seulement `tools/call` : `initialize` et
//     `tools/list` aussi. Sans clé, on ne dit même pas quels outils existent —
//     un inventaire est déjà un renseignement.
//
//  2. PAS DE CORS OUVERT. Le public répond `Access-Control-Allow-Origin: *`
//     parce qu'il sert de la donnée réglementaire à qui la demande. Ici, une
//     clé qui vivrait dans un navigateur serait déjà une clé perdue : ce point
//     d'entrée est fait pour du serveur à serveur, et il n'autorise aucune
//     origine. Un `*` couplé à un en-tête Authorization inviterait à faire
//     exactement ce qu'il ne faut pas.
//
//  3. UN SEUL DÉPLOIEMENT SERT. Ce dépôt est déployé par deux projets Vercel
//     (cf. lib/prive/hote.ts). Le privé ne répond que sur un hôte déclaré.
//
//  4. AUCUN MESSAGE COMMERCIAL. Le public colle un conseil + un lien sur
//     chaque réponse ; il parle à des inconnus. Ici l'appelant est un client
//     qui paie et qui lit ses propres relevés.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cleDepuisEnTete, cleLisible } from '../lib/prive/cles.js';
import { contextePourCle, CleRefusee } from '../lib/prive/contexte.js';
import { deploiementAutorise, MESSAGE_HOTE_REFUSE } from '../lib/prive/hote.js';
import { OUTILS_PRIVES, OUTIL_PAR_NOM } from '../lib/prive/outils.js';
import { RESSOURCE } from './oauth-ressource.js';

// L'en-tête que lit un client pour savoir OÙ demander un accès. `resource_metadata`
// pointe la fiche décrite par la RFC 9728 ; `Bearer` dit le schéma attendu.
const enteteAuthentification = () =>
  `Bearer resource_metadata="${RESSOURCE.replace(/\/api\/mcp-prive$/, '')}/.well-known/oauth-protected-resource"`;

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'frigolog-prive';
const SERVER_VERSION = '1.0.0';

const INSTRUCTIONS =
  "MCP privé Frigolog — les données HACCP de VOTRE établissement, et de lui seul : relevés de " +
  "température, nettoyages, réceptions, équipements, plan de nettoyage. L'établissement est " +
  "déterminé par la clé d'API présentée ; aucun outil ne prend d'identifiant d'établissement en " +
  "paramètre, et aucun ne peut en atteindre un autre. Pour la réglementation générale " +
  "(températures légales, DLC, allergènes, rappels produits), utilisez le serveur public " +
  'frigolog-haccp, qui ne demande aucune clé.';

interface RequeteJsonRpc {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

const erreur = (id: unknown, code: number, message: string) => ({
  jsonrpc: '2.0' as const,
  id: (id ?? null) as string | number | null,
  error: { code, message },
});

// Descripteurs exposés par tools/list — sans le champ `executer`, qui n'a rien
// à faire dans une réponse.
const DESCRIPTEURS = OUTILS_PRIVES.map(({ name, description, inputSchema }) => ({
  name, description, inputSchema,
}));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Volontairement AUCUN Access-Control-Allow-Origin — cf. l'en-tête. Un
  // navigateur ne doit pas pouvoir appeler ce point d'entrée, parce qu'une clé
  // qui se trouve dans un navigateur est déjà une clé perdue.
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method === 'OPTIONS') {
    // Pas de préflight autorisé : rien à négocier avec un navigateur.
    res.status(405).end();
    return;
  }

  // ── Le déploiement a-t-il le droit ? AVANT toute lecture de clé ───────
  // Ainsi un déploiement non déclaré ne voit jamais passer un secret, même
  // pour le rejeter.
  if (!deploiementAutorise(req.headers as Record<string, unknown>)) {
    res.status(404).json(erreur(null, -32601, MESSAGE_HOTE_REFUSE));
    return;
  }

  if (req.method === 'GET') {
    // Métadonnées minimales : de quoi comprendre où l'on est tombé, rien de
    // plus. La liste des outils demande une clé, comme le reste.
    res.status(200).json({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      transport: 'http+jsonrpc',
      authentification: "Requise sur toutes les méthodes : Authorization: Bearer frg_…",
      obtenir_une_cle: 'https://frigolog.fr/?utm_source=mcp_prive&utm_medium=endpoint&utm_campaign=cle_api',
      serveur_public: 'https://frigolog.fr/api/mcp',
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json(erreur(null, -32600, 'Seul POST est accepté (JSON-RPC 2.0)'));
    return;
  }

  // ── L'authentification, sur TOUTES les méthodes ───────────────────────
  //
  // ⚠️ Le 401 porte `WWW-Authenticate`, et ce n'est pas décoratif : c'est le
  //    SEUL fil qu'un client MCP a pour découvrir qu'il peut demander un accès.
  //    Il ne connaît de nous qu'une URL ; il appelle, prend un 401, et lit cet
  //    en-tête. Sans lui, il s'arrête là — il n'a aucun moyen de deviner que
  //    l'autorisation se demande sur un autre domaine. C'est la RFC 9728, et
  //    c'est ce qui rend le parcours « se connecter en un clic » possible.
  const cle = cleDepuisEnTete(req.headers.authorization);
  if (!cle) {
    res.setHeader('WWW-Authenticate', enteteAuthentification());
    res.status(401).json(erreur(null, -32001,
      "Clé API requise : en-tête `Authorization: Bearer frg_…`. Le serveur public frigolog-haccp, lui, n'en demande pas."));
    return;
  }

  let ctx;
  try {
    ctx = await contextePourCle(cle);
  } catch (e) {
    if (e instanceof CleRefusee) {
      // Un seul et même refus, quelle qu'en soit la cause. Le préfixe suffit à
      // retrouver la clé dans nos logs sans jamais l'y écrire en entier.
      console.warn('[mcp-prive] clé refusée', cleLisible(cle));
      // Même en-tête ici : un jeton expiré ou révoqué doit RELANCER le parcours
      // d'autorisation. Sans lui, l'assistant d'un client dont le jeton a
      // atteint ses 90 jours cesse simplement de répondre, sans jamais proposer
      // de se reconnecter — la panne silencieuse type.
      res.setHeader('WWW-Authenticate', enteteAuthentification());
      res.status(401).json(erreur(null, -32001, 'Clé API invalide ou révoquée'));
      return;
    }
    console.error('[mcp-prive] résolution de clé impossible', (e as Error)?.message);
    res.status(503).json(erreur(null, -32603, 'Service momentanément indisponible'));
    return;
  }

  let corps: unknown;
  try {
    corps = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json(erreur(null, -32700, 'Parse error'));
    return;
  }

  // Les lots JSON-RPC sont refusés, et c'est un choix : chaque appel doit rester
  // lisible dans un journal, un par ligne. Le jour où un intégrateur en aura
  // besoin, on le saura par une demande, pas par une facture de calcul.
  if (Array.isArray(corps)) {
    res.status(400).json(erreur(null, -32600, 'Les lots ne sont pas acceptés — un appel à la fois.'));
    return;
  }

  const req_ = (corps ?? {}) as RequeteJsonRpc;
  const id = req_.id ?? null;

  switch (req_.method) {
    case 'initialize':
      res.status(200).json({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          instructions: INSTRUCTIONS,
        },
      });
      return;

    case 'notifications/initialized':
      res.status(204).end();
      return;

    case 'ping':
      res.status(200).json({ jsonrpc: '2.0', id, result: {} });
      return;

    case 'tools/list':
      res.status(200).json({ jsonrpc: '2.0', id, result: { tools: DESCRIPTEURS } });
      return;

    case 'tools/call': {
      const params = (req_.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      const outil = params.name ? OUTIL_PAR_NOM[params.name] : undefined;
      if (!outil) {
        res.status(200).json(erreur(id, -32602, `Outil inconnu : ${params.name ?? '(absent)'}`));
        return;
      }
      // La permission se vérifie ICI, une fois, pour tous les outils. Un outil
      // ne porte pas la responsabilité de vérifier son propre droit d'écrire :
      // c'est le genre de vérification qu'on oublie au vingtième.
      if (outil.permission === 'write' && !ctx.peutEcrire()) {
        res.status(200).json(erreur(id, -32002,
          "Cette clé est en lecture seule. Une clé avec la permission 'write' est nécessaire."));
        return;
      }
      try {
        const donnees = await outil.executer(ctx, params.arguments ?? {});
        res.status(200).json({
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text: JSON.stringify(donnees, null, 2) }] },
        });
      } catch (e) {
        console.error('[mcp-prive] outil en échec', params.name, (e as Error)?.message);
        res.status(200).json(erreur(id, -32603, (e as Error)?.message || "L'outil a échoué"));
      }
      return;
    }

    default:
      res.status(200).json(erreur(id, -32601, `Méthode inconnue : ${req_.method ?? '(absente)'}`));
  }
}
