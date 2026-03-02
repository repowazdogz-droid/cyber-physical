/**
 * Policy result types and violation codes for governance.
 */

import type { ViolationCode, DecisionOutcome } from "../models/decision";

export type { ViolationCode, DecisionOutcome };

export interface PolicyResult {
  outcome: DecisionOutcome;
  violations: ViolationCode[];
  requirements: string[];
}

export interface GovernanceContext {
  baseline_metrics?: {
    params: number;
    flops: number;
    loss: number;
  };
  budget_ceiling?: {
    max_params: number;
    max_flops: number;
    max_runtime_sec: number;
  };
}
