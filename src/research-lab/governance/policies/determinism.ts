/**
 * Determinism controls: seeds, dataset version, eval protocol.
 */

import type { ExperimentProposal } from "../../models/proposal";
import type { PolicyResult } from "../types";
import type { ViolationCode } from "../../models/decision";

export function evaluateDeterminism(proposal: ExperimentProposal): PolicyResult {
  const violations: ViolationCode[] = [];
  const requirements: string[] = [];

  if (!Array.isArray(proposal.controls.seed_plan) || proposal.controls.seed_plan.length < 3) {
    violations.push("INSUFFICIENT_SEEDS");
  }
  if (typeof proposal.controls.dataset_version !== "string" || proposal.controls.dataset_version.trim() === "") {
    violations.push("MISSING_DATASET_VERSION");
  }
  if (typeof proposal.controls.eval_protocol !== "string" || proposal.controls.eval_protocol.trim() === "") {
    violations.push("MISSING_EVAL_PROTOCOL");
  }

  const outcome = violations.length > 0 ? "block" : "allow";
  return { outcome, violations, requirements };
}
