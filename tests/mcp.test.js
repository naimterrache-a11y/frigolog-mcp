// Frigolog HACCP MCP — test suite (zero dependencies, Node >= 20).
//
//   node tests/mcp.test.js
//   MCP_URL=https://frigologmcp.vercel.app/api/mcp node tests/mcp.test.js
//
// Groups:
//   1. regulatory-version.json structure + ISO dates + https URLs (deterministic).
//   2. source resolver: registry consistency + curated determinism + no-empty safety net.
//   3. URL liveness for every source link (network, smart status handling).
//   4. live MCP JSON-RPC contract: every tool response carries type / sources /
//      derniere_verification / version_schema (network, skips gracefully if the
//      endpoint is unreachable or not yet on schema v2).
//   7. conversion CTAs: content guard over data/cta.json (offline, deterministic).
//   8. commercial copy outside the CTAs: same guard applied to the Frigolog entry
//      of the comparison, the two frigolog_* advice fields and server.json
//      (offline, deterministic).
//
// Exit code is 0 unless a real FAIL occurs. Network-unavailable checks SKIP, not fail.
// URL liveness: 2xx/3xx = OK, 403/429 = live-but-protected (PASS — Légifrance WAF-blocks
// bots, EUR-Lex returns 202), 404/410/5xx = FAIL, network error = SKIP.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(
  readFileSync(path.join(ROOT, 'data', 'regulatory-version.json'), 'utf8'),
);

const MCP_URL = process.env.MCP_URL || 'https://frigologmcp.vercel.app/api/mcp';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ---- tiny runner -----------------------------------------------------------
let pass = 0;
let fail = 0;
let skip = 0;
const failures = [];

function ok(name) {
  pass++;
  console.log(`  ✓ ${name}`);
}
function ko(name, detail) {
  fail++;
  failures.push(`${name} — ${detail}`);
  console.log(`  ✗ ${name}\n      ${detail}`);
}
function skipped(name, why) {
  skip++;
  console.log(`  ∘ SKIP ${name} (${why})`);
}
function check(name, cond, detail) {
  if (cond) ok(name);
  else ko(name, detail || 'assertion failed');
}
function group(title) {
  console.log(`\n${title}`);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (s) =>
  typeof s === 'string' && ISO_DATE.test(s) && !Number.isNaN(Date.parse(s));
const isHttps = (s) => typeof s === 'string' && s.startsWith('https://');

// ---- JS port of resolveSources (mirrors lib/data/sources.ts) ---------------
function resolveIds(text) {
  if (!text) return ['gbph'];
  const hay = String(text).toLowerCase();
  const ids = [];
  for (const { match, source_id } of REG.resolver_patterns) {
    if (hay.includes(String(match).toLowerCase()) && !ids.includes(source_id)) {
      ids.push(source_id);
    }
  }
  return ids.length ? ids : ['gbph'];
}

const ALL_REFS = [...REG.regulations, ...REG.data_sources];
const REF_IDS = new Set(ALL_REFS.map((r) => r.id));

// ====== GROUP 1 — version file structure ====================================
function testVersionFile() {
  group('1. data/regulatory-version.json');
  check('schema_version === "2.0"', REG.schema_version === '2.0', `got ${REG.schema_version}`);
  check('last_updated is ISO date', isIsoDate(REG.last_updated), `got ${REG.last_updated}`);
  check('next_review is ISO date', isIsoDate(REG.next_review), `got ${REG.next_review}`);
  check(
    'next_review > last_updated',
    Date.parse(REG.next_review) > Date.parse(REG.last_updated),
    `${REG.next_review} <= ${REG.last_updated}`,
  );
  check('regulations is non-empty array', Array.isArray(REG.regulations) && REG.regulations.length > 0);
  check('data_sources is non-empty array', Array.isArray(REG.data_sources) && REG.data_sources.length > 0);

  const ids = new Set();
  const validTypes = new Set([
    'reglementaire_officiel',
    'guide_pratique',
    'comparatif_commercial',
    'donnee_temps_reel',
  ]);
  for (const r of ALL_REFS) {
    const tag = r.id || '(no id)';
    check(`[${tag}] has id/reference/url/type/verified_at`,
      r.id && r.reference && r.url && r.type && r.verified_at,
      `incomplete entry: ${JSON.stringify(r)}`);
    check(`[${tag}] url is https`, isHttps(r.url), `got ${r.url}`);
    check(`[${tag}] verified_at is ISO date`, isIsoDate(r.verified_at), `got ${r.verified_at}`);
    check(`[${tag}] type is valid`, validTypes.has(r.type), `got ${r.type}`);
    check(`[${tag}] id is unique`, !ids.has(r.id), `duplicate id ${r.id}`);
    ids.add(r.id);
  }
}

// ====== GROUP 2 — source resolver ===========================================
function testResolver() {
  group('2. source resolver');

  // (a) every resolver pattern points to a known source id.
  for (const p of REG.resolver_patterns) {
    check(`pattern "${p.match}" -> known id "${p.source_id}"`, REF_IDS.has(p.source_id),
      `unknown source id ${p.source_id}`);
  }

  // (b) curated determinism — real reference strings from lib/data/*.ts.
  const cases = [
    ["Règlement (CE) n° 853/2004 — règles spécifiques d'hygiène", ['ce_853']],
    ['Arrêté du 21 décembre 2009 relatif aux règles sanitaires', ['arrete_2009']],
    ["Guide des Bonnes Pratiques d'Hygiène en Restauration (DGAL)", ['gbph']],
    ['Règlement (UE) n° 1169/2011 INCO', ['inco_1169']],
    ['Règlement (CE) n° 178/2002 article 19 + Code de la consommation L412-1', ['ce_178', 'code_conso']],
    ['Règlement (CE) n° 852/2004 — hygiène des denrées alimentaires + Règlement (CE) n° 853/2004', ['ce_852', 'ce_853']],
    ['Décret n° 2008-184 du 26 février 2008', ['decret_2008_184']],
    ['Code du travail R4624-22', ['code_travail']],
    ['Règlement (CE) n° 2073/2005 — critères microbiologiques', ['ce_2073']],
    ['Règlement (UE) n° 1379/2013 — OCM produits de la pêche', ['ue_1379']],
    [
      "Article L.233-4 du Code rural et de la pêche maritime — Arrêté du 5 octobre 2011 modifié par l'arrêté du 12 février 2024",
      ['code_rural', 'arrete_2011_formation', 'arrete_2024_formation'],
    ],
  ];
  for (const [text, expected] of cases) {
    const got = resolveIds(text).sort();
    const want = [...expected].sort();
    check(`resolve: "${text.slice(0, 48)}..."`,
      JSON.stringify(got) === JSON.stringify(want),
      `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  }

  // (c) safety net — never empty.
  check('resolve("") is non-empty', resolveIds('').length > 0);
  check('resolve(unknown) is non-empty', resolveIds('foo bar baz').length > 0);
}

// ====== GROUP 3 — URL liveness ==============================================
async function fetchStatus(url) {
  const ctrl = AbortSignal.timeout(20000);
  // GET (not HEAD): many gov servers reject HEAD. redirect:follow.
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: ctrl,
    headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*' },
  });
  return res.status;
}

async function testUrlLiveness() {
  group('3. source URL liveness');
  for (const r of ALL_REFS) {
    let status;
    try {
      status = await fetchStatus(r.url);
    } catch (err) {
      skipped(`${r.id} (${r.url})`, `network: ${err?.name || err}`);
      continue;
    }
    if (status >= 200 && status < 400) {
      ok(`${r.id} -> ${status}`);
    } else if (status === 403 || status === 429) {
      // Live but bot-protected / rate-limited (Légifrance WAF returns 403). Counted as PASS.
      ok(`${r.id} -> ${status} (live, protected)`);
    } else {
      ko(`${r.id} (${r.url})`, `HTTP ${status}`);
    }
  }
}

// ====== GROUP 4 — live MCP contract =========================================
async function rpc(method, params) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params || {} }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function unwrapToolResult(rpcResponse) {
  const text = rpcResponse?.result?.content?.[0]?.text;
  if (typeof text !== 'string') throw new Error('no content[0].text');
  return JSON.parse(text);
}

function assertWrapper(label, wrapped) {
  check(`[${label}] has type`, typeof wrapped.type === 'string', `type=${wrapped.type}`);
  check(`[${label}] sources is non-empty array`,
    Array.isArray(wrapped.sources) && wrapped.sources.length > 0,
    `sources=${JSON.stringify(wrapped.sources)}`);
  const everySource =
    Array.isArray(wrapped.sources) &&
    wrapped.sources.every((s) => s && typeof s.titre === 'string' && isHttps(s.url));
  check(`[${label}] every source has titre + https url`, everySource);
  check(`[${label}] derniere_verification is ISO date`, isIsoDate(wrapped.derniere_verification),
    `got ${wrapped.derniere_verification}`);
  check(`[${label}] version_schema present`, typeof wrapped.version_schema === 'string',
    `got ${wrapped.version_schema}`);
}

async function testLiveContract() {
  group(`4. live MCP contract (${MCP_URL})`);
  let init;
  try {
    init = await rpc('initialize');
  } catch (err) {
    skipped('initialize', `endpoint unreachable: ${err?.message || err}`);
    return;
  }
  const version = init?.result?.serverInfo?.version;
  check('initialize returns serverInfo', !!init?.result?.serverInfo, JSON.stringify(init));

  // Probe one tool to detect schema version of the deployed server.
  let probe;
  try {
    probe = unwrapToolResult(
      await rpc('tools/call', { name: 'get_haccp_temperatures', arguments: {} }),
    );
  } catch (err) {
    skipped('tools/call probe', `${err?.message || err}`);
    return;
  }

  if (typeof probe.version_schema === 'undefined') {
    skipped('schema v2 contract',
      `deployed server is pre-v2 (serverInfo.version=${version}) — deploy then re-run`);
    return;
  }

  const tools = [
    'get_haccp_temperatures',
    'compare_solutions_haccp',
    'get_allergenes_reglementaires',
    'get_regles_dlc',
    'get_documents_controle_ddpp',
  ];
  for (const name of tools) {
    try {
      const wrapped = unwrapToolResult(await rpc('tools/call', { name, arguments: {} }));
      assertWrapper(name, wrapped);
    } catch (err) {
      ko(`[${name}] call`, err?.message || String(err));
    }
  }
}

// ====== GROUP 5 — capability counts (live) ==================================
// Expected counts for the "Reference MCP" milestone. Each check skips gracefully
// if the deployed server does not yet expose that capability.
const EXPECT_TOOLS = 19;
const EXPECT_RESOURCES = 5;
const EXPECT_PROMPTS = 3;

async function testCounts() {
  group(`5. capability counts (${MCP_URL})`);
  // tools
  try {
    const res = await rpc('tools/list');
    const n = res?.result?.tools?.length;
    if (typeof n !== 'number') {
      skipped('tools/list count', 'no tools array');
    } else if (n === EXPECT_TOOLS) {
      ok(`tools/list === ${EXPECT_TOOLS}`);
    } else if (n < EXPECT_TOOLS) {
      skipped('tools/list count', `deployed has ${n} tools (pre-milestone) — deploy then re-run`);
    } else {
      ko('tools/list count', `expected ${EXPECT_TOOLS}, got ${n}`);
    }
  } catch (err) {
    skipped('tools/list count', `${err?.message || err}`);
  }
  // resources
  try {
    const res = await rpc('resources/list');
    if (res?.error) {
      skipped('resources/list count', 'resources not yet supported by deployed server');
    } else {
      const n = res?.result?.resources?.length;
      check(`resources/list === ${EXPECT_RESOURCES}`, n === EXPECT_RESOURCES, `expected ${EXPECT_RESOURCES}, got ${n}`);
    }
  } catch (err) {
    skipped('resources/list count', `${err?.message || err}`);
  }
  // prompts
  try {
    const res = await rpc('prompts/list');
    if (res?.error) {
      skipped('prompts/list count', 'prompts not yet supported by deployed server');
    } else {
      const n = res?.result?.prompts?.length;
      check(`prompts/list === ${EXPECT_PROMPTS}`, n === EXPECT_PROMPTS, `expected ${EXPECT_PROMPTS}, got ${n}`);
    }
  } catch (err) {
    skipped('prompts/list count', `${err?.message || err}`);
  }
}

// ====== GROUP 6 — new automation tools 17/18/19 (live) ======================
// These tools require arguments, so they can't be exercised by the generic
// empty-args probe in group 4. Each is called with valid args and its wrapper
// + a tool-specific invariant is asserted. Skips gracefully before the v2.2.0
// deploy (when the live server still exposes only 16 tools).
async function testNewAutomationTools() {
  group(`6. new automation tools 17/18/19 (${MCP_URL})`);
  let names;
  try {
    const res = await rpc('tools/list');
    names = new Set((res?.result?.tools || []).map((t) => t.name));
  } catch (err) {
    skipped('new automation tools', `tools/list unreachable: ${err?.message || err}`);
    return;
  }
  const NEW = [
    'get_rappels_par_categorie_etablissement',
    'get_calendrier_obligations',
    'get_risque_inspection',
  ];
  if (!NEW.every((n) => names.has(n))) {
    skipped('new automation tools', 'deployed server is pre-v2.2.0 (16 tools) — deploy then re-run');
    return;
  }

  // 17 — rappels filtrés par établissement (live RappelConso).
  try {
    const w = unwrapToolResult(
      await rpc('tools/call', {
        name: 'get_rappels_par_categorie_etablissement',
        arguments: { type_etablissement: 'boucherie' },
      }),
    );
    assertWrapper('get_rappels_par_categorie_etablissement', w);
    check(
      '[rappels_par_etab] type is donnee_temps_reel',
      w.type === 'donnee_temps_reel',
      `type=${w.type}`,
    );
    check(
      '[rappels_par_etab] totals are consistent',
      w.data &&
        Array.isArray(w.data.rappels_pertinents) &&
        w.data.total_rappels_pertinents === w.data.rappels_pertinents.length,
      `pertinents=${w.data?.total_rappels_pertinents} len=${w.data?.rappels_pertinents?.length}`,
    );
    check(
      '[rappels_par_etab] categories_surveillees non-empty',
      Array.isArray(w.data?.categories_surveillees) && w.data.categories_surveillees.length > 0,
    );
  } catch (err) {
    ko('[get_rappels_par_categorie_etablissement] call', err?.message || String(err));
  }

  // 17 bis — restaurant surveille tout => 0 ignoré.
  try {
    const w = unwrapToolResult(
      await rpc('tools/call', {
        name: 'get_rappels_par_categorie_etablissement',
        arguments: { type_etablissement: 'restaurant' },
      }),
    );
    check(
      '[rappels_par_etab:restaurant] watches all (total_rappels_ignores === 0)',
      w.data?.total_rappels_ignores === 0,
      `ignores=${w.data?.total_rappels_ignores}`,
    );
  } catch (err) {
    ko('[rappels_par_etab:restaurant] call', err?.message || String(err));
  }

  // 18 — calendrier des obligations (logique pure).
  try {
    const w = unwrapToolResult(
      await rpc('tools/call', {
        name: 'get_calendrier_obligations',
        arguments: {
          type_etablissement: 'boulangerie',
          derniere_formation_haccp: '2020-01-01', // > 5 ans => rouge
          dernier_audit_interne: '2026-05-01', // récent => vert
        },
      }),
    );
    assertWrapper('get_calendrier_obligations', w);
    check('[calendrier] type is guide_pratique', w.type === 'guide_pratique', `type=${w.type}`);
    check(
      '[calendrier] returns 4 obligations',
      Array.isArray(w.data?.obligations) && w.data.obligations.length === 4,
      `got ${w.data?.obligations?.length}`,
    );
    const formation = w.data?.obligations?.[0];
    check(
      '[calendrier] formation > 5 ans => rouge',
      formation?.urgence === 'rouge',
      `urgence=${formation?.urgence}`,
    );
    check(
      '[calendrier] each obligation has urgence in {vert,orange,rouge}',
      (w.data?.obligations || []).every((o) => ['vert', 'orange', 'rouge'].includes(o.urgence)),
    );
  } catch (err) {
    ko('[get_calendrier_obligations] call', err?.message || String(err));
  }

  // 19 — risque inspection (logique pure + map départements).
  try {
    const w = unwrapToolResult(
      await rpc('tools/call', {
        name: 'get_risque_inspection',
        arguments: {
          type_etablissement: 'restaurant',
          departement: '75',
          dernier_controle_ddpp: '2018-01-01', // très ancien => eleve
        },
      }),
    );
    assertWrapper('get_risque_inspection', w);
    check('[risque] type is guide_pratique', w.type === 'guide_pratique', `type=${w.type}`);
    check('[risque] departement 75 => Paris', w.data?.nom_departement === 'Paris', `got ${w.data?.nom_departement}`);
    check(
      '[risque] very old control => score eleve',
      w.data?.score_risque === 'eleve',
      `score=${w.data?.score_risque}`,
    );
    check(
      '[risque] recommandations non-empty',
      Array.isArray(w.data?.recommandations) && w.data.recommandations.length > 0,
    );
  } catch (err) {
    ko('[get_risque_inspection] call', err?.message || String(err));
  }

  // 19 bis — département inconnu géré proprement, pas de crash.
  try {
    const w = unwrapToolResult(
      await rpc('tools/call', {
        name: 'get_risque_inspection',
        arguments: { type_etablissement: 'boucherie', departement: '999' },
      }),
    );
    check(
      '[risque:dep-inconnu] nom_departement = "Département inconnu"',
      w.data?.nom_departement === 'Département inconnu',
      `got ${w.data?.nom_departement}`,
    );
  } catch (err) {
    ko('[risque:dep-inconnu] call', err?.message || String(err));
  }
}

// ====== GROUP 7 — CTAs de conversion (offline, déterministe) ================
// Ce groupe ne parle PAS au serveur déployé, et c'est délibéré : il garde le
// CONTENU commercial servi à ~717 appels/semaine, et ce contenu doit être validé
// AVANT le déploiement, pas après. Un garde qui n'existe qu'en prod arrive trop
// tard.
//
// Il lit data/cta.json — le fichier que le serveur lit lui-même (lib/data/cta.ts).
// Pas de copie des textes ici : un garde qui tient sa propre copie de la vérité
// finit par garder l'ancienne.
//
// Règles gardées (docs/operations/decisions.md du dépôt frigolog-brain) :
//   PROD-01 — tout conseil finit par « Essai gratuit 14 jours, sans engagement. »,
//             jamais « sans CB » / « sans carte bancaire ».
//   PROD-02 — aucun conseil ne nomme Alim'confiance.
//   MKT-05  — pas de superlatif creux : ni « leader », ni « innovant ».
//   Lien    — https://frigolog.fr/? ... le « / » avant le « ? » n'est pas
//             cosmétique : c'est la différence entre une campagne mesurée et
//             717 prospects perdus par semaine sans un seul signal.
const CTA = JSON.parse(readFileSync(path.join(ROOT, 'data', 'cta.json'), 'utf8'));
const CTA_SUFFIX = 'Essai gratuit 14 jours, sans engagement.';
const CTA_LIEN_PREFIX = 'https://frigolog.fr/?';
const CTA_BANNED = [
  'sans cb',
  'sans carte bancaire',
  'leader',
  'innovant',
  "alim'confiance",
  'alimconfiance',
];

// Normalise les apostrophes typographiques : « Alim’confiance » et
// « Alim'confiance » sont le même mot interdit, et seul l'un des deux se tape
// naturellement.
const ctaNormalize = (s) => String(s).toLowerCase().replace(/[’‘`]/g, "'");

// LE garde, isolé en fonction pure — parce qu'il est lui-même testé plus bas
// contre des textes volontairement fautifs. Un garde qu'on n'a jamais vu
// refuser quoi que ce soit ne prouve rien.
function ctaViolations(tool, conseil, lien) {
  const out = [];
  if (typeof conseil !== 'string' || conseil.trim() === '') {
    out.push('conseil_pratique vide ou absent');
  } else {
    if (!conseil.endsWith(CTA_SUFFIX)) out.push(`PROD-01 : ne finit pas par « ${CTA_SUFFIX} »`);
    const hay = ctaNormalize(conseil);
    for (const banned of CTA_BANNED) {
      if (hay.includes(banned)) out.push(`terme interdit « ${banned} »`);
    }
  }
  if (typeof lien !== 'string' || !lien.startsWith(CTA_LIEN_PREFIX)) {
    out.push(`lien ne commence pas par ${CTA_LIEN_PREFIX} (le « / » avant le « ? »)`);
  } else if (!lien.endsWith(`utm_campaign=${tool}`)) {
    out.push(`utm_campaign ne vaut pas « ${tool} » (lien=${lien})`);
  }
  return out;
}

const ctaLien = (tool) => String(CTA.lien_template).replace('{tool}', tool);

// Les 19 outils, lus depuis la SEULE déclaration qui fait foi : le tableau TOOLS
// d'api/mcp.ts. Le test ne tient pas sa propre liste — sinon un 20e outil
// arriverait sans CTA et sans que rien ne le dise.
function declaredToolNames() {
  const src = readFileSync(path.join(ROOT, 'api', 'mcp.ts'), 'utf8');
  const start = src.indexOf('const TOOLS = [');
  const end = src.indexOf('\n];', start);
  if (start === -1 || end === -1) return [];
  return [...src.slice(start, end).matchAll(/\bname: '([a-z_]+)'/g)].map((m) => m[1]);
}

function testCtas() {
  group('7. CTAs de conversion (offline — data/cta.json)');

  // (a) gabarit du lien : un seul endroit porte le « / », on le vérifie une fois.
  check('lien_template commence par https://frigolog.fr/?',
    typeof CTA.lien_template === 'string' && CTA.lien_template.startsWith(CTA_LIEN_PREFIX),
    `got ${CTA.lien_template}`);
  check('lien_template contient le jeton {tool}',
    String(CTA.lien_template).includes('{tool}'), `got ${CTA.lien_template}`);
  check('lien_template porte utm_source=mcp & utm_medium=tool',
    String(CTA.lien_template).includes('utm_source=mcp') &&
      String(CTA.lien_template).includes('utm_medium=tool'),
    `got ${CTA.lien_template}`);

  // (b) l'extraction des outils doit ramener quelque chose. Sans ce contrôle,
  //     une regex cassée rendrait « chaque outil a un CTA » vrai par le vide.
  const tools = declaredToolNames();
  check(`api/mcp.ts déclare ${EXPECT_TOOLS} outils`, tools.length === EXPECT_TOOLS,
    `extrait ${tools.length} : ${JSON.stringify(tools)}`);

  // (c) couverture, dans les deux sens.
  const conseils = CTA.conseils || {};
  for (const tool of tools) {
    check(`[${tool}] a un conseil_pratique`, typeof conseils[tool] === 'string',
      'aucune entrée dans data/cta.json — tout nouvel outil doit arriver avec son CTA');
  }
  const known = new Set(tools);
  for (const tool of Object.keys(conseils)) {
    check(`[${tool}] correspond à un outil réel`, known.has(tool),
      "CTA orphelin : cet outil n'existe pas (ou plus) dans api/mcp.ts");
  }

  // (d) le contenu, outil par outil.
  for (const tool of Object.keys(conseils)) {
    const v = ctaViolations(tool, conseils[tool], ctaLien(tool));
    check(`[${tool}] conseil + lien conformes`, v.length === 0, v.join(' | '));
  }

  // (e) une campagne par outil — sinon deux outils se confondent dans les stats.
  const campagnes = Object.keys(conseils).map(ctaLien);
  check('un lien unique par outil', new Set(campagnes).size === campagnes.length,
    'doublon d’utm_campaign');

  // (f) META-TEST — on regarde le garde REFUSER. Chaque cas ci-dessous est un
  //     texte qui a déjà failli partir en production ; si l'un d'eux passe, le
  //     garde des points (d) et (e) ne vaut plus rien et ce test le dit ici,
  //     plutôt qu'après 717 appels.
  const poison = [
    ['sans CB', `Frigolog fait le travail. Essai gratuit 14 jours, sans CB.`, ctaLien('x')],
    ['sans carte bancaire', `Essai gratuit 14 jours, sans carte bancaire.`, ctaLien('x')],
    ['leader', `Frigolog, leader du HACCP. Essai gratuit 14 jours, sans engagement.`, ctaLien('x')],
    ['innovant', `Frigolog, outil innovant. Essai gratuit 14 jours, sans engagement.`, ctaLien('x')],
    ["Alim'confiance", `Améliorez votre score Alim'confiance. Essai gratuit 14 jours, sans engagement.`, ctaLien('x')],
    ['Alim’confiance (apostrophe typographique)', `Votre score Alim’confiance grimpe. Essai gratuit 14 jours, sans engagement.`, ctaLien('x')],
    ['suffixe PROD-01 tronqué', `Frigolog archive vos relevés. Essai gratuit 14 jours.`, ctaLien('x')],
    ['lien sans le / avant le ?', `Frigolog archive vos relevés. Essai gratuit 14 jours, sans engagement.`, 'https://frigolog.fr?utm_source=mcp&utm_medium=tool&utm_campaign=x'],
    ['conseil vide', '', ctaLien('x')],
  ];
  for (const [label, conseil, lien] of poison) {
    const v = ctaViolations('x', conseil, lien);
    check(`le garde REFUSE : ${label}`, v.length > 0,
      'le garde a laissé passer un texte interdit — il ne garde rien');
  }
  // Et il accepte un texte conforme : un garde qui refuse tout est aussi inutile
  // qu'un garde qui accepte tout.
  check('le garde ACCEPTE un CTA conforme',
    ctaViolations('x', `Frigolog archive vos relevés. ${CTA_SUFFIX}`, ctaLien('x')).length === 0);
}

// ====== GROUP 8 — copie commerciale hors CTAs (offline, déterministe) =======
// Le groupe 7 ne garde que data/cta.json. Ça ne suffisait pas : le MCP servait
// « 14 jours sans carte bancaire » dans la MÊME réponse JSON qu'un CTA réécrit
// pour éviter exactement cette formule. Un garde dont on ne sait pas ce qu'il
// ne couvre pas finit par faire passer son vert pour une preuve de conformité.
//
// Ce groupe garde les textes commerciaux servis par le MCP en DEHORS des CTAs.
//
// PÉRIMÈTRE, et pourquoi il est étroit exprès. On ne scanne PAS tout le jeu de
// données. Ce serveur cite légitimement Alim'confiance, RappelConso, la DGAL et
// la DGCCRF : ce sont ses sources officielles, un outil s'appelle même
// get_score_alimconfiance. Interdire ces mots partout rendrait le test rouge sur
// de la donnée réglementaire correcte, et un test rouge qu'on apprend à ignorer
// ne revient jamais au vert. On garde donc les endroits où Frigolog PARLE DE
// FRIGOLOG :
//   - l'entrée Frigolog du comparatif (tous ses textes, champs futurs compris) ;
//   - sanctions.ts    -> conseil_frigolog ;
//   - alimconfiance.ts -> frigolog_et_alimconfiance ;
//   - server.json     -> websiteUrl (la vitrine du registre MCP officiel).
//
// NON couvert, et c'est délibéré : les `point_fort` des CONCURRENTS. Celui
// d'ePackPro dit « Leader historique du marché » — c'est une description d'un
// tiers dans un comparatif, pas une revendication de Frigolog sur Frigolog.
// À trancher côté business, pas ici.
const COM_BANNED_PHRASES = [
  'sans cb',
  'sans carte bancaire',
  'leader',
  'innovant',
  'unique solution',
  "alim'confiance",
  'alimconfiance',
];

// Fournisseurs techniques : on dit ce que ça fait, jamais avec quoi (MKT-05).
// Nommer notre fournisseur d'IA en clair renseignait gratuitement ceux qui nous
// copient. Comparaison par MOT ENTIER — en sous-chaîne, « react » mordrait dans
// n'importe quel mot français, et un garde qui crie à tort finit désarmé.
const COM_BANNED_VENDORS = [
  'claude', 'anthropic', 'openai', 'chatgpt', 'gpt', 'gemini', 'mistral',
  'supabase', 'vercel', 'postgres', 'postgresql', 'react', 'next.js', 'nextjs',
  'stripe', 'twilio', 'cloudflare',
];

// Promesses de résultat et preuve sociale fabriquée. Deux des cinq textes
// retirés aujourd'hui ne contenaient AUCUN mot interdit — « les clients
// obtiennent systématiquement Très satisfaisant » et « réduit le risque à quasi
// zéro » passaient le garde lexical sans broncher. C'est la famille la plus
// coûteuse (on affirme un résultat qu'on ne mesure pas) et la plus invisible.
// Ces marqueurs n'attrapent pas l'intention, seulement ses formulations
// habituelles : un absolu sur ce que produit Frigolog. C'est un filet, pas une
// preuve — une relecture humaine reste la vraie défense.
const COM_BANNED_PROMISES = [
  'systématiquement',
  'quasi zéro',
  'zéro risque',
  'à coup sûr',
  'garantit',
  'garantie de résultat',
  'sans aucun risque',
];

// Le « / » avant le « ? ». Même règle que pour les liens de CTA : un lien de
// campagne cassé ne se signale jamais, il perd les prospects en silence.
const COM_BAD_LINK = 'frigolog.fr?';

function commercialViolations(texte) {
  const out = [];
  const brut = ctaNormalize(texte);

  // La règle du lien se lit sur le texte BRUT : c'est justement le « ? » qu'on
  // cherche. Elle passe donc avant tout nettoyage.
  if (brut.includes(COM_BAD_LINK)) out.push('lien sans le « / » avant le « ? »');

  // Les paramètres de tracking ne sont PAS de la copie. `utm_source=claude` dit
  // d'où vient le visiteur, il n'est jamais lu par un prospect — l'interdire
  // reviendrait à choisir entre mesurer nos campagnes et respecter MKT-05.
  // On retire donc la query string avant de chercher des mots.
  const prose = brut.replace(/(https?:\/\/[^\s"]*?)\?[^\s"]*/g, '$1');

  for (const p of COM_BANNED_PHRASES) if (prose.includes(p)) out.push(`terme interdit « ${p} »`);
  for (const p of COM_BANNED_PROMISES) {
    if (prose.includes(p)) out.push(`promesse de résultat « ${p} »`);
  }
  for (const v of COM_BANNED_VENDORS) {
    // Encadrement à la main : `\b` casse sur les noms à point (« next.js »).
    // La borne exclut les lettres et les chiffres, PAS le point — sans quoi un
    // simple point final (« …sur Supabase. ») suffisait à passer au travers.
    const re = new RegExp(`(^|[^a-z0-9])${v.replace(/\./g, '\\.')}($|[^a-z0-9])`);
    if (re.test(prose)) out.push(`fournisseur technique nommé « ${v} »`);
  }
  return out;
}

// Extraction depuis les sources TypeScript. Le serveur lit ces fichiers en .ts ;
// la suite de tests est du Node nu et ne sait pas les importer. On lit donc le
// source — et CHAQUE extraction est vérifiée non vide juste en dessous, parce
// qu'une regex qui ne matche plus rendrait tout ce groupe vert par le vide.
function readSrc(...parts) {
  return readFileSync(path.join(ROOT, ...parts), 'utf8');
}

// Toutes les chaînes littérales de l'entrée Frigolog du comparatif. On prend le
// BLOC entier plutôt qu'une liste de champs : un champ ajouté demain est gardé
// sans que personne ait à y penser.
function frigologBlockStrings() {
  const src = readSrc('lib', 'data', 'comparatif-solutions.ts');
  const start = src.indexOf('nom: "Frigolog"');
  if (start === -1) return [];
  const next = src.indexOf('nom: "', start + 10); // début de la solution suivante
  const block = src.slice(start, next === -1 ? src.length : next);
  return [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
}

// Valeur d'un champ texte nommé, dans un fichier de données.
function tsFieldValue(file, field) {
  const src = readSrc(...file);
  const m = src.match(new RegExp(`${field}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? m[1] : null;
}

function testCommercialCopy() {
  group('8. copie commerciale hors CTAs (offline)');

  // (a) entrée Frigolog du comparatif.
  const strings = frigologBlockStrings();
  check('entrée Frigolog du comparatif extraite', strings.length > 5,
    `${strings.length} chaîne(s) extraite(s) — regex à revoir`);
  for (const s of strings) {
    const v = commercialViolations(s);
    check(`[comparatif/Frigolog] « ${s.slice(0, 44)}… »`, v.length === 0, v.join(' | '));
  }

  // (b) les deux conseils commerciaux nichés dans la donnée réglementaire.
  const champs = [
    [['lib', 'data', 'sanctions.ts'], 'conseil_frigolog'],
    [['lib', 'data', 'alimconfiance.ts'], 'frigolog_et_alimconfiance'],
  ];
  for (const [file, field] of champs) {
    const val = tsFieldValue(file, field);
    check(`${field} extrait de ${file[file.length - 1]}`, typeof val === 'string' && val.length > 20,
      `extraction vide — regex à revoir (got ${val})`);
    if (typeof val === 'string') {
      const v = commercialViolations(val);
      check(`[${field}] conforme`, v.length === 0, v.join(' | '));
    }
  }

  // (c) server.json — notre fiche sur le registre MCP officiel.
  const server = JSON.parse(readSrc('server.json'));
  check('server.json websiteUrl porte le « / » avant le « ? »',
    typeof server.websiteUrl === 'string' && !server.websiteUrl.includes(COM_BAD_LINK),
    `got ${server.websiteUrl}`);
  check('server.json websiteUrl conforme', commercialViolations(server.websiteUrl || '').length === 0);
  check('server.json description conforme',
    commercialViolations(server.description || '').length === 0,
    commercialViolations(server.description || '').join(' | '));

  // (c bis) UN FAIT, UN FOYER. Le prix de l'imprimante était écrit à deux
  // endroits — « ~39 € » dans le comparatif, « ~35 € » dans le CTA — donc deux
  // chiffres concurrents dans la même réponse JSON. Aucun garde lexical ne voit
  // ça : les deux textes sont irréprochables séparément. Ce test compare les
  // deux foyers et échoue s'ils divergent, sans dire lequel a raison — c'est
  // une question de fait, pas de copie.
  const prixCta = (CTA.conseils?.get_regles_dlc || '').match(/~\s*(\d+)\s*€/);
  const noteHw = strings.find((s) => s.includes('Imprimante')) || '';
  const prixCmp = noteHw.match(/~\s*(\d+)\s*€/);
  check('prix imprimante extrait des deux côtés',
    !!prixCta && !!prixCmp, `cta=${prixCta && prixCta[1]} comparatif=${prixCmp && prixCmp[1]}`);
  if (prixCta && prixCmp) {
    check('prix imprimante cohérent entre le CTA et le comparatif',
      prixCta[1] === prixCmp[1],
      `CTA dit ~${prixCta[1]} €, comparatif dit ~${prixCmp[1]} € — un seul des deux est vrai`);
  }

  // (c ter) LE BLOC CONCURRENTS. Nous décrivons des tiers en public, 717 fois
  // par semaine. Deux garde-fous seulement — et le choix de s'arrêter là est
  // délibéré, voir le commentaire sous la boucle.
  const srcCmp = readSrc('lib', 'data', 'comparatif-solutions.ts');
  const entrees = [...srcCmp.matchAll(/nom: "([^"]+)"/g)].map((m) => m[1]);
  check('7 solutions dans le comparatif', entrees.length === 7,
    `${entrees.length} extraite(s) : ${entrees.join(', ')}`);

  // 1. Le même standard pour tout le monde. On s'interdit « leader » parce que
  //    c'est invérifiable ; l'employer pour un concurrent avec la même absence
  //    de preuve, c'est abandonner la règle au moment où elle nous coûte
  //    quelque chose. Le bloc Frigolog est déjà couvert en (a) ; ici, tout ce
  //    qui vient après lui, c'est-à-dire les six concurrents.
  const blocConcurrents = srcCmp.slice(srcCmp.indexOf('nom: "ePackPro"'));
  const strConcurrents = [...blocConcurrents.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  check('textes concurrents extraits', strConcurrents.length > 40,
    `${strConcurrents.length} chaîne(s) — regex à revoir`);
  for (const s of strConcurrents) {
    const v = commercialViolations(s);
    check(`[concurrents] « ${s.slice(0, 40)}… »`, v.length === 0, v.join(' | '));
  }

  // 2. Ce que le canonique impose nommément : l'engagement et les frais
  //    d'installation d'ePackPro ne sont PAS publiés par l'éditeur. Les
  //    affirmer nus, c'est présenter comme un fait public une information
  //    privée — le seul sujet de cette liste qui puisse nous valoir une lettre
  //    d'avocat. Ils ne s'énoncent jamais sans leur mention de source.
  const epp = srcCmp.slice(srcCmp.indexOf('nom: "ePackPro"'), srcCmp.indexOf('nom: "Octopus'));
  check('bloc ePackPro extrait', epp.length > 200, `${epp.length} caractères`);
  for (const champ of ['engagement', 'frais_installation']) {
    const m = epp.match(new RegExp(`${champ}: "([^"]*)"`));
    check(`[ePackPro] ${champ} porte sa mention de source`,
      !!m && /constaté sur des contrats clients/.test(m[1]) && /non publié par l'éditeur/.test(m[1]),
      `got ${m ? m[1] : '(champ non trouvé ou numérique nu)'}`);
  }

  // 3. Les « failles exploitables » du canonique : un angle de discussion
  //    INTERNE, sans relevé ni date ni contrat, à ne jamais affirmer dans un
  //    contenu public — et le MCP est un contenu public. Le canonique nomme
  //    trois mots : « imposée », « par commercial », « obligatoire ».
  //
  //    Règle VOLONTAIREMENT limitée au bloc ePackPro. Interdire « imposé »
  //    partout casserait deux usages légitimes et opposés : « sans matériel
  //    imposé » (Frigolog) et « jamais imposés » (Traqfood). Le canonique ne
  //    traite d'ailleurs que d'ePackPro. Interdire un mot au-delà de la portée
  //    de la règle qui le motive, c'est le meilleur moyen de faire désarmer le
  //    garde entier au premier faux positif.
  //    Même prudence sur « commercial » : on interdit les tournures précises
  //    (« technicien commercial », « par un commercial ») et PAS le mot seul,
  //    parce que le texte validé pour ePackPro dit « réseau commercial de
  //    terrain ». Un garde qui refuse le texte qu'on vient de valider ne
  //    survit pas à la semaine.
  const FAILLES = [
    'imposé', 'imposée', 'imposés', 'imposées',
    'par commercial', 'par un commercial', 'technicien commercial',
    'obligatoire',
  ];
  const eppStrings = [...epp.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  for (const s of eppStrings) {
    const hay = ctaNormalize(s);
    const hits = FAILLES.filter((f) => hay.includes(f));
    check(`[ePackPro] « ${s.slice(0, 40)}… » sans angle interne`, hits.length === 0,
      `mot non sourçable : ${hits.join(', ')} — cf. « failles exploitables » du canonique`);
  }

  // CE QUE CE GARDE NE FAIT PAS, ET POURQUOI. Il ne sait pas repérer une
  // revendication de position de marché non sourcée (« le moins cher du
  // marché », « leader mondial »). Il faudrait interdire « le plus », « le
  // moins », « du marché » — or le texte de remplacement validé pour ePackPro
  // dit précisément « Le plus connu du marché français ». Un garde qui refuse
  // le texte qu'on vient de valider se fait désarmer dans la semaine. Ces
  // revendications se retirent à la relecture, pas au grep.
  // Il ne vérifie pas non plus que les prix concurrents correspondent au
  // fichier canonique docs/concurrents/concurrents.md : celui-ci vit dans un
  // autre dépôt, que ce serveur public ne peut pas lire. C'est la limite
  // structurelle du « le MCP cite, il ne redit pas » — ici il redit forcément,
  // donc la date de relevé est portée dans note_verification pour que la
  // divergence soit au moins visible.

  // (d) META-TEST — on regarde CE garde-ci refuser. Chaque texte ci-dessous a
  //     réellement été servi en production jusqu'à aujourd'hui.
  const poison = [
    ['« sans carte bancaire » (le texte servi jusqu’ici)', '14 jours sans carte bancaire'],
    ['« sans CB »', 'Essai 14 jours sans CB'],
    ['« leader »', 'Leader historique du marché HACCP français.'],
    ['« innovant »', 'Un outil innovant pour la restauration.'],
    ['« unique solution »', 'Unique solution IA-first du marché français.'],
    ['fournisseur d’IA nommé', 'Scan étiquettes 13 champs en 8 secondes via Claude Vision.'],
    ['base de données nommée', 'Vos données sont stockées sur Supabase.'],
    ["Alim'confiance en argument", "Améliorez votre score Alim'confiance avec Frigolog."],
    ['Alim’confiance (apostrophe typographique)', 'Votre score Alim’confiance grimpe.'],
    ['lien sans le « / »', 'https://frigolog.fr?utm_source=claude'],
    // Les deux qui passaient le garde lexical — la raison de COM_BANNED_PROMISES.
    ['preuve sociale fabriquée', "Les clients Frigolog obtiennent systématiquement 'Très satisfaisant'."],
    ['garantie de résultat', 'Ce qui réduit le risque de mise en demeure à quasi zéro.'],
  ];
  for (const [label, texte] of poison) {
    check(`le garde REFUSE : ${label}`, commercialViolations(texte).length > 0,
      'texte interdit laissé passer — le garde ne garde rien');
  }
  // …et il laisse passer les textes légitimes. Un garde qui refuse tout est
  // aussi inutile qu'un garde qui accepte tout — et celui-ci doit cohabiter
  // avec de la donnée qui cite des sources officielles.
  const licites = [
    ['prix conforme', '14 jours, sans engagement'],
    ['imprimante tierce nommée', 'Imprimante Niimbot B21 facultative (~35 € sur Amazon, achat libre).'],
    ['lien correct', 'https://frigolog.fr/?utm_source=claude&utm_medium=mcp'],
    ['UTM de tracking nommant une plateforme', 'https://frigolog.fr/?utm_source=claude&utm_campaign=mcp_directory'],
    ['mot français contenant un nom de techno', 'Une réaction rapide du support, et un réactif de nettoyage adapté.'],
  ];
  for (const [label, texte] of licites) {
    const v = commercialViolations(texte);
    check(`le garde ACCEPTE : ${label}`, v.length === 0, v.join(' | '));
  }
}

// ---- run -------------------------------------------------------------------
(async () => {
  console.log('Frigolog HACCP MCP — test suite');
  testVersionFile();
  testResolver();
  await testUrlLiveness();
  await testLiveContract();
  await testCounts();
  await testNewAutomationTools();
  testCtas();
  testCommercialCopy();

  console.log(`\n${'='.repeat(48)}`);
  console.log(`PASS ${pass}   FAIL ${fail}   SKIP ${skip}`);
  if (fail > 0) {
    console.log('\nFAILURES:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log('All good (no failures).');
  process.exit(0);
})();
