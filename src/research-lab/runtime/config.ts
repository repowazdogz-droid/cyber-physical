/**
 * Runtime configuration: primitive toggles and policy thresholds.
 */

export interface PrimitiveToggle {
  governance: boolean;
  reasoning: boolean;
  traceability: boolean;
}

export interface RuntimeConfig {
  primitives: PrimitiveToggle;
  scaling: {
    param_delta_threshold: number;
    flop_delta_threshold: number;
  };
  claims: {
    min_seeds_for_replication: number;
    max_cv_for_replication: number;
    min_effect_size: number;
  };
  registry_path: string;
}

export const DEFAULT_CONFIG: RuntimeConfig = {
  primitives: { governance: true, reasoning: true, traceability: true },
  scaling: { param_delta_threshold: 0.2, flop_delta_threshold: 0.5 },
  claims: { min_seeds_for_replication: 3, max_cv_for_replication: 0.1, min_effect_size: 0.05 },
  registry_path: "./data/experiments.jsonl",
};
