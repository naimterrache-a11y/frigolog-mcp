// ═══════════════════════════════════════════════════════════════════════
// Crochet de résolution : `./x.js` → `./x.ts` quand le .js n'existe pas
// ═══════════════════════════════════════════════════════════════════════
// Le code de ce dépôt importe ses modules locaux avec l'extension `.js`
// (`import … from './cles.js'`). C'est OBLIGATOIRE : le runtime Vercel exécute
// le résultat compilé en ESM natif, où l'extension doit être celle du fichier
// livré. Mais Node, quand il retire les types à la volée, prend cette extension
// au mot et cherche un `.js` qui n'existe pas sur le disque.
//
// Conséquence, jusqu'ici : ce dépôt ne pouvait tester QUE son source, en le
// lisant comme du texte. Un garde peut vérifier qu'une ligne est présente ; il
// ne peut pas vérifier qu'elle fait ce qu'elle prétend. Toute la leçon de la
// Phase 3 tient là-dedans — un test qui relit du code n'est pas un test.
//
// Ce crochet ne fait qu'une chose, et seulement en dernier recours : si une
// spécification en `.js` échoue à résoudre, il retente en `.ts`. Rien d'autre
// n'est modifié, et le code de production ne le voit jamais.
//
//   node --import ./tests/resolveur-ts.mjs mon-script.mjs

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (e) {
    // Uniquement le cas visé : un module local en .js introuvable.
    if (!specifier.endsWith('.js') || !specifier.startsWith('.')) throw e;
    return await nextResolve(specifier.slice(0, -3) + '.ts', context);
  }
}
`), pathToFileURL('./'));
