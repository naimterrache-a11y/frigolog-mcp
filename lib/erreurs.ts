// Classement des échecs d'un appel d'outil MCP.
//
// Jusqu'au 21/09/2026, TOUT échec était journalisé `500` et renvoyé en
// « internal error » (-32603). Sur 30 jours : 256 « erreurs », dont 249 venaient
// de robots qui appellent exprès des outils qui n'existent pas
// (`transfer_money`, `read_secrets`, `__verifymcp_auth_probe_…`) — des études de
// sécurité et des annuaires qui vérifient qu'un serveur MCP refuse proprement.
// Les 7 autres étaient des paramètres manquants ou invalides. AUCUNE n'était une
// panne. Le tableau de bord affichait pourtant 232 « erreurs » en rouge, et une
// vraie panne s'y serait noyée.
//
// Trois familles, trois statuts journalisés, trois réponses :
//   OutilInconnu  → 404, erreur de protocole -32602 (le spec MCP range un nom
//                   d'outil inconnu parmi les erreurs de protocole) ;
//   ErreurEntree  → 400, résultat `isError: true` : le message part au modèle,
//                   qui peut corriger son appel (spec MCP, « tool execution
//                   errors ») ;
//   ErreurSource  → 502, résultat `isError: true` : une API publique (RappelConso,
//                   Alim'confiance) n'a pas répondu — ce n'est pas notre code ;
//   toute autre exception → 500, -32603 : là, c'est une vraie panne.
//
// Aucun import : ce fichier se teste avec `node` seul (tests/erreurs.test.mjs).

export class OutilInconnu extends Error {
  constructor(nom: string) {
    super(`Unknown tool: ${nom}`);
    this.name = 'OutilInconnu';
  }
}

export class ErreurEntree extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurEntree';
  }
}

export class ErreurSource extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurSource';
  }
}

export type Classement =
  | { statut: 404; forme: 'protocole'; code: -32602; message: string }
  | { statut: 400 | 502; forme: 'resultat'; message: string }
  | { statut: 500; forme: 'protocole'; code: -32603; message: string };

export function classerEchec(err: unknown): Classement {
  const message = err instanceof Error ? err.message : 'Tool execution failed';
  if (err instanceof OutilInconnu) return { statut: 404, forme: 'protocole', code: -32602, message };
  if (err instanceof ErreurEntree) return { statut: 400, forme: 'resultat', message };
  if (err instanceof ErreurSource) return { statut: 502, forme: 'resultat', message };
  return { statut: 500, forme: 'protocole', code: -32603, message };
}
