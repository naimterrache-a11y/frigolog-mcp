// Shared response wrapper added to every tool result.
export interface MetaWrapper<T> {
  data: T;
  source: string;
  derniere_mise_a_jour: string;
  avertissement: string;
}

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
