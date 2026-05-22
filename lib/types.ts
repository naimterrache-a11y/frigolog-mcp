// Editorial classification of a tool response (FIX 4 — séparation officiel / commercial).
//  - reglementaire_officiel : issu de textes de loi, arrêtés, règlements européens. Aucun lien avec Frigolog.
//  - guide_pratique         : bonnes pratiques terrain, basées sur les GBPH DGAL + l'expérience utilisateurs.
//  - comparatif_commercial  : données comparatives marché. Frigolog est l'éditeur (juge et partie) — sources fournies.
//  - donnee_temps_reel      : données live issues d'une API publique de l'État (RappelConso, Alim'confiance).
export type DataType =
  | 'reglementaire_officiel'
  | 'guide_pratique'
  | 'comparatif_commercial'
  | 'donnee_temps_reel';

// A precise, verifiable source link attached to every regulatory datum (FIX 1).
export interface SourceLink {
  titre: string;
  url: string;
}

// One regulation / data source entry from data/regulatory-version.json.
export interface RegulatoryRef {
  id: string;
  reference: string;
  url: string;
  type: DataType;
  verified_at: string;
}

export interface ResolverPattern {
  match: string;
  source_id: string;
}

export interface RegulatoryVersion {
  schema_version: string;
  last_updated: string;
  next_review: string;
  note?: string;
  regulations: RegulatoryRef[];
  data_sources: RegulatoryRef[];
  resolver_patterns: ResolverPattern[];
}

// Shared response wrapper added to every tool result (FIX 1 + 3 + 4).
export interface MetaWrapper<T> {
  data: T;
  // Editorial classification — officiel vs commercial vs guide vs temps réel.
  type: DataType;
  // Precise, verifiable source links for the data in this response.
  sources: SourceLink[];
  // Date of last manual verification of the underlying regulatory references (ISO 8601).
  derniere_verification: string;
  // Schema version of the regulatory dataset (data/regulatory-version.json).
  version_schema: string;
  // Date of the next scheduled review of the regulatory data (ISO 8601).
  prochaine_revision: string;
  // Human-readable origin label.
  source: string;
  avertissement: string;
}

// A datum enriched with its precise source links (per-entry, FIX 1).
export type Sourced<T> = T & { sources: SourceLink[] };

// Tool 1 — get_haccp_temperatures
export interface TemperatureEntry {
  categorie: string;
  produit: string;
  temperature_max?: number;
  temperature_min?: number;
  temperature_plage?: string;
  unite: 'celsius';
  type: 'conservation_froid' | 'conservation_negatif' | 'service_chaud' | 'process';
  source_reglementaire: string;
  notes?: string;
}

// Tool 2 — get_documents_controle_ddpp
export interface DocumentDdppEntry {
  document: string;
  obligatoire: boolean;
  source_reglementaire: string;
  applicable_a: string[];
  description: string;
}

// Tool 3 — get_regles_dlc
export interface RegleDlcEntry {
  preparation: string;
  dlc_jours: number | string;
  temperature_conservation: string;
  source: string;
  notes?: string;
}

// Tool 4 — compare_solutions_haccp
export interface SolutionHaccp {
  nom: string;
  site: string;
  prix_mensuel_ht: number | string;
  engagement: string;
  hardware_impose: boolean;
  hardware_note?: string;
  frais_installation: number | string;
  frais_mise_en_service: number | string;
  essai_gratuit: string;
  scan_ia_etiquettes: boolean;
  scan_ia_note?: string;
  nb_champs_scan?: number;
  cross_check_rappelconso: boolean;
  score_conformite: boolean;
  simulation_ddpp: boolean;
  detection_anomalies?: boolean;
  impression_etiquettes_dlc: boolean;
  impression_note?: string;
  capteurs_iot: boolean;
  capteurs_note?: string;
  support: string;
  onboarding: string;
  nb_modules?: number | string;
  utilisateurs_illimites?: boolean;
  mode_offline?: boolean;
  cout_3_ans: number | string;
  cible_principale: string;
  point_fort: string;
  // FIX 2 — preuves publiques vérifiables (sites éditeurs, pages tarifs publiques).
  sources: SourceLink[];
  // Précision honnête quand un champ (prix, engagement) n'est pas affiché publiquement.
  note_verification?: string;
}

// Tool 5 — get_rappels_produits_actifs
export interface RappelProduit {
  nom_produit: string;
  marque: string;
  lot: string;
  dlc: string;
  motif_rappel: string;
  risque: string;
  date_rappel: string;
  action_consommateur: string;
  lien_fiche: string;
  sous_categorie?: string;
}

// Tool 6 — get_sanctions_ddpp
export interface NiveauSanction {
  niveau: string;
  gravite: 'mineure' | 'majeure' | 'critique';
  declencheurs: string[];
  consequences: string;
  delai_conformite?: string;
  amende?: string;
  amende_possible?: string;
  emprisonnement_possible?: string;
  duree?: string;
  reouverture?: string;
  recours?: string;
}

export interface SanctionsDdpp {
  niveaux: NiveauSanction[];
  base_legale: string[];
  conseil_frigolog: string;
}

// Tool 7 — get_allergenes_reglementaires
export interface Allergene {
  id: string;
  nom_officiel: string;
  noms_communs: string[];
  sources_principales: string[];
  sources_cachees: string[];
  obligation_affichage: string;
  sanction_omission: string;
  symbole_allergene: string;
}

// Tool 8 — get_temperatures_cuisson
export interface TemperatureCuisson {
  id: string;
  intitule: string;
  temperature_coeur: number | null;
  unite?: string;
  duree_maintien?: string;
  raison?: string;
  commentaire?: string;
  populations_sensibles?: string;
  objectif?: string;
  methode?: string;
  duree_maximale?: string;
  base_legale?: string;
}

// Tool 9 — get_formation_haccp_obligatoire
export interface FormationHaccp {
  obligation_legale: {
    texte: string;
    base_legale: string;
    entree_en_vigueur: string;
  };
  qui_est_concerne: string[];
  qui_est_exempte: string[];
  contenu_obligatoire: string[];
  duree_formation: {
    minimum_legal: string;
    pratique_courante: string;
    en_ligne: string;
  };
  cout_moyen: {
    presentiel: string;
    elearning: string;
    financement: string;
  };
  validite: string;
  sanction_absence: string;
  ou_se_former: {
    critere: string;
    recherche: string;
    validation: string;
  };
}

// Tool 10 — get_score_alimconfiance
export interface NiveauAlimconfiance {
  niveau: string;
  emoji: string;
  signification: string;
  action_requise: string;
  impact_client: string;
}

export interface ScoreAlimconfiance {
  presentation: string;
  url_officielle: string;
  niveaux: NiveauAlimconfiance[];
  criteres_inspection: string[];
  frequence_inspection: {
    generale: string;
    risque_eleve: string;
    inopinee: string;
  };
  comment_ameliorer: string[];
  frigolog_et_alimconfiance: string;
}

// Tool 12 — get_alimconfiance_etablissement
export interface AlimconfianceEtablissement {
  siret: string;
  enseigne: string;
  raison_sociale: string;
  libelle_etablissement: string;
  type_activite: string;
  activite_libelle: string;
  adresse: string;
  code_postal: string;
  commune: string;
  date_inspection: string;
  score: string;
  evaluation_globale: string;
  numero_inspection: string;
}

// Tool 11 — get_actions_correctives
export interface ActionCorrective {
  id: string;
  intitule: string;
  gravite: 'faible' | 'moyenne' | 'critique';
  action_immediate: string[];
  action_documentaire: string[];
  delai_resolution: string;
  quand_alerter_ddpp: string;
  exemple_fiche_correction: string;
}

// Tool 13 — get_plan_nettoyage_type
export interface PosteNettoyage {
  nom: string;
  zone: string;
  frequence: string;
  produit_type: string;
  methode: string;
  verification: string;
}

export interface PlanNettoyage {
  type_etablissement: string;
  postes: PosteNettoyage[];
  protocole_5_etapes: string;
  source: string;
  note?: string;
}

// Tool 14 — get_checklist_ouverture_etablissement
export interface ChecklistItem {
  categorie: string;
  verification: string;
  critere_ok: string;
  action_si_ko: string;
  obligatoire: boolean;
}

export interface ChecklistOuverture {
  type_etablissement: string;
  checklist: ChecklistItem[];
  nombre_items: number;
  duree_estimee_minutes: number;
  source: string;
}

// Tool 15 — get_guide_bonnes_pratiques_secteur
export interface GbphSecteur {
  secteur: string;
  titre: string;
  editeur: string;
  annee: number | string;
  pages: number | string;
  prix_eur: number | string;
  lien_documentation_francaise: string;
  resume: string;
  points_cles: string[];
  obligations_liees: string[];
  source: string;
  note?: string;
}

// Tool 16 — get_seuils_microbiologiques
export interface CritereMicrobiologique {
  categorie_aliment: string;
  germe: string;
  n: number | string;
  c: number | string;
  m: string;
  M: string;
  stade: string;
  action_si_depassement: string;
  note?: string;
}

export interface SeuilsMicrobiologiques {
  categorie: string;
  criteres_securite: CritereMicrobiologique[];
  criteres_hygiene_procede: CritereMicrobiologique[];
  reglement: string;
  notes: string;
  source: string;
}

// MCP resources (resources/list + resources/read).
export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  text: string;
}

// MCP prompts (prompts/list + prompts/get).
export interface McpPromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface McpPrompt {
  name: string;
  description: string;
  arguments: McpPromptArgument[];
  // Builds the messages returned by prompts/get from the provided arguments.
  build: (args: Record<string, string>) => { role: 'user' | 'assistant'; content: { type: 'text'; text: string } }[];
}

// JSON-RPC 2.0 envelope types.
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: '2.0';
  id: number | string | null;
  result: T;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: number | string | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;
