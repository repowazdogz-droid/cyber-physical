import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const EVAL_CONFIG = {
  // Track A
  golden_case_dir: resolve(__dirname, 'golden/cases'),
  expectation_dir: resolve(__dirname, 'golden/expectations'),

  // Track B
  stochastic_runs_per_stimulus: 5,
  stochastic_stimuli_dir: resolve(__dirname, 'stochastic/stimuli'),
  stochastic_baseline_dir: resolve(__dirname, 'stochastic/baseline'),

  // Calibration
  similarity_sample_size: 200,
  weight_search_grid: {
    W_a: [0.35, 0.40, 0.45, 0.50, 0.55],
    W_e: [0.20, 0.25, 0.30, 0.35],
    W_u: [0.10, 0.15, 0.20],
    W_d: [0.10, 0.15, 0.20],
  },
  penalty_dominance_floor: 0.25,  // W_u + W_d must be >= this

  // Regression thresholds
  regression_tolerance: {
    structural: {
      convergence_count: 0,
      divergence_count: 0,
      divergence_natures: 'exact' as const,
      orphan_count: 0,
      lens_count_factor: 0,
      low_evidence_warning: 'exact' as const,
      high_contradiction_warning: 'exact' as const,
    },
    numeric: {
      confidence_score: 0.05,
      agreement_factor: 0.05,
      evidence_density_factor: 0.05,
      unsupported_penalty: 0.05,
      divergence_penalty: 0.05,
    },
  },

  // Stochastic regression thresholds
  stochastic_regression: {
    lens_parse_rate_floor: 0.85,
    claim_validity_rate_floor: 0.75,
    entity_extraction_rate_floor: 0.70,
    polarity_coverage_floor: 0.80,
  },

  // Reports
  reports_dir: resolve(__dirname, 'reports'),
} as const;
