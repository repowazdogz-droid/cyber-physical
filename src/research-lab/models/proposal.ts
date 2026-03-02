/**
 * Experiment proposal model and validation.
 * Caller-supplied id and created_at for determinism.
 */

export type ProposalType =
  | "architecture"
  | "scaling_study"
  | "ablation"
  | "baseline"
  | "replication";

export interface ExperimentProposal {
  id: string;
  hypothesis: string;
  type: ProposalType;
  baseline_ref: string | null;
  proposed_change: {
    parameter: string;
    from_value: number;
    to_value: number;
  };
  compute_budget: {
    max_params: number;
    max_flops: number;
    max_runtime_sec: number;
  };
  scaling_hypothesis: {
    type: "scaling_study";
    intermediate_points: number[];
    baseline_scale_included: boolean;
  } | null;
  controls: {
    seed_plan: number[];
    dataset_version: string;
    eval_protocol: string;
  };
  ablations: string[];
  created_at: string;
}

function nonEmpty(s: string): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function validateProposal(p: ExperimentProposal): void {
  if (!nonEmpty(p.id)) {
    throw new Error("ExperimentProposal.id must be non-empty");
  }
  if (!Array.isArray(p.controls.seed_plan) || p.controls.seed_plan.length === 0) {
    throw new Error("ExperimentProposal.controls.seed_plan must be non-empty");
  }
  if (!nonEmpty(p.controls.dataset_version)) {
    throw new Error("ExperimentProposal.controls.dataset_version must be non-empty");
  }
  if (!nonEmpty(p.controls.eval_protocol)) {
    throw new Error("ExperimentProposal.controls.eval_protocol must be non-empty");
  }
}

export function createProposal(raw: ExperimentProposal): ExperimentProposal {
  validateProposal(raw);
  return { ...raw };
}
