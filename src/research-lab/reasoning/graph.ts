/**
 * Reasoning graph: wraps Clearpath TraceBuilder for governance evaluation traces.
 * Builds exactly 5 nodes: OBSERVE → DERIVE → ASSUME → DECIDE → ACT.
 * When reasoning toggle is OFF, callers skip this and do not build a trace.
 */

import { createTrace, verifyTrace } from "../trace/bridge";
import type { ExperimentProposal } from "../models/proposal";
import type { GovernanceDecision } from "../models/decision";
import type { GovernanceContext } from "../governance/types";
import type { TraceBuilder } from "../../../clearpath/src/core/trace";

export interface ReasoningInput {
  proposal: ExperimentProposal;
  decision: GovernanceDecision;
  context: GovernanceContext;
  /** Record hash after append (for ACT node content). Set by caller after registry append. */
  record_hash?: string;
}

/**
 * Build a 5-node Clearpath trace for one governance evaluation.
 * Uses Clearpath's createTrace (timestamps/IDs from Clearpath).
 * Verifies trace before returning; throws if verification fails.
 */
export function buildGovernanceTrace(input: ReasoningInput): TraceBuilder {
  const { proposal, decision, context } = input;
  const trace = createTrace({
    agentId: "research-lab-governance",
    context: "experiment-proposal-evaluation",
  });

  const paramDelta =
    proposal.proposed_change.from_value > 0
      ? (proposal.proposed_change.to_value - proposal.proposed_change.from_value) /
        proposal.proposed_change.from_value
      : 0;
  const flopDelta =
    proposal.proposed_change.from_value > 0
      ? (proposal.proposed_change.to_value ** 2 - proposal.proposed_change.from_value ** 2) /
        proposal.proposed_change.from_value ** 2
      : 0;
  const deltaPct = (paramDelta * 100).toFixed(2);
  const flopPct = (flopDelta * 100).toFixed(2);

  const n1 = trace.observe(
    `Proposal ${proposal.id}: ${proposal.proposed_change.parameter} ${proposal.proposed_change.from_value}→${proposal.proposed_change.to_value} (param_delta=${deltaPct}%, flop_delta=${flopPct}%)`
  );

  const triggered = [
    `Scaling: ${decision.violations.filter((v) => v.startsWith("NO_") || v === "MIN_MAX_JUMP").join(", ") || "allow"}`,
    `Baseline: ${decision.violations.includes("MISSING_BASELINE_REF") ? "block" : "allow"}`,
    `Determinism: ${decision.violations.filter((v) => ["INSUFFICIENT_SEEDS", "MISSING_DATASET_VERSION", "MISSING_EVAL_PROTOCOL"].includes(v)).join(", ") || "allow"}`,
  ];
  const n2 = trace.derive(`Triggered policies: ${triggered.join("; ")}`, {
    evidence: [n1.id],
  });

  const baselineStr = context.baseline_metrics
    ? `params=${context.baseline_metrics.params}, flops=${context.baseline_metrics.flops}, loss=${context.baseline_metrics.loss}`
    : "none";
  const budgetStr = context.budget_ceiling
    ? `max_params=${context.budget_ceiling.max_params}, max_flops=${context.budget_ceiling.max_flops}, max_runtime_sec=${context.budget_ceiling.max_runtime_sec}`
    : "none";
  trace.assume(`Baseline metrics: ${baselineStr}. Budget ceiling: ${budgetStr}.`, {
    confidence: 1,
  });
  const n3 = trace.nodes[trace.nodes.length - 1];

  const decideContent = `${decision.outcome}: ${decision.violations.length > 0 ? decision.violations.join(", ") : "no violations"}`;
  const n4 = trace.decide(decideContent, {
    evidence: [n1.id, n2.id, n3.id],
    alternatives: ["allow", "block", "warn"],
    reasoning: decision.requirements.length > 0 ? decision.requirements.join("; ") : "No extra requirements.",
  });

  const actContent = input.record_hash
    ? `Appended to registry: ${input.record_hash}`
    : "Appended to registry (hash pending)";
  trace.act(actContent);

  trace.setBoundary("evaluation", {
    nodes: trace.nodes.map((n) => n.id),
    description: "Full governance evaluation trace",
  });

  const result = verifyTrace(trace);
  if (!result.valid) {
    throw new Error(`Trace verification failed: ${result.error ?? result.brokenAt}`);
  }
  return trace;
}
