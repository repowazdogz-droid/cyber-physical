import type { EngineInput, EngineOutput, ConfidenceBreakdown } from '../src/engine/types.js';

export interface GoldenCase {
  id: string;
  name: string;
  description: string;
  artifact_04_section: string;
  constraints_tested: string[];
  input: EngineInput;
  embeddings: Record<string, number[]>;
}

export interface GoldenExpectation {
  case_id: string;
  convergence_count: number;
  divergence_count: number;
  divergence_natures: ('contradictory' | 'scope_dependent' | 'complementary')[];
  orphan_count: number;
  lens_count_factor: number;
  low_evidence_warning: boolean;
  high_contradiction_warning: boolean;
  confidence_score: { min: number; max: number };
  agreement_factor: { min: number; max: number };
  evidence_density_factor: { min: number; max: number };
  unsupported_penalty: { min: number; max: number };
  divergence_penalty: { min: number; max: number };
  convergence_lenses: { theme_index: number; min_lenses: number }[];
  invalid_claims_excluded: string[];
  orphan_claims_expected: string[];
  drift: {
    expected_null: boolean;
    score_delta?: { min: number; max: number };
    flags?: string[];
  };
  expects_error?: boolean;
  error_contains?: string;
  TODO?: boolean;
}

export interface GoldenResult {
  case_id: string;
  passed: boolean;
  failures: string[];
  duration_ms: number;
}

export interface CalibrationRecommendation {
  parameter: string;
  current_value: number;
  recommended_value: number;
  reason: string;
  confidence: number;
}

export interface EvalReport {
  id: string;
  created_at: string;
  trigger: 'manual' | 'code_change' | 'prompt_change' | 'weight_change' | 'calibration';
  track_a: {
    golden_cases_run: number;
    golden_cases_passed: number;
    golden_cases_failed: string[];
    engine_metrics: Record<string, number>;
    total_duration_ms: number;
  };
  track_b?: {
    stimuli_run: number;
    runs_per_stimulus: number;
    extraction_metrics: {
      per_lens: Record<string, Record<string, number>>;
      aggregate: Record<string, number>;
    };
    semantic_metrics?: Record<string, number>;
    system_metrics: Record<string, number>;
  };
  calibration?: {
    recommendations: CalibrationRecommendation[];
    applied: boolean;
  };
  regression_verdict: 'pass' | 'fail' | 'warn';
  regression_failures: string[];
}

export interface StochasticBaseline {
  created_at: string;
  stimulus_count: number;
  runs_per_stimulus: number;
  metrics: {
    per_lens: Record<string, Record<string, number>>;
    aggregate: Record<string, number>;
    system: Record<string, number>;
  };
}

export interface SimilarityCalibrationInput {
  pairs: {
    claim_a_id: string;
    claim_b_id: string;
    cosine_similarity: number;
    human_label: 'same' | 'different';
  }[];
}

export interface SimilarityCalibrationOutput {
  optimal_sim_match: number;
  optimal_sim_reject: number;
  borderline_range: [number, number];
  f1_at_optimal: number;
  precision_at_optimal: number;
  recall_at_optimal: number;
  distribution_plot_data: {
    same_pairs: number[];
    different_pairs: number[];
  };
}

export interface WeightCalibrationInput {
  analyses: {
    analysis_id: string;
    agreement_factor: number;
    evidence_density_factor: number;
    unsupported_penalty: number;
    divergence_penalty: number;
    lens_count_factor: number;
    human_quality_rating: number;
  }[];
}

export interface WeightCalibrationOutput {
  current_weights: { W_a: number; W_e: number; W_u: number; W_d: number };
  recommended_weights: { W_a: number; W_e: number; W_u: number; W_d: number };
  current_correlation: number;
  recommended_correlation: number;
  score_distribution: {
    current: { min: number; max: number; mean: number; std: number };
    recommended: { min: number; max: number; mean: number; std: number };
  };
  band_coverage: { current: number; recommended: number };
}

export interface DistributionInput {
  scores: number[];
  human_ratings?: number[];
  band_boundaries: [number, number, number];
}

export interface DistributionOutput {
  n: number;
  min: number;
  max: number;
  mean: number;
  std: number;
  skew: number;
  range: number;
  band_counts: { low: number; moderate: number; high: number; very_high: number };
  band_entropy: number;
  ceiling_gap: number;
  floor_gap: number;
  rank_correlation?: number;
  recommendation: 'acceptable' | 'narrow_range' | 'clustered' | 'ceiling_hit';
  details: string;
}
