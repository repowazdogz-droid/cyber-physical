import type { ExtractedClaim } from '../extraction/types.js';

export interface EngineInput {
  analysis_id: string;
  case_id: string;
  stimulus: {
    text: string;
    type: 'question' | 'decision' | 'scenario' | 'assessment_request';
  };
  context_snapshot: { id: string; label: string; content_text: string }[];
  perspectives: {
    id: string;
    lens_id: string;
    lens_name: string;
    lens_orientation: 'convergent' | 'divergent' | 'orthogonal';
    lens_version: number;
    state: 'completed' | 'failed';
  }[];
  claims: ExtractedClaim[];
  evidence_items: EvidenceItem[];
  claim_evidence_links: ClaimEvidenceLink[];
  prior_syntheses: PriorSynthesis[];
}

export interface EvidenceItem {
  id: string;
  claim_id: string;  // for convenience, though also in links
  content_text: string;
  source_type: 'stimulus_quote' | 'context_excerpt' | 'numeric_data' | 'external_citation' | 'lens_inference' | 'stimulus_derived';
  as_of: string;
  possibly_stale: boolean;
}

export interface ClaimEvidenceLink {
  claim_id: string;
  evidence_item_id: string;
  support_type: 'supports' | 'undermines' | 'contextualizes';
}

export interface PriorSynthesis {
  analysis_id: string;
  confidence_score: number;
  confidence_breakdown: ConfidenceBreakdown;
  convergence_points: ConvergencePoint[];
  divergence_points: DivergencePoint[];
  orphan_claims: string[];
  computed_at: string;
}

export interface ConvergencePoint {
  theme_id: string;
  theme_label: string;
  supporting_lenses: string[];
  supporting_claims: string[];
  strength: number;
  evidence_density: number;
}

export interface DivergencePoint {
  theme_id: string;
  theme_label: string;
  positions: {
    lens_id: string;
    claim_ids: string[];
    position_summary: string;
  }[];
  nature: 'contradictory' | 'complementary' | 'scope_dependent';
  severity: number;
}

export interface ConfidenceBreakdown {
  agreement_factor: number;
  evidence_density_factor: number;
  unsupported_penalty: number;
  divergence_penalty: number;
  lens_count_factor: number;
  raw_score: number;
  final_score: number;
  drift_flags: string[];
  low_evidence_warning: boolean;
  high_contradiction_warning: boolean;
  per_lens: {
    lens_id: string;
    claim_count: number;
    scoring_claim_count: number;
    supported_claim_count: number;
    mean_evidence_strength: number;
    contribution_to_agreement: number;
  }[];
  per_theme: {
    theme_id: string;
    agreement_type: 'convergence' | 'divergence';
    participating_lenses: number;
    strength: number;
  }[];
}

export interface ClaimAnnotation {
  claim_id: string;
  about_entity_canonical: string;
  validity: 'strict' | 'repaired' | 'invalid';
  polarity: 'positive' | 'negative' | 'neutral';
  scoring_eligible: boolean;
  evidence_density: number;
  expires_at: string | null;
  stale_unsupported: boolean;
}

export interface DriftReport {
  case_id: string;
  current_analysis_id: string;
  previous_analysis_id: string;
  score_delta: number;
  component_deltas: {
    agreement_factor: number;
    evidence_density_factor: number;
    unsupported_penalty: number;
    divergence_penalty: number;
  };
  new_convergence_themes: string[];
  lost_convergence_themes: string[];
  new_divergence_themes: string[];
  resolved_divergence_themes: string[];
  claim_stability: number;
  drift_flags: string[];
}

export interface EngineOutput {
  synthesis: {
    convergence_points: ConvergencePoint[];
    divergence_points: DivergencePoint[];
    orphan_claims: string[];
    confidence_score: number;
    confidence_breakdown: ConfidenceBreakdown;
    confidence_rationale: string;
    computed_at: string;
  };
  claim_annotations: ClaimAnnotation[];
  drift: DriftReport | null;
}

export class EngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}
