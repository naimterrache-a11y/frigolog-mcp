// Classement des échecs d'outil MCP (lib/erreurs.ts).
//   node tests/erreurs.test.mjs
//
// Protège le 21/09/2026 : 256 « erreurs 500 » en 30 jours, dont aucune panne —
// 249 robots appelant des outils inexistants, 7 paramètres invalides.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { OutilInconnu, ErreurEntree, ErreurSource, classerEchec } from '../lib/erreurs.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0;
const ok = (label, fn) => { fn(); passed++; console.log('  ok', label); };

ok('outil inexistant → 404, erreur de protocole -32602', () => {
  const c = classerEchec(new OutilInconnu('transfer_money'));
  assert.equal(c.statut, 404);
  assert.equal(c.forme, 'protocole');
  assert.equal(c.code, -32602);
  assert.match(c.message, /transfer_money/);
});
ok('paramètre invalide → 400, résultat isError lisible par le modèle', () => {
  const c = classerEchec(new ErreurEntree("Le paramètre 'departement' est requis."));
  assert.deepEqual([c.statut, c.forme], [400, 'resultat']);
});
ok('API publique muette → 502, résultat isError', () => {
  const c = classerEchec(new ErreurSource('API RappelConso temporairement indisponible (HTTP 503).'));
  assert.deepEqual([c.statut, c.forme], [502, 'resultat']);
});
ok('toute autre exception reste une vraie panne → 500, -32603', () => {
  const c = classerEchec(new TypeError("Cannot read properties of undefined (reading 'x')"));
  assert.deepEqual([c.statut, c.code], [500, -32603]);
  assert.equal(classerEchec('pas une Error').message, 'Tool execution failed');
});

// Le fichier RÉEL, commentaires retirés : une mention dans un commentaire ne
// doit pas suffire à rendre ces vérifications vertes.
const code = readFileSync(path.join(ROOT, 'api', 'mcp.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/^\s*\/\/.*$/, '')).join('\n');

ok('api/mcp.ts ne lève plus aucune Error nue (chaque échec a sa famille)', () => {
  assert.equal((code.match(/throw new Error\(/g) || []).length, 0);
});
ok('le nom d’outil inconnu lève OutilInconnu', () => {
  assert.match(code, /default:\s*throw new OutilInconnu\(name\)/);
});
ok('tools/call journalise le statut classé, plus un 500 en dur', () => {
  const bloc = code.slice(code.indexOf("case 'tools/call'"), code.indexOf("case 'resources/list'"));
  assert.match(bloc, /const c = classerEchec\(err\)/);
  assert.match(bloc, /status: c\.statut/);
  assert.doesNotMatch(bloc, /status: 500/);
  assert.match(bloc, /isError: true/);
});

console.log(`\nerreurs : ${passed} ok`);
