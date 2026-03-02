/**
 * Scaling governor policy: param/flop deltas and scaling hypothesis requirements.
 */

import type { ExperimentProposal } from "../../models/proposal";
import type { PolicyResult } from "../types";
import type { ViolationCode } from "../../models/decision";

export interface ScalingPolicyConfig {
  param_delta_threshold: number;
  flop_delta_threshold: number;
}

const DEFAULT: ScalingPolicyConfig = {
  param_delta_threshold: 0.2,
  flop_delta_threshold: 0.5,
};

export function evaluateScaling(
  proposal: ExperimentProposal,
  config: Partial<ScalingPolicyConfig> = {}
): PolicyResult {
  const c = { ...DEFAULT, ...config };
  const violations: ViolationCode[] = [];
  const requirements: string[] = [];

  const { from_value, to_value } = proposal.proposed_change;
  const paramDelta = from_value > 0 ? (to_value - from_value) / from_value : 0;
  const flopDelta = from_value > 0 ? (to_value * to_value - from_value * from_value) / (from_value * from_value) : 0;

  const paramTrigger = paramDelta > c.param_delta_threshold;
  const flopTrigger = flopDelta > c.flop_delta_threshold;

  if ((paramTrigger || flopTrigger) && !proposal.scaling_hypothesis) {
    violations.push("NO_SCALING_HYPOTHESIS");
    return { outcome: "block", violations, requirements };
  }

  if (proposal.scaling_hypothesis && proposal.scaling_hypothesis.type === "scaling_study") {
    if (!proposal.scaling_hypothesis.baseline_scale_included) {
      violations.push("NO_BASELINE_SCALE");
      return { outcome: "block", violations, requirements };
    }
    if (!Array.isArray(proposal.scaling_hypothesis.intermediate_points) ||
        proposal.scaling_hypothesis.intermediate_points.length < 1) {
      violations.push("NO_INTERMEDIATE_POINTS");
      return { outcome: "block", violations, requirements };
    }
    const pts = proposal.scaling_hypothesis.intermediate_points;
    const minP = Math.min(from_value, to_value);
    const maxP = Math.max(from_value, to_value);
    const hasIntermediate = pts.some((p) => p > minP && p < maxP);
    if (!hasIntermediate && from_value !== to_value) {
      violations.push("MIN_MAX_JUMP");
      return { outcome: "block", violations, requirements };
    }
  }

  if (proposal.scaling_hypothesis && proposal.type !== "scaling_study") {
    requirements.push("Justification and ablation at original scale required");
    return { outcome: "warn", violations, requirements };
  }

  return { outcome: "allow", violations, requirements };
}
