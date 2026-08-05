#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// La preuve de la contrainte n°1 : jamais les données d'un établissement
// à un autre
// ═══════════════════════════════════════════════════════════════════════
// Ce script ne pose pas la question au code du MCP. Il la pose à POSTGRES :
// il crée une vraie clé pour l'établissement A, signe un vrai jeton, et
// demande à PostgREST les données de l'établissement B.
//
// ⚠️ À NE JAMAIS lancer sur la production. Il écrit dans api_keys (une clé
//    jetable, supprimée à la fin) et révoque ce qu'il a créé. Le refus est
//    codé en dur plus bas : il compare l'URL au projet de production connu.
//
// ⚠️ LE TÉMOIN N'EST PAS DÉCORATIF. Sans l'étape 5 — « A voit-il SES données ? »
//    — toutes les vérifications d'isolation seraient vertes par le VIDE : un
//    jeton cassé, un secret faux, une table absente donnent aussi « 0 ligne ».
//    C'est le motif qui revient dans ce produit (construit, jamais rempli, cru
//    vivant) ; le témoin est ce qui l'empêche ici.
//
//   node --env-file=chemin/vers/.env.staging scripts/preuve-isolation.mjs
//
// Variables attendues : VITE_SUPABASE_URL (ou SUPABASE_URL),
// VITE_SUPABASE_ANON_KEY (ou SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY,
// SUPABASE_JWT_SECRET.
import { createHash, createHmac, randomInt } from 'node:crypto';

const URL_ = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.SUPABASE_JWT_SECRET;

const manquant = Object.entries({ URL_, ANON, SERVICE, SECRET })
  .filter(([, v]) => !v).map(([k]) => k);
if (manquant.length) {
  console.error(`\nVariables manquantes : ${manquant.join(', ')}`);
  console.error('Lancez avec --env-file=<votre .env staging>\n');
  process.exit(1);
}

// Garde-fou production. Ce script ÉCRIT ; il n'a rien à faire en prod.
const PROJET_PROD = 'zpbfigpnwkpucufriltl';
if (URL_.includes(PROJET_PROD)) {
  console.error('\n⛔ Ce script écrit en base. Il est interdit sur la production.\n');
  process.exit(1);
}

const ALPHABET = 'abcdefghjkmnpqrstvwxyz23456789';
const tirer = (n) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
const empreinte = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jeton(estId) {
  const now = Math.floor(Date.now() / 1000);
  const corps = b64({ alg: 'HS256', typ: 'JWT' }) + '.' +
    b64({ establishment_id: estId, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 300 });
  return corps + '.' + createHmac('sha256', SECRET).update(corps).digest('base64url');
}
const rest = (chemin, jwt, init = {}) =>
  fetch(`${URL_}/rest/v1/${chemin}`, {
    ...init,
    headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
const admin = (chemin, init = {}) =>
  fetch(`${URL_}/rest/v1/${chemin}`, {
    ...init,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
  });

let ko = 0;
const dire = (bon, txt, detail = '') => { if (!bon) ko++; console.log(`  ${bon ? '✓' : '✗'} ${txt}${detail ? ' — ' + detail : ''}`); };

// ── Deux établissements réels de staging ───────────────────────────────
// ⚠️ DEUX ÉTABLISSEMENTS RÉELS, ni démo ni test. Ce filtre n'est pas cosmétique :
// les policies frigolog_demo_read et frigolog_terrain_read laissent un
// établissement is_demo/is_test lire TOUS ses semblables, sans passer par
// get_my_establishment_id(). Mesurer l'isolation depuis un compte de test, ce
// serait la mesurer sous une règle plus permissive que celle des vrais clients
// — et croire avoir prouvé ce qu'on n'a pas regardé.
const ests = await (await admin(
  'establishments?select=id,name&is_demo=eq.false&is_test=eq.false&deleted_at=is.null&limit=2&order=created_at'
)).json();
if (!Array.isArray(ests) || ests.length < 2) {
  console.error('Il faut au moins 2 établissements sur staging. Trouvé :', ests);
  process.exit(1);
}
const [A, B] = ests;
console.log(`\nA = ${A.name}  (${A.id})`);
console.log(`B = ${B.name}  (${B.id})\n`);

// ── Une vraie clé pour A ───────────────────────────────────────────────
const prefixe = tirer(8);
const cleA = 'frg_' + prefixe + tirer(40);
const insert = await admin('api_keys', {
  method: 'POST',
  body: JSON.stringify({
    establishment_id: A.id, key_hash: empreinte(cleA), key_prefix: prefixe,
    label: 'preuve isolation (jetable)', permissions: ['read'],
  }),
});
if (!insert.ok) { console.error('Insertion de la clé impossible :', insert.status, await insert.text()); process.exit(1); }
const [ligneCle] = await insert.json();
console.log('1. La table et ses contraintes');
dire(true, `clé créée pour A, préfixe ${prefixe}`);

// Contrainte : permissions vides refusées (le bug array_length/cardinality)
const vide = await admin('api_keys', {
  method: 'POST',
  body: JSON.stringify({ establishment_id: A.id, key_hash: empreinte('x' + cleA), key_prefix: tirer(8), label: 'vide', permissions: [] }),
});
dire(vide.status === 400 || vide.status === 409, 'une clé SANS permission est refusée par la base', `HTTP ${vide.status}`);
if (vide.ok) { const [r] = await vide.json(); await admin(`api_keys?id=eq.${r.id}`, { method: 'DELETE' }); }

// Contrainte : verbe inventé refusé
const faux = await admin('api_keys', {
  method: 'POST',
  body: JSON.stringify({ establishment_id: A.id, key_hash: empreinte('y' + cleA), key_prefix: tirer(8), label: 'admin', permissions: ['admin'] }),
});
dire(faux.status === 400, "une permission inventée ('admin') est refusée", `HTTP ${faux.status}`);
if (faux.ok) { const [r] = await faux.json(); await admin(`api_keys?id=eq.${r.id}`, { method: 'DELETE' }); }

console.log('\n2. La table est fermée');
const fuite = await rest('api_keys?select=*', ANON);
const corpsFuite = await fuite.json().catch(() => null);
dire(!Array.isArray(corpsFuite) || corpsFuite.length === 0, 'la clé anon ne lit RIEN dans api_keys',
  `HTTP ${fuite.status} ${Array.isArray(corpsFuite) ? corpsFuite.length + ' ligne(s)' : ''}`);

console.log('\n3. La porte : résoudre une clé sans service_role');
const rpc = await fetch(`${URL_}/rest/v1/rpc/mcp_resolve_api_key`, {
  method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_key_hash: empreinte(cleA) }),
});
const res = await rpc.json().catch(() => []);
dire(rpc.ok && res[0]?.establishment_id === A.id, 'la clé de A résout vers A', `HTTP ${rpc.status}`);

const rpcFaux = await fetch(`${URL_}/rest/v1/rpc/mcp_resolve_api_key`, {
  method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_key_hash: empreinte('frg_' + tirer(48)) }),
});
const resFaux = await rpcFaux.json().catch(() => []);
dire(Array.isArray(resFaux) && resFaux.length === 0, 'une clé inconnue ne résout vers rien');

// ── Une clé sur un compte démo/terrain ne doit RIEN ouvrir ───────────
// Ces comptes lisent par frigolog_demo_read / frigolog_terrain_read, qui ne
// passent pas par get_my_establishment_id() : un compte is_test voit TOUS les
// autres is_test. Constaté le 2026-08-05 — 215 équipements renvoyés à un
// établissement qui en possède un. La porte doit donc les refuser.
console.log('\n3bis. Une clé sur un compte de démo ou terrain');
const [testEst] = await (await admin('establishments?select=id,name&is_test=eq.true&limit=1')).json();
if (testEst) {
  const prefT = tirer(8), cleT = 'frg_' + prefT + tirer(40);
  const insT = await admin('api_keys', {
    method: 'POST',
    body: JSON.stringify({ establishment_id: testEst.id, key_hash: empreinte(cleT), key_prefix: prefT, label: 'essai compte test (jetable)', permissions: ['read'] }),
  });
  if (insT.ok) {
    const [ligneT] = await insT.json();
    const rT = await fetch(`${URL_}/rest/v1/rpc/mcp_resolve_api_key`, {
      method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key_hash: empreinte(cleT) }),
    });
    const rj = await rT.json().catch(() => []);
    dire(Array.isArray(rj) && rj.length === 0,
      `une clé sur « ${testEst.name} » (is_test) ne résout vers rien`,
      rj.length ? 'migration 20260805110000 non appliquée' : '');
    await admin(`api_keys?id=eq.${ligneT.id}`, { method: 'DELETE' });
  }
} else {
  dire(true, 'aucun compte is_test sur cette base — rien à vérifier');
}

// ── LE test : le jeton de A face aux données de B ──────────────────────
console.log('\n4. LA question — A peut-il voir B ?');
const jA = jeton(A.id);

for (const [table, filtre] of [
  ['establishments', `id=eq.${B.id}`],
  ['equipments', `establishment_id=eq.${B.id}`],
  ['cleaning_stations', `establishment_id=eq.${B.id}`],
  ['users', `establishment_id=eq.${B.id}`],
  ['reception_logs', `establishment_id=eq.${B.id}`],
  ['products', `establishment_id=eq.${B.id}`],
]) {
  const r = await rest(`${table}?select=id&${filtre}&limit=5`, jA);
  const lignes = await r.json().catch(() => []);
  const n = Array.isArray(lignes) ? lignes.length : -1;
  dire(n === 0, `avec la clé de A : ${table} de B → aucune ligne`, `HTTP ${r.status}, ${n} ligne(s)`);
}

// Et le témoin : A voit BIEN ses propres données (sinon le test ci-dessus
// serait vert par le vide — tout le monde ne voit rien, y compris le
// propriétaire, et on n'aurait rien prouvé du tout).
console.log('\n5. Le témoin — A voit-il SES données ?');
const sien = await rest(`establishments?select=id,name&id=eq.${A.id}`, jA);
const lignesA = await sien.json().catch(() => []);
dire(Array.isArray(lignesA) && lignesA.length === 1 && lignesA[0].id === A.id,
  'avec la clé de A : A se voit lui-même', `HTTP ${sien.status}, ${Array.isArray(lignesA) ? lignesA.length : '?'} ligne(s)`);

// ── Révocation ─────────────────────────────────────────────────────────
console.log('\n6. La révocation ferme vraiment');
await admin(`api_keys?id=eq.${ligneCle.id}`, { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
const apres = await fetch(`${URL_}/rest/v1/rpc/mcp_resolve_api_key`, {
  method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_key_hash: empreinte(cleA) }),
});
const resApres = await apres.json().catch(() => []);
dire(Array.isArray(resApres) && resApres.length === 0, 'une clé révoquée ne résout plus vers rien');

// ── Ménage ─────────────────────────────────────────────────────────────
await admin(`api_keys?id=eq.${ligneCle.id}`, { method: 'DELETE' });
const reste = await (await admin('api_keys?select=id')).json();
console.log(`\nMénage : ${Array.isArray(reste) ? reste.length : '?'} clé(s) restante(s) sur staging.`);

console.log(ko === 0 ? '\n✅ Isolation prouvée sur staging.\n' : `\n❌ ${ko} échec(s).\n`);
process.exit(ko === 0 ? 0 : 1);
