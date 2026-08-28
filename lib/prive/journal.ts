// ═══════════════════════════════════════════════════════════════════════
// MCP privé — savoir si ça sert, sans savoir ce que le client a demandé
// ═══════════════════════════════════════════════════════════════════════
// POURQUOI MAINTENANT. Le MCP privé est en production depuis le 6 août et
// n'écrivait aucune trace. Le 2026-08-28, la question « ça sert à qui ? » n'a
// eu qu'une réponse indirecte : UNE clé émise, jamais réutilisée. On l'a su par
// la table des clés, pas par un journal — et seulement parce que quelqu'un a
// pensé à regarder.
//
// C'est exactement l'erreur que le MCP PUBLIC a déjà faite : Smithery comptait
// 717 appels quand notre tableau de bord en affichait zéro. On ne va pas la
// refaire au moment précis où OAuth va ouvrir les vannes.
//
// ── CE QU'ON N'ÉCRIT PAS, ET POURQUOI ──────────────────────────────────
// Le serveur public journalise les PARAMÈTRES d'appel. Ici, ce serait recopier
// les données d'un client payant dans une table de télémétrie — le nom d'un
// produit reçu, une plage de dates, l'identifiant d'une enceinte.
//
// On n'écrit donc QUE : quel outil, quel statut, combien de temps.
//
//   · pas de paramètres — ce sont les affaires du client ;
//   · pas d'établissement — savoir QUE le service sert n'exige pas de savoir
//     qui s'en sert, et un journal d'activité par client est une chose qu'on
//     n'a pas demandée et qu'il faudrait ensuite protéger ;
//   · pas d'agent, pas d'IP — même raison, et l'IP hachée non salée est de la
//     donnée personnelle déguisée en anonymat.
//
// Le nom d'outil est préfixé `prive:` pour ne pas se confondre, dans la même
// table, avec les 19 outils publics — qui, eux, se comptent en visibilité et
// pas en usage produit.
//
// ── FAIL-OPEN, TOUJOURS ────────────────────────────────────────────────
// Une panne de journal ne doit jamais dégrader une réponse à un client qui
// paie. Sans variables d'environnement, la fonction est un no-op silencieux ;
// en cas d'échec réseau, elle se tait. Elle n'est jamais attendue par
// l'appelant : la réponse part d'abord.

const TIMEOUT_MS = 1500;

/**
 * Écrit une ligne de journal. Ne lève jamais, ne bloque jamais.
 *
 * ⚠️ À appeler SANS `await` — le client attend sa réponse, pas notre
 *    comptabilité. La promesse est volontairement ignorée.
 */
export function journaliserAppel(entree: {
  outil: string;
  statut: number;
  dureeMs: number;
}): void {
  const url = process.env.SUPABASE_URL;
  // Clé ANON, jamais service_role : la RPC `log_mcp_call` est SECURITY DEFINER
  // et ne sait faire QUE cette écriture. Le MCP privé porte déjà de quoi lire
  // les données d'un établissement ; lui donner en plus un droit d'écriture
  // large pour une ligne de statistique serait disproportionné.
  const cle = process.env.SUPABASE_ANON_KEY;
  if (!url || !cle) return;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  void fetch(`${url}/rest/v1/rpc/log_mcp_call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: cle, Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      p_tool_name: `prive:${entree.outil}`.slice(0, 120),
      // `prive` plutôt qu'une classe d'agent : ici l'appelant est un client
      // identifié par sa clé, pas un robot public qu'on cherche à reconnaître.
      p_agent_class: 'prive',
      p_agent_raw_ua: null,
      // JAMAIS les paramètres : ce sont les affaires du client.
      p_params: null,
      p_response_status: entree.statut,
      p_duration_ms: entree.dureeMs,
    }),
    signal: ctrl.signal,
  }).catch(() => {
    // Muet, et volontairement : ni throw, ni console.error. Une erreur de
    // journal qui remplit les logs finit par masquer les vraies.
  }).finally(() => clearTimeout(timer));
}
