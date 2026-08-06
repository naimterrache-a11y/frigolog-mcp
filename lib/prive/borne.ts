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
  cleaning_logs: { colonne: 'establishment_id' },
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
      + `Ajoutez-la dans BORNES (lib/prive/contexte.ts) avant de l'interroger.`,
    );
  }

  if ('via' in borne) {
    // L'embed doit être `!inner`. S'il est écrit sans, on le corrige plutôt que
    // de refuser : l'outil a demandé la bonne donnée, c'est la forme de la
    // jointure qui décide de l'isolation, et elle n'appartient pas à l'outil.
    const avecInner = chemin.replace(
      new RegExp(`(^|[?&,])${borne.via}\\(`, 'g'),
      `$1${borne.via}!inner(`,
    );
    return `${avecInner}&${borne.via}.${borne.colonne}=eq.${establishmentId}`;
  }
  return `${chemin}&${borne.colonne}=eq.${establishmentId}`;
}
