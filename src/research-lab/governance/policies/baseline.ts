/**
 * Baseline enforcement: non-baseline proposals must reference a baseline.
 */

import type { ExperimentProposal } from "../../models/proposal";
import type { PolicyResult } from "../types";

export function evaluateBaseline(proposal: ExperimentProposal): PolicyResult {
  const violations: import("../../models/decision").ViolationCode[] = [];
  const requirements: string[] = [];

  if (proposal.type !== "baseline" && (proposal.baseline_ref == null || proposal.baseline_ref.trim() === "")) {
    violations.push("MISSING_BASELINE_REF");
    return { outcome: "block", violations, requirements };
  }

  return { outcome: "allow", violations, requirements };
}
