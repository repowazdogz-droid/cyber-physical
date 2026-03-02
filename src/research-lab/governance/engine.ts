/**
 * Governance engine: runs all policies and produces a single decision with hash.
 */

import { createHash } from "crypto";
import type { ExperimentProposal } from "../models/proposal";
import type { GovernanceDecision, ViolationCode } from "../models/decision";
import type { GovernanceContext } from "./types";
import { evaluateScaling } from "./policies/scaling";
import { evaluateBaseline } from "./policies/baseline";
import { evaluateDeterminism } from "./policies/determinism";
import type { RuntimeConfig } from "../runtime/config";

export class GovernanceEngine {
  constructor(private config: Pick<RuntimeConfig, "scaling">) {}

  evaluate(
    proposal: ExperimentProposal,
    context: GovernanceContext,
    decided_at: string
  ): GovernanceDecision {
    const scalingResult = evaluateScaling(proposal, this.config.scaling);
    const baselineResult = evaluateBaseline(proposal);
    const determinismResult = evaluateDeterminism(proposal);

    const allViolations: ViolationCode[] = [
      ...scalingResult.violations,
      ...baselineResult.violations,
      ...determinismResult.violations,
    ];
    const allRequirements: string[] = [
      ...scalingResult.requirements,
      ...baselineResult.requirements,
      ...determinismResult.requirements,
    ];

    let outcome: GovernanceDecision["outcome"] = "allow";
    if (allViolations.length > 0) {
      outcome =
        scalingResult.outcome === "block" ||
        baselineResult.outcome === "block" ||
        determinismResult.outcome === "block"
          ? "block"
          : "warn";
    } else if (
      scalingResult.outcome === "warn" ||
      baselineResult.outcome === "warn" ||
      determinismResult.outcome === "warn"
    ) {
      outcome = "warn";
    }

    const canonical =
      proposal.id +
      "\n" +
      outcome +
      "\n" +
      [...allViolations].sort().join(",") +
      "\n" +
      decided_at;
    const decision_hash = createHash("sha256").update(canonical, "utf8").digest("hex");

    return {
      proposal_id: proposal.id,
      outcome,
      violations: allViolations,
      requirements: allRequirements,
      decision_hash,
      decided_at,
    };
  }
}
