#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Export de la base de connaissance pour le GPT public
// ═══════════════════════════════════════════════════════════════════════
//   node scripts/export-connaissance-gpt.mjs
//   node scripts/export-connaissance-gpt.mjs --url http://localhost:3000/api/mcp
//
// Produit `public/connaissance-haccp-france.json`, le fichier à téléverser dans
// le champ « Knowledge » du GPT.
//
// ── Pourquoi passer par l'endpoint et pas par lib/data/ ────────────────
// Parce que ce qui compte n'est pas ce que le dépôt contient, c'est ce que le
// serveur RÉPOND. Lire les modules TypeScript donnerait une base de
// connaissance qui pourrait diverger des réponses réelles sans que personne ne
// le voie — deux vérités pour une même question, servies à deux publics
// différents. Ici, si l'endpoint change, cet export change avec lui.
//
// ── Ce qui est délibérément EXCLU ──────────────────────────────────────
// Un GPT lit un fichier figé. Trois familles n'ont donc rien à y faire :
//
//   • les données VIVANTES — rappels produits (RappelConso), fiches
//     Alim'confiance, calendrier d'obligations, risque d'inspection. Un
//     instantané de rappels produits ment dans la semaine, et il ment avec
//     l'autorité d'une source officielle : c'est pire que de ne rien dire.
//     Ces questions doivent renvoyer vers le service en ligne, pas vers le
//     fichier.
//
//   • le comparatif de solutions concurrentes. Il porte des allégations dont
//     le statut de preuve est documenté ailleurs et se relit à chaque
//     évolution du marché. Une copie figée dans un GPT, c'est une allégation
//     qui continue de circuler sans sa relecture.
//
//   • `conseil_pratique` et `lien` — le message commercial que chaque réponse
//     du serveur porte. Le GPT a ses propres consignes sur quand et comment
//     mentionner Frigolog ; dupliquer la phrase dans chaque bloc de
//     connaissance ferait un assistant qui se cite lui-même à chaque
//     paragraphe.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const argUrl = process.argv.indexOf('--url');
const URL_MCP = argUrl > -1 ? process.argv[argUrl + 1] : 'https://frigolog.fr/api/mcp';

const VIVANT_OU_SENSIBLE = new Set([
  'get_rappels_produits_actifs',
  'get_rappels_par_categorie_etablissement',
  'get_alimconfiance_etablissement',
  'get_score_alimconfiance',
  'get_risque_inspection',
  'get_calendrier_obligations',
  'compare_solutions_haccp',
]);

// Les seuls outils à paramètre obligatoire qu'on garde : on les déplie sur
// toutes leurs valeurs plutôt que de les perdre.
const SECTEURS = [
  'restauration', 'boulangerie', 'boucherie', 'charcuterie', 'fromagerie',
  'poissonnerie', 'traiteur', 'glacier', 'restauration_collective',
];

let idRpc = 0;
async function rpc(method, params) {
  const reponse = await fetch(URL_MCP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++idRpc, method, ...(params ? { params } : {}) }),
  });
  if (!reponse.ok) throw new Error(`${method} → HTTP ${reponse.status}`);
  const json = await reponse.json();
  if (json.error) throw new Error(`${method} → ${json.error.message}`);
  return json.result;
}

async function appeler(nom, args = {}) {
  const r = await rpc('tools/call', { name: nom, arguments: args });
  const texte = r?.content?.[0]?.text;
  if (!texte) throw new Error(`${nom} n'a rien renvoyé`);
  const objet = JSON.parse(texte);
  delete objet.conseil_pratique;
  delete objet.lien;
  return objet;
}

const { tools } = await rpc('tools/list');
console.log(`${tools.length} outils exposés par ${URL_MCP}`);

const blocs = [];
for (const outil of tools) {
  if (VIVANT_OU_SENSIBLE.has(outil.name)) {
    console.log(`  · ${outil.name} — exclu (donnée vivante ou allégation relue ailleurs)`);
    continue;
  }
  if (outil.name === 'get_guide_bonnes_pratiques_secteur') {
    const parSecteur = {};
    for (const s of SECTEURS) parSecteur[s] = await appeler(outil.name, { secteur: s });
    blocs.push({ outil: outil.name, description: outil.description, contenu: parSecteur });
    console.log(`  ✓ ${outil.name} — ${SECTEURS.length} secteurs`);
    continue;
  }
  const contenu = await appeler(outil.name);
  blocs.push({ outil: outil.name, description: outil.description, contenu });
  console.log(`  ✓ ${outil.name}`);
}

// La date vient d'`argv` si fournie, sinon d'aujourd'hui. Elle est écrite en
// clair dans le fichier parce qu'un GPT ne sait pas quand sa connaissance a été
// figée — et que « je ne sais pas de quand date ceci » est la première chose
// qu'un assistant réglementaire doit pouvoir dire.
const argDate = process.argv.indexOf('--date');
const genereLe = argDate > -1 ? process.argv[argDate + 1] : new Date().toISOString().slice(0, 10);

const sortie = {
  _a_propos:
    "Base de connaissance HACCP France — export des outils publics du serveur MCP Frigolog. "
    + "Chaque bloc porte ses sources officielles et sa date de vérification. "
    + "Ne contient AUCUNE donnée vivante : les rappels produits et les fiches d'inspection "
    + "changent tous les jours et doivent être demandés en ligne, jamais lus ici.",
  _genere_le: genereLe,
  _source: URL_MCP,
  _outils: blocs,
};

const chemin = join(RACINE, 'public', 'connaissance-haccp-france.json');
writeFileSync(chemin, JSON.stringify(sortie, null, 1), 'utf8');
console.log(`\n${blocs.length} blocs → public/connaissance-haccp-france.json`);
