#!/usr/bin/env node
// MCP privé — clés, jeton, point de passage.
//   node tests/prive.test.mjs
//
// ── Pourquoi ces tests importent du TypeScript ─────────────────────────
// Le reste de la suite (tests/mcp.test.js) lit le SOURCE, parce qu'elle vérifie
// des TEXTES commerciaux et qu'un Node nu ne savait pas importer un .ts. Ici on
// vérifie de la LOGIQUE — un format de clé, une empreinte, une signature — et
// lire une regex dans un fichier ne prouve pas qu'elle accepte la bonne chaîne.
// Node >= 22.6 retire les types nativement, donc on importe pour de vrai.
//
// ── Ce que ces tests protègent ─────────────────────────────────────────
//  1. Une clé ne se retrouve JAMAIS en clair — ni dans un log, ni en base, ni
//     dans un paramètre de requête SQL.
//  2. Le jeton contient exactement ce que la RLS attend, et rien de plus. Un
//     `sub` qui apparaîtrait ferait entrer le MCP dans les policies affiliés,
//     avec une identité qui n'existe pas.
//  3. Les outils n'ont AUCUN moyen d'interroger la base hors de leur contexte.
//     C'est la contrainte n°1 du chantier, et elle se tient par construction.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

if (!process.features.typescript) {
  console.error('\n✗ Node >= 22.6 requis (retrait natif des types). Node courant :', process.version, '\n');
  process.exit(1);
}

const {
  PREFIXE_CLE, genererCle, empreinteCle, formeValide, prefixeDe, cleLisible, cleDepuisEnTete,
} = await import('../lib/prive/cles.ts');
const { signerJetonEtablissement, TTL_JETON_SECONDES } = await import('../lib/prive/jwt.ts');
const { VAR_HOTES, hoteDeLaRequete, deploiementAutorise } = await import('../lib/prive/hote.ts');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...p) => readFileSync(path.join(ROOT, ...p), 'utf8');

// Le source SANS ses commentaires. Indispensable dès qu'un garde cherche
// l'ABSENCE de quelque chose : ce dépôt explique abondamment ce qu'il ne fait
// pas, et un garde qui mord sur une explication est un garde qu'on finit par
// désarmer. (Approximation volontairement simple : pas de parseur, on retire
// les blocs et les lignes de commentaire.)
const lireCode = (...p) => lire(...p)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

let passed = 0;
const ok = (label, fn) => { fn(); passed++; console.log('  ✓', label); };

// ─── 1. Le format des clés ─────────────────────────────────────────────
ok('une clé générée est reconnue par son propre validateur', () => {
  for (let i = 0; i < 200; i++) {
    const { cle } = genererCle();
    assert.ok(formeValide(cle), `forme refusée : ${cle}`);
  }
});

ok('le préfixe rendu est bien celui de la clé', () => {
  for (let i = 0; i < 50; i++) {
    const { cle, prefixe } = genererCle();
    assert.equal(prefixeDe(cle), prefixe);
    assert.ok(cle.startsWith(PREFIXE_CLE + prefixe));
  }
});

ok('deux clés ne se ressemblent jamais', () => {
  // 30^48 possibilités : une collision sur 2000 tirages signalerait un
  // générateur cassé, pas de la malchance.
  const vues = new Set();
  for (let i = 0; i < 2000; i++) vues.add(genererCle().cle);
  assert.equal(vues.size, 2000);
});

ok('l\'alphabet évite les caractères qu\'on recopie de travers', () => {
  // Ces clés se recopient à la main d'un écran vers un autre. Un `l` pris pour
  // un `1` ne donne pas une erreur lisible, il donne un 401 inexplicable.
  const AMBIGUS = ['i', 'l', 'o', 'u', '0', '1'];
  const echantillon = Array.from({ length: 300 }, () => genererCle().cle).join('');
  for (const c of AMBIGUS) {
    assert.ok(!echantillon.includes(c), `caractère ambigu « ${c} » tiré par le générateur`);
  }
});

ok('une chaîne quelconque n\'est pas une clé', () => {
  for (const mauvais of [
    '', 'frg_', 'frg_court', 'sk_live_abcdefgh', PREFIXE_CLE + 'A'.repeat(48),
    PREFIXE_CLE + 'a'.repeat(47), PREFIXE_CLE + 'a'.repeat(49), null, undefined, 42, {},
  ]) {
    assert.ok(!formeValide(mauvais), `accepté à tort : ${String(mauvais)}`);
  }
});

// ─── 2. Une clé ne fuit pas ────────────────────────────────────────────
ok('l\'empreinte est déterministe et ne ressemble pas à la clé', () => {
  const { cle, empreinte } = genererCle();
  assert.equal(empreinteCle(cle), empreinte);
  assert.equal(empreinte.length, 64);
  assert.match(empreinte, /^[0-9a-f]{64}$/);
  assert.ok(!empreinte.includes(cle.slice(4)), 'la clé transparaît dans son empreinte');
});

ok('la forme lisible ne contient PAS le secret', () => {
  const { cle, prefixe } = genererCle();
  const lisible = cleLisible(cle);
  assert.equal(lisible, PREFIXE_CLE + prefixe + '…');
  const secret = cle.slice(PREFIXE_CLE.length + prefixe.length);
  assert.ok(secret.length === 40, 'longueur de secret inattendue — test à revoir');
  assert.ok(!lisible.includes(secret), 'le secret apparaît dans la forme lisible');
});

ok('une clé brute ne part JAMAIS vers Postgres', () => {
  // Le seul argument envoyé au RPC doit être l'empreinte. Une clé passée en
  // paramètre finirait dans pg_stat_statements et dans les logs de requêtes —
  // c'est-à-dire en clair, à l'endroit exact où on a juré de ne pas l'écrire.
  const src = lire('lib', 'prive', 'contexte.ts');
  assert.ok(src.includes('p_key_hash: empreinte'), 'le RPC ne reçoit plus l\'empreinte');
  assert.ok(!/p_key_hash:\s*cleBrute/.test(src), 'la clé brute est envoyée au RPC');
  assert.ok(!/body:\s*JSON\.stringify\(\{[^}]*cleBrute/.test(src), 'la clé brute part dans un corps de requête');
});

// ─── 3. L'en-tête Authorization ────────────────────────────────────────
ok('Bearer est lu quelle que soit sa casse', () => {
  const { cle } = genererCle();
  for (const e of [`Bearer ${cle}`, `bearer ${cle}`, `BEARER ${cle}`, `  Bearer   ${cle}  `]) {
    assert.equal(cleDepuisEnTete(e), cle, `en-tête refusé : ${e}`);
  }
});

ok('la clé, elle, est prise telle quelle', () => {
  // Normaliser un secret, c'est accepter deux chaînes différentes pour une
  // seule vérité.
  const { cle } = genererCle();
  assert.equal(cleDepuisEnTete(`Bearer ${cle.toUpperCase()}`), null);
});

ok('tout le reste est refusé', () => {
  const { cle } = genererCle();
  for (const e of [null, undefined, '', cle, `Basic ${cle}`, `Bearer`, `Bearer `, `Bearer x`, 42]) {
    assert.equal(cleDepuisEnTete(e), null, `accepté à tort : ${String(e)}`);
  }
});

// ─── 4. Le jeton ───────────────────────────────────────────────────────
const EST = '11111111-1111-4111-8111-111111111111';
process.env.SUPABASE_JWT_SECRET = 'secret-de-test-uniquement';

function charge(jeton) {
  return JSON.parse(Buffer.from(jeton.split('.')[1], 'base64url').toString('utf8'));
}

ok('le jeton porte exactement ce que la RLS attend', () => {
  const c = charge(signerJetonEtablissement(EST));
  assert.equal(c.establishment_id, EST);
  assert.equal(c.role, 'authenticated');
  assert.equal(c.aud, 'authenticated');
});

ok('le jeton ne pose PAS de sub', () => {
  // `sub` peuple auth.uid(), sur lequel reposent les policies affiliés et
  // vendeurs. En poser un ferait entrer le MCP dans des politiques qui ne le
  // concernent pas, avec une identité qui n'existe pas.
  const c = charge(signerJetonEtablissement(EST));
  assert.equal(c.sub, undefined);
  assert.equal('sub' in c, false);
});

ok('le jeton est court-vécu', () => {
  const c = charge(signerJetonEtablissement(EST, 1_000_000));
  assert.equal(c.iat, 1_000_000);
  assert.equal(c.exp, 1_000_000 + TTL_JETON_SECONDES);
  assert.ok(TTL_JETON_SECONDES <= 15 * 60, 'TTL trop long pour un jeton re-minté à chaque requête');
});

ok('la signature est un vrai HMAC-SHA256, vérifiable', () => {
  const jeton = signerJetonEtablissement(EST);
  const [h, p, s] = jeton.split('.');
  const attendu = createHmac('sha256', process.env.SUPABASE_JWT_SECRET)
    .update(`${h}.${p}`).digest('base64url');
  assert.equal(s, attendu);
});

ok('sans secret, on refuse de signer au lieu de signer mal', () => {
  const garde = process.env.SUPABASE_JWT_SECRET;
  delete process.env.SUPABASE_JWT_SECRET;
  try {
    assert.throws(() => signerJetonEtablissement(EST), /SUPABASE_JWT_SECRET/);
  } finally {
    process.env.SUPABASE_JWT_SECRET = garde;
  }
});

ok('le secret est lu à l\'APPEL, jamais au chargement du module', () => {
  // Lu au chargement, il apparaîtrait dans toute trace d'import, et un
  // déploiement mal provisionné mourrait au démarrage à froid avec un
  // FUNCTION_INVOCATION_FAILED muet au lieu d'un message.
  const src = lire('lib', 'prive', 'jwt.ts');
  assert.ok(/function secret\(\)/.test(src), 'la lecture du secret n\'est plus isolée');
  assert.ok(!/^const\s+\w+\s*=\s*process\.env\.SUPABASE_JWT_SECRET/m.test(src),
    'le secret est capturé au chargement du module');
});

// ─── 5. Le point de passage obligé ─────────────────────────────────────
ok('un outil ne peut pas interroger la base hors de son contexte', () => {
  // La contrainte n°1 du chantier : jamais les données d'un établissement à un
  // autre. Elle ne se tient pas par vigilance outil par outil — elle se tient
  // parce qu'un outil ne reçoit qu'un Contexte, et que le Contexte est la seule
  // chose qui sait où est la base.
  const src = lire('lib', 'prive', 'contexte.ts');
  assert.ok(src.includes('SUPABASE_URL'), 'extraction vide — chemin à revoir');
  assert.ok(/function env\(nom: string\)/.test(src), 'la lecture d\'env n\'est plus centralisée');
  assert.ok(!/export\s+(const|function)\s+\w*(SUPABASE_URL|anonKey)/.test(src),
    'le contexte exporte de quoi construire une requête à côté de lui');
});

ok('l\'échec d\'authentification ne dit jamais POURQUOI', () => {
  // Distinguer « inexistante » de « révoquée » dirait à un attaquant lesquelles
  // de ses tentatives ont touché quelque chose.
  const src = lire('lib', 'prive', 'contexte.ts');
  const messages = [...src.matchAll(/new CleRefusee\(\)/g)];
  assert.ok(messages.length >= 4, `CleRefusee levée ${messages.length} fois — chemins d'échec perdus`);
  assert.ok(/super\('Clé API invalide ou révoquée'\)/.test(src),
    'le message unique de refus a changé de forme');
});

ok('une clé sans permission reconnue est REFUSÉE, pas rétrogradée', () => {
  // Retomber sur 'read' transformerait une donnée corrompue en autorisation.
  const src = lire('lib', 'prive', 'contexte.ts');
  assert.ok(/permissions\.length === 0\)\s*throw new CleRefusee/.test(src),
    'une clé sans permission valide ne mène plus à un refus');
});

ok('un 401 de PostgREST crie au lieu de rendre une liste vide', () => {
  // Sans ça, un secret JWT mal configuré se lirait « ce client n'a aucune
  // donnée » — exactement le mode de panne de la Phase 3 côté app.
  const src = lire('lib', 'prive', 'contexte.ts');
  assert.ok(/res\.status === 401/.test(src), 'le cas 401 n\'est plus distingué');
  assert.ok(/SUPABASE_JWT_SECRET incohérent/.test(src), 'le diagnostic du 401 a disparu');
});

// ─── 6. Ce que le privé ne doit pas contaminer ─────────────────────────
ok('aucun fichier de api/ n\'utilise la fabrique de test', () => {
  // contexteDeTestSansVerification construit un Contexte pour n'importe quel
  // établissement, SANS clé et SANS vérification. Indispensable aux tests,
  // catastrophique ailleurs. Son nom le dit ; ce garde le prouve.
  //
  // Il est écrit MAINTENANT, avant que api/mcp-prive.ts existe. Un garde ajouté
  // après coup ne protège que ce qu'on a pensé à relire ce jour-là.
  const dir = path.join(ROOT, 'api');
  const fichiers = readdirSync(dir, { recursive: true })
    .filter((f) => typeof f === 'string' && /\.(ts|js|mjs)$/.test(f));
  assert.ok(fichiers.length > 0, 'aucun fichier lu dans api/ — le garde ne garde rien');
  for (const f of fichiers) {
    const src = readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!src.includes('contexteDeTestSansVerification'),
      `api/${f} appelle la fabrique de contexte réservée aux tests`);
  }
});

ok('le MCP public reste intact, et sans authentification', () => {
  // Contrainte absolue du chantier : les 19 outils publics ne doivent jamais
  // être modifiés ni cassés, et /api/mcp doit continuer à répondre sans auth.
  const src = lire('api', 'mcp.ts');
  assert.ok(src.length > 40000, 'api/mcp.ts a maigri — extraction ou fichier à revoir');
  assert.ok(!src.includes('prive/'), 'le MCP public importe du code privé');
  assert.ok(!/contextePourCle|api_keys|SUPABASE_JWT_SECRET/.test(src),
    'le MCP public a gagné une notion d\'authentification');
  assert.ok(src.includes("'Access-Control-Allow-Origin', '*'"),
    'le CORS du MCP public a changé — il doit rester ouvert à tous');
});

// ─── 7. Un seul déploiement sert des données client ────────────────────
// Ce dépôt est déployé par DEUX projets Vercel : frigologmcp (le vrai, cible du
// rewrite frigolog.fr/api/mcp) et frigolog-mcp (un doublon que RIEN ne
// référence). Inoffensif pour 19 outils réglementaires publics ; piégeux dès
// qu'il s'agit des relevés d'un client.
const restaurerHotes = (garde) => {
  if (garde === undefined) delete process.env[VAR_HOTES];
  else process.env[VAR_HOTES] = garde;
};

ok('sans déclaration, aucun déploiement ne sert le privé', () => {
  // « On autorise tout si rien n'est déclaré » transformerait un oubli de
  // configuration en autorisation.
  const garde = process.env[VAR_HOTES];
  try {
    delete process.env[VAR_HOTES];
    assert.equal(deploiementAutorise({ host: 'frigologmcp.vercel.app' }), false);
    process.env[VAR_HOTES] = '';
    assert.equal(deploiementAutorise({ host: 'frigologmcp.vercel.app' }), false);
    process.env[VAR_HOTES] = '  ,  , ';
    assert.equal(deploiementAutorise({ host: 'frigologmcp.vercel.app' }), false);
  } finally { restaurerHotes(garde); }
});

ok('le doublon reste dehors, et les previews aussi', () => {
  const garde = process.env[VAR_HOTES];
  try {
    process.env[VAR_HOTES] = 'frigolog.fr,frigologmcp.vercel.app';
    assert.equal(deploiementAutorise({ host: 'frigologmcp.vercel.app' }), true);
    assert.equal(deploiementAutorise({ host: 'frigolog.fr' }), true);
    assert.equal(deploiementAutorise({ host: 'frigolog-mcp.vercel.app' }), false,
      'le doublon sert des données client');
    assert.equal(deploiementAutorise({ host: 'frigolog-mcp-3n5w7.vercel.app' }), false,
      'une preview sert des données client');
    assert.equal(deploiementAutorise({}), false, 'une requête sans Host passe');
  } finally { restaurerHotes(garde); }
});

ok('x-forwarded-host fait foi derrière le rewrite de frigolog.fr', () => {
  // Derrière le rewrite, `host` porte le nom du déploiement Vercel ; c'est
  // x-forwarded-host qui porte le nom demandé par le client.
  const garde = process.env[VAR_HOTES];
  try {
    process.env[VAR_HOTES] = 'frigolog.fr';
    assert.equal(deploiementAutorise({
      host: 'frigologmcp.vercel.app', 'x-forwarded-host': 'frigolog.fr',
    }), true);
    assert.equal(deploiementAutorise({
      host: 'frigolog.fr', 'x-forwarded-host': 'frigolog-mcp.vercel.app',
    }), false, 'le host brut l\'emporte sur le nom réellement demandé');
  } finally { restaurerHotes(garde); }
});

ok('le port et la casse ne font pas rater un hôte légitime', () => {
  assert.equal(hoteDeLaRequete({ host: 'FrigoLog.FR:443' }), 'frigolog.fr');
  assert.equal(hoteDeLaRequete({ host: '  localhost:3000 ' }), 'localhost');
  assert.equal(hoteDeLaRequete({ host: ['frigolog.fr'] }), 'frigolog.fr');
  assert.equal(hoteDeLaRequete({}), '');
  assert.equal(hoteDeLaRequete({ host: 42 }), '');
});

// ─── 8. Le point d'entrée ──────────────────────────────────────────────
const ENDPOINT = () => lire('api', 'mcp-prive.ts');

ok('le privé n\'ouvre PAS le CORS', () => {
  // Le public répond `Access-Control-Allow-Origin: *` : il sert de la donnée
  // réglementaire à qui la demande. Ici, une clé qui vivrait dans un navigateur
  // serait déjà une clé perdue. Un `*` couplé à un en-tête Authorization
  // inviterait à faire exactement ce qu'il ne faut pas.
  const src = lireCode('api', 'mcp-prive.ts');
  assert.ok(src.length > 1500, 'api/mcp-prive.ts introuvable ou tronqué');
  assert.ok(!/Access-Control-Allow-Origin/.test(src), 'le privé ouvre le CORS');
  assert.ok(!/Access-Control-Allow-Methods/.test(src), 'le privé négocie avec un navigateur');
});

ok('le garde d\'hôte passe AVANT la lecture de la clé', () => {
  // Ainsi un déploiement non déclaré ne voit jamais passer un secret, même
  // pour le rejeter.
  const src = ENDPOINT();
  const iHote = src.indexOf('deploiementAutorise(');
  const iCle = src.indexOf('cleDepuisEnTete(');
  assert.ok(iHote > -1 && iCle > -1, 'un des deux gardes a disparu');
  assert.ok(iHote < iCle, 'la clé est lue avant que le déploiement soit autorisé');
});

ok('l\'authentification précède TOUTES les méthodes', () => {
  // Pas seulement tools/call : initialize et tools/list aussi. Sans clé, on ne
  // dit même pas quels outils existent — un inventaire est un renseignement.
  const src = ENDPOINT();
  const iAuth = src.indexOf('contextePourCle(');
  const iSwitch = src.indexOf("switch (req_.method)");
  assert.ok(iAuth > -1 && iSwitch > -1, 'extraction à revoir');
  assert.ok(iAuth < iSwitch, 'une méthode JSON-RPC est servie avant authentification');
  for (const m of ["case 'initialize'", "case 'tools/list'"]) {
    assert.ok(src.indexOf(m) > iAuth, `${m} est traité avant l'authentification`);
  }
});

ok('aucun message commercial dans les réponses privées', () => {
  // Le public colle un conseil + un lien sur chacune de ses 19 réponses ; il
  // parle à des inconnus. Ici l'appelant paie et lit ses propres relevés.
  for (const f of [['api', 'mcp-prive.ts'], ['lib', 'prive', 'outils.ts']]) {
    const src = lireCode(...f);
    assert.ok(!/ctaFor|conseil_pratique|CONSEIL_BY_TOOL/.test(src),
      `${f.join('/')} sert un message commercial à un client qui paie`);
    assert.ok(!/essai gratuit|sans engagement/i.test(src.replace(/obtenir_une_cle[^\n]*/g, '')),
      `${f.join('/')} contient une accroche commerciale`);
  }
});

ok('la permission d\'écriture se vérifie en UN endroit', () => {
  // Un outil ne porte pas la responsabilité de vérifier son propre droit
  // d'écrire : c'est le genre de vérification qu'on oublie au vingtième.
  const src = ENDPOINT();
  assert.ok(/outil\.permission === 'write' && !ctx\.peutEcrire\(\)/.test(src),
    'le contrôle central de la permission a disparu');
  const outils = lireCode('lib', 'prive', 'outils.ts');
  assert.ok(!/peutEcrire\(\)/.test(outils),
    'un outil vérifie lui-même sa permission — ce contrôle doit rester central');
});

ok('les lots JSON-RPC sont refusés', () => {
  const src = ENDPOINT();
  assert.ok(/Array\.isArray\(corps\)/.test(src), 'les lots ne sont plus refusés');
});

ok('aucun outil ne filtre par établissement — et c\'est voulu', () => {
  // L'isolation vient du claim, pas d'un filtre applicatif. Un filtre écrit à
  // la main donnerait l'illusion que c'est LUI qui protège, et le jour où il
  // manque quelque part on croirait avoir un garde là où il n'y en a pas.
  const src = lireCode('lib', 'prive', 'outils.ts');
  assert.ok(!/establishment_id=eq\./.test(src),
    'un outil filtre par establishment_id — faux garde, à retirer');
  assert.ok(src.includes('ctx.lire<'), 'les outils n\'utilisent plus le contexte');
});

ok('les outils bornent ce que l\'appelant demande', () => {
  // Un `limite` négatif ou absurde partirait sinon tel quel dans l'URL PostgREST.
  const src = lire('lib', 'prive', 'outils.ts');
  assert.ok(/LIMITE_MAX\s*=\s*\d+/.test(src), 'plus de plafond sur le nombre de lignes');
  assert.ok(/function borne\(/.test(src) && /function depuisIso\(/.test(src),
    'les bornes sur limite/jours ont disparu');
  const appels = [...src.matchAll(/limit=\$\{([^}]+)\}/g)].map((m) => m[1]);
  assert.ok(appels.length > 0, 'extraction à revoir');
  for (const a of appels) {
    assert.ok(a.includes('borne('), `un limit non borné : ${a}`);
  }
});

ok('aucun secret ni donnée de santé demandé par un outil', () => {
  // Décision CEO D2 / RGPD art. 9 pour la santé ; pin et pin_hash sont de toute
  // façon révoqués pour anon, mais on ne les demande pas non plus.
  const src = lireCode('lib', 'prive', 'outils.ts');
  for (const interdit of ['pin_hash', 'password', 'medical', 'sante_', 'certificat_aptitude']) {
    assert.ok(!src.includes(interdit), `un outil demande « ${interdit} »`);
  }
  assert.ok(!/select=\*/.test(src), 'un outil fait un select=* — colonnes explicites obligatoires');
});

console.log(`\n${passed} tests OK — MCP privé : clés, jeton, point de passage\n`);
