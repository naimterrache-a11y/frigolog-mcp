// ═══════════════════════════════════════════════════════════════════════
// /.well-known/oauth-protected-resource — la fiche qui lance tout
// ═══════════════════════════════════════════════════════════════════════
// C'EST LE PREMIER FICHIER QUE LIT UN CLIENT MCP. Il ne connaît de nous qu'une
// URL. Il l'appelle, se prend un 401, lit l'en-tête `WWW-Authenticate`, vient
// ici, et découvre à qui demander une autorisation. Sans cette fiche, un client
// voit un 401 et s'arrête là : il n'a aucun moyen de deviner que l'autorisation
// se demande sur `app.frigolog.fr`.
//
// C'est la RFC 9728, et le protocole MCP la rend obligatoire pour un serveur
// distant qui s'authentifie.
//
// ── POURQUOI L'AUTORISATION EST AILLEURS ───────────────────────────────
// Ce dépôt n'a ni base, ni sessions, ni écran de connexion — et c'est ce qui le
// rend inoffensif. On ne va pas lui retirer ça pour ajouter OAuth. L'app, elle,
// a déjà les comptes, les PIN, les jetons de session et un écran de connexion
// que le gérant reconnaît.
//
// Découpage classique du protocole : l'app AUTORISE, ce serveur SERT. Et ce
// serveur ne sait toujours rien d'OAuth — il continue de lire
// `Authorization: Bearer frg_…` exactement comme avant, parce que le jeton
// délivré au bout du parcours EST une clé de ce format. Rien de la mécanique
// d'isolation (`lib/prive/borne.ts`) n'est touché, donc rien n'est à re-prouver.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deploiementAutorise, MESSAGE_HOTE_REFUSE } from '../lib/prive/hote.js';

// Le serveur d'autorisation. Une variable d'environnement plutôt qu'une
// constante, pour que les previews puissent pointer ailleurs sans modifier le
// code — mais avec la valeur de production par défaut : un déploiement mal
// provisionné doit se comporter correctement, pas se taire.
const AUTORISEUR = process.env.OAUTH_ISSUER || 'https://app.frigolog.fr';

// L'identifiant de CETTE ressource. Il doit correspondre au champ `resource`
// annoncé par le serveur d'autorisation, sinon un client consciencieux refuse
// le jeton — c'est la protection contre un jeton obtenu chez nous puis présenté
// ailleurs (RFC 8707).
export const RESSOURCE = process.env.OAUTH_RESOURCE || 'https://frigolog.fr/api/mcp-prive';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Le même garde d'hôte que le MCP privé lui-même. Ce dépôt est déployé par
  // deux projets Vercel ; un déploiement qui n'a pas le droit de servir des
  // données client n'a pas non plus à annoncer comment en demander l'accès.
  if (!deploiementAutorise(req.headers as Record<string, unknown>)) {
    res.status(404).json({ error: MESSAGE_HOTE_REFUSE });
    return;
  }

  // Lisible par tout le monde : c'est une fiche publique, et un client web
  // tiers doit pouvoir la lire depuis un navigateur. Elle ne contient aucun
  // secret — uniquement des adresses.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Protocol-Version');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET attendu' });
    return;
  }

  // Une heure de cache : les clients relisent cette fiche à chaque démarrage,
  // et son contenu ne bouge qu'au rythme d'un déploiement.
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({
    resource: RESSOURCE,
    authorization_servers: [AUTORISEUR],
    bearer_methods_supported: ['header'],
    scopes_supported: ['read'],
    resource_documentation: 'https://frigolog.fr/blog/mcp-haccp-ia-recommande-frigolog',
  });
}
