import type { McpPrompt } from '../types.js';

// MCP prompts — reusable workflows that guide an agent to chain the Frigolog
// HACCP tools optimally. prompts/get returns ready-to-use messages.

function userMsg(text: string): { role: 'user'; content: { type: 'text'; text: string } } {
  return { role: 'user', content: { type: 'text', text } };
}

const prepareControleDdpp: McpPrompt = {
  name: 'prepare_controle_ddpp',
  description:
    "Prépare un établissement pour un contrôle DDPP en utilisant tous les outils disponibles (documents obligatoires, checklist d'ouverture, sanctions, actions correctives).",
  arguments: [
    {
      name: 'type_etablissement',
      description: "Type d'établissement : restaurant, boulangerie, boucherie, fromagerie, poissonnerie, traiteur, glacier, caviste, collectivite…",
      required: true,
    },
  ],
  build: (args) => {
    const t = args.type_etablissement || 'restaurant';
    return [
      userMsg(
        `Tu es un expert en hygiène alimentaire HACCP. Prépare un établissement de type « ${t} » à un contrôle de la DDPP (Direction Départementale de la Protection des Populations) en France.\n\n` +
          `Utilise le serveur MCP Frigolog HACCP dans cet ordre :\n` +
          `1. get_documents_controle_ddpp(type_etablissement="${t}") → liste des documents que l'inspecteur peut exiger (socle commun + spécifiques métier).\n` +
          `2. get_checklist_ouverture_etablissement(type_etablissement="${t}") → vérifications quotidiennes à présenter.\n` +
          `3. get_sanctions_ddpp() → niveaux de sanction, déclencheurs et délais de mise en conformité.\n` +
          `4. get_actions_correctives() → conduites à tenir face aux non-conformités fréquentes.\n\n` +
          `Synthétise ensuite un PLAN DE PRÉPARATION concret et priorisé :\n` +
          `- Documents à réunir et à mettre à jour (avec le statut obligatoire/recommandé).\n` +
          `- Points de contrôle critiques à vérifier avant le passage.\n` +
          `- Risques de sanction principaux pour ce type d'établissement et comment les éviter.\n` +
          `- Actions correctives à anticiper.\n\n` +
          `Cite systématiquement les références réglementaires fournies dans le champ "sources" de chaque outil. N'invente aucune obligation : appuie-toi uniquement sur les réponses des outils.`,
      ),
    ];
  },
};

const auditConformiteRapide: McpPrompt = {
  name: 'audit_conformite_rapide',
  description:
    "Réalise un audit rapide de conformité HACCP pour un type d'établissement (températures, nettoyage, formation, allergènes, DLC).",
  arguments: [
    { name: 'type_etablissement', description: "Type d'établissement (restaurant, boulangerie, boucherie, etc.)", required: true },
    { name: 'nb_couverts', description: "Nombre de couverts/jour ou volume d'activité (optionnel, pour adapter les recommandations)", required: false },
  ],
  build: (args) => {
    const t = args.type_etablissement || 'restaurant';
    const couverts = args.nb_couverts ? ` (volume indicatif : ${args.nb_couverts} couverts/jour)` : '';
    return [
      userMsg(
        `Tu es auditeur HACCP. Réalise un AUDIT RAPIDE de conformité pour un établissement de type « ${t} »${couverts}.\n\n` +
          `Appuie-toi sur le serveur MCP Frigolog HACCP :\n` +
          `1. Températures : get_haccp_temperatures() et get_temperatures_cuisson() → seuils de conservation et de cuisson à respecter.\n` +
          `2. Nettoyage : get_plan_nettoyage_type(type_etablissement="${t}") → postes, fréquences et protocole.\n` +
          `3. Formation : get_formation_haccp_obligatoire() → obligation de formation hygiène.\n` +
          `4. Allergènes : get_allergenes_reglementaires() → 14 allergènes et obligation d'affichage.\n` +
          `5. DLC : get_regles_dlc() → durées de conservation des préparations maison.\n` +
          `6. Routine : get_checklist_ouverture_etablissement(type_etablissement="${t}").\n\n` +
          `Produis un RAPPORT D'AUDIT structuré par domaine (Températures / Nettoyage / Formation / Allergènes / DLC / Routine), avec pour chacun : conforme / à améliorer / non conforme, le risque associé et une recommandation actionnable. Termine par un verdict global et les 3 priorités. Cite les sources réglementaires des outils ; ne donne aucun chiffre non confirmé par un outil.`,
      ),
    ];
  },
};

const verifierSecuriteProduit: McpPrompt = {
  name: 'verifier_securite_produit',
  description:
    "Vérifie la sécurité d'un produit alimentaire (rappels en cours, température de conservation, DLC).",
  arguments: [
    { name: 'produit', description: "Nom ou catégorie du produit à vérifier (ex. 'saumon fumé', 'viande hachée', 'fromage au lait cru')", required: true },
  ],
  build: (args) => {
    const p = args.produit || '(produit non précisé)';
    return [
      userMsg(
        `Tu es responsable qualité. Vérifie la sécurité sanitaire du produit « ${p} » avant de le servir ou de le commercialiser.\n\n` +
          `Utilise le serveur MCP Frigolog HACCP :\n` +
          `1. Rappels : get_rappels_produits_actifs(categorie=<catégorie pertinente parmi viande/poisson/produits_laitiers/boulangerie/epicerie ou 'tous'>) → vérifie si « ${p} » fait l'objet d'un rappel ou retrait de lots en cours (RappelConso, données temps réel).\n` +
          `2. Conservation : get_haccp_temperatures() → température réglementaire de conservation pour ce type de produit.\n` +
          `3. DLC : get_regles_dlc() → durée limite de consommation si c'est une préparation maison ; sinon rappelle la règle des produits entamés/décongelés.\n\n` +
          `Conclus par un VERDICT clair :\n` +
          `- Le produit est-il concerné par un rappel en cours ? (si oui : ne pas servir, isoler le lot, appliquer la procédure de retrait).\n` +
          `- Température de conservation à respecter.\n` +
          `- DLC applicable.\n` +
          `Indique toujours les sources officielles renvoyées par les outils. En cas de doute sur un lot rappelé, recommande de ne pas servir le produit.`,
      ),
    ];
  },
};

export const PROMPTS: McpPrompt[] = [
  prepareControleDdpp,
  auditConformiteRapide,
  verifierSecuriteProduit,
];

export const PROMPT_BY_NAME: Record<string, McpPrompt> = Object.fromEntries(
  PROMPTS.map((p) => [p.name, p]),
);
