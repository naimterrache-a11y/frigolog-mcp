// Le lien d'un établissement : inscription pré-remplie, et seulement quand la
// recherche désigne UN établissement.
//   node tests/lien-etablissement.test.mjs
import assert from 'node:assert/strict';
import { ctaLienEtablissement, ctaFor } from '../lib/data/cta.ts';

let passed = 0;
const ok = (label, fn) => { fn(); passed++; console.log('  ok', label); };
const OUTIL = 'get_alimconfiance_etablissement';
const E = (siret, enseigne = 'LE SOLEIL D\'OR') => ({ siret, enseigne, libelle_etablissement: '', raison_sociale: 'SARL SOLEIL' });

ok('un établissement : inscription pré-remplie, SIRET et nom, campagne tracée', () => {
  const u = new URL(ctaLienEtablissement(OUTIL, [E('85273419800012')], 1));
  assert.equal(u.origin + u.pathname, 'https://app.frigolog.fr/onboarding');
  assert.equal(u.searchParams.get('siret'), '85273419800012');
  assert.equal(u.searchParams.get('etablissement'), "LE SOLEIL D'OR");
  assert.equal(u.searchParams.get('utm_source'), 'mcp');
  assert.equal(u.searchParams.get('utm_campaign'), OUTIL);
  assert.equal(u.searchParams.get('utm_content'), 'fiche_etablissement');
});
ok('plusieurs inspections du même SIRET : toujours un seul établissement', () => {
  assert.ok(ctaLienEtablissement(OUTIL, [E('85273419800012'), E('85273419800012')], 2));
});
ok('homonymes (plusieurs SIRET) : pas de lien pré-rempli, jamais au nom d\'un autre', () => {
  assert.equal(ctaLienEtablissement(OUTIL, [E('85273419800012'), E('12345678900011')], 2), undefined);
});
ok('aucun résultat, SIRET vide ou mal formé : pas de lien pré-rempli', () => {
  assert.equal(ctaLienEtablissement(OUTIL, [], 0), undefined);
  assert.equal(ctaLienEtablissement(OUTIL, undefined, undefined), undefined);
  assert.equal(ctaLienEtablissement(OUTIL, [E('')], 1), undefined);
  assert.equal(ctaLienEtablissement(OUTIL, [E('8527341980')], 1), undefined);
});
ok('recherche tronquée (total > fiches lues) : lien générique, un homonyme peut suivre', () => {
  assert.equal(ctaLienEtablissement(OUTIL, [E('85273419800012')], 2), undefined);
  assert.equal(ctaLienEtablissement(OUTIL, Array.from({ length: 5 }, () => E('85273419800012')), 6), undefined);
  assert.equal(ctaLienEtablissement(OUTIL, [E('85273419800012')], undefined), undefined);
});
ok('sans enseigne, le nom se replie sur le libellé puis la raison sociale', () => {
  const u = new URL(ctaLienEtablissement(OUTIL, [{ siret: '85273419800012', enseigne: '', libelle_etablissement: '', raison_sociale: 'SARL SOLEIL' }], 1));
  assert.equal(u.searchParams.get('etablissement'), 'SARL SOLEIL');
});
ok('les autres outils gardent le lien générique', () => {
  assert.equal(ctaLienEtablissement('get_haccp_temperatures', [E('85273419800012')], 1), undefined);
  assert.match(ctaFor(OUTIL).lien, /^https:\/\/frigolog\.fr\/\?utm_source=mcp/);
});

console.log(`\nlien-etablissement : ${passed} ok`);
