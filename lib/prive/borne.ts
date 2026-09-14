// ═══════════════════════════════════════════════════════════════════════
// LA BORNE D'ÉTABLISSEMENT — une ceinture qui ne dépend d'aucune policy
// ═══════════════════════════════════════════════════════════════════════
// Jusqu'ici, l'isolation reposait ENTIÈREMENT sur la RLS de Postgres, bornée
// par le claim du jeton. C'est solide pour un compte client ordinaire. Ça ne
// l'est pas pour tous les comptes :
//
//   `frigolog_terrain_read` accorde à tout établissement `is_test` la vue sur
//   TOUS ses semblables. Elle ne passe pas par le claim. Une clé émise sur un
//   compte de test lisait donc 215 équipements pour un établissement qui en a
//   UN (constaté sur staging le 2026-08-05).
//
// La réponse d'alors : refuser les comptes de test à la porte. Elle protégeait,
// mais elle interdisait du même geste de TESTER le MCP privé — sur nos comptes
// internes, tous marqués `is_test`. Un service qu'on ne peut pas exercer avant
// de le livrer est un service qu'on livre à l'aveugle.
//
// La bonne réponse est ici, pas à la porte : on ne DEMANDE que ses propres
// lignes. Que la policy en autorise davantage devient sans effet — on ne lit
// pas ce qu'on n'a pas demandé.
//
// ⚠️ CETTE FONCTION EST DANS `lire()`, PAS DANS LES OUTILS, et c'est le point.
//    Un filtre recopié dans chaque outil se serait fait oublier au sixième —
//    et un garde oublié quelque part est pire qu'un garde absent : il fait
//    croire qu'on est couvert. `tests/prive.test.mjs` interdit d'ailleurs
//    explicitement aux outils de filtrer eux-mêmes. Ici, un outil ne PEUT pas
//    oublier : il ne choisit pas.
//
// ⚠️ FERME PAR DÉFAUT. Une table absente de cette table de correspondance fait
//    ÉCHOUER la lecture. Le prochain outil qui interrogera une table nouvelle
//    tombera dessus immédiatement, en développement, avec un message qui dit
//    quoi faire — plutôt que de servir en silence les lignes de tout le monde.
type Borne = { colonne: string } | { via: string; colonne: string };

const BORNES: Record<string, Borne> = {
  equipments: { colonne: 'establishment_id' },
  // ⚠️ PROD-08 : `cleaning_logs` se borne par son POSTE, JAMAIS par sa propre
  //    colonne `establishment_id`. Celle-ci n'est posée que si le navigateur la
  //    connaissait au moment de la validation : elle manque sur un quart des
  //    nettoyages du parc. Borner dessus faisait disparaître un nettoyage sur
  //    quatre, et l'outil répondait « voici vos nettoyages » en les cachant.
  //    Un poste, lui, appartient à un seul établissement : la borne passe par
  //    lui, exactement comme le score, le dossier de contrôle et l'assistant
  //    de l'app. Ne « simplifiez » jamais ceci vers establishment_id.
  cleaning_logs: { via: 'cleaning_stations', colonne: 'establishment_id' },
  cleaning_stations: { colonne: 'establishment_id' },
  reception_logs: { colonne: 'establishment_id' },
  // `temperature_logs` ne porte PAS `establishment_id` : il pointe l'enceinte,
  // qui pointe l'établissement. On borne donc sur la ressource embarquée, et
  // le `!inner` est indispensable — sans lui PostgREST fait une jointure
  // externe et laisse passer les lignes dont l'embed ne matche pas.
  temperature_logs: { via: 'equipments', colonne: 'establishment_id' },
};

export function bornerChemin(chemin: string, establishmentId: string): string {
  const table = chemin.split('?')[0].split('/')[0];
  const borne = BORNES[table];
  if (!borne) {
    throw new Error(
      `Lecture refusée : la table « ${table} » n'a pas de borne d'établissement déclarée. `
      + `Ajoutez-la dans BORNES (lib/prive/borne.ts) avant de l'interroger.`,
    );
  }

  if ('via' in borne) {
    // Le filtre porte sur la ressource EMBARQUÉE : sans l'embed dans le select,
    // PostgREST refuserait la requête — ou pire, avec un alias, le filtre
    // viserait un nom qui n'existe pas. On refuse donc tout ce qui n'est pas
    // la forme exacte `via(…)` ou `via!inner(…)`, plutôt que de deviner.
    // On ne cherche QUE dans la valeur de `select=` : un `order=` ou un filtre
    // qui nommerait la ressource ne doit ni passer pour l'embed, ni être réécrit.
    const select = /(^|[?&])select=([^&]*)/.exec(chemin);
    const embed = new RegExp(`(^|,)${borne.via}(!inner)?\\(`);
    if (!select || !embed.test(select[2])) {
      throw new Error(
        `Lecture refusée : « ${table} » se borne par « ${borne.via} », qui doit être embarqué `
        + `sans alias dans le select (ex. ${borne.via}(name)).`,
      );
    }
    // L'embed doit être `!inner`. S'il est écrit sans, on le corrige plutôt que
    // de refuser : l'outil a demandé la bonne donnée, c'est la forme de la
    // jointure qui décide de l'isolation, et elle n'appartient pas à l'outil.
    const selectInner = select[2].replace(
      new RegExp(`(^|,)${borne.via}\\(`, 'g'),
      `$1${borne.via}!inner(`,
    );
    const debutValeur = select.index + select[1].length + 'select='.length;
    const avecInner = chemin.slice(0, debutValeur) + selectInner
      + chemin.slice(debutValeur + select[2].length);
    return `${avecInner}&${borne.via}.${borne.colonne}=eq.${establishmentId}`;
  }
  return `${chemin}&${borne.colonne}=eq.${establishmentId}`;
}
