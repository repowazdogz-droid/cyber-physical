import type { EngineOutput } from '../engine/types.js';
import type { ExtractedClaim } from '../extraction/types.js';

export interface CreateAnalysisRequest {
  stimulus: {
    id?: string;
    text: string;
    type: 'question' | 'decision' | 'scenario' | 'assessment_request';
  };
  context?: {
    documents?: Array<{
      doc_id: string;
      title?: string;
      source: 'user_upload' | 'url' | 'internal';
      url?: string;
      excerpt?: string;
      created_at?: string;
    }>;
  };
  options?: {
    dry_run?: boolean;
    lenses?: string[];
    max_claims_per_lens?: number;
    save?: boolean;
  };
}

export interface LensResult {
  lens: string;
  status: 'ok' | 'error';
  error?: { code: string; message: string };
  raw_text?: string;
  parsed?: any;
  claim_ids: string[];
  duration_ms: number;
}

export interface ClaimWithProvenance {
  claim_id: string;
  lens: string;
  text: string;
  about_entity?: string | null;
  polarity?: 'positive' | 'negative' | 'neutral';
  category?: string;
  evidence_basis?: any;
  provenance: {
    lens_raw_ref: string;
    extraction_confidence?: number;
  };
}

export interface CreateAnalysisResponse {
  analysis_id: string;
  created_at: string;
  inputs: CreateAnalysisRequest;
  run_metadata: {
    duration_ms: number;
    models: {
      lens_llm: string;
      embedder: string;
    };
    engine_config_snapshot: any;
  };
  lens_results: LensResult[];
  claims: ClaimWithProvenance[];
  evidence: {
    items: any[];
    links: any[];
  };
  engine_output?: EngineOutput;
  warnings: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
