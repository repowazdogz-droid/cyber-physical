/**
 * Governance decision and violation codes.
 */

export type ViolationCode =
  | "NO_SCALING_HYPOTHESIS"
  | "NO_INTERMEDIATE_POINTS"
  | "NO_BASELINE_SCALE"
  | "MISSING_BASELINE_REF"
  | "INSUFFICIENT_SEEDS"
  | "MISSING_DATASET_VERSION"
  | "MISSING_EVAL_PROTOCOL"
  | "BUDGET_EXCEEDED"
  | "MIN_MAX_JUMP";

export type DecisionOutcome = "allow" | "block" | "warn";

export interface GovernanceDecision {
  proposal_id: string;
  outcome: DecisionOutcome;
  violations: ViolationCode[];
  requirements: string[];
  decision_hash: string;
  decided_at: string;
}
