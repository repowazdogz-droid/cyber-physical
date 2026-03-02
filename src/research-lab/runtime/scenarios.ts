/**
 * Pre-built scenarios for testing: bigger hidden size trap, tamper, claim promotion.
 */

import type { ExperimentProposal } from "../models/proposal";
import type { RuntimeConfig } from "./config";
import { ResearchLabRuntime } from "./runner";
import type { GovernanceDecision } from "../models/decision";
import * as fs from "fs";
import { JsonlRegistry } from "../registry/jsonl";

const ISO = "2025-01-15T12:00:00.000Z";

function baseProposal(overrides: Partial<ExperimentProposal>): ExperimentProposal {
  return {
    id: "exp-base",
    hypothesis: "Baseline",
    type: "baseline",
    baseline_ref: null,
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 512 },
    compute_budget: { max_params: 1e6, max_flops: 1e9, max_runtime_sec: 3600 },
    scaling_hypothesis: null,
    controls: {
      seed_plan: [42, 123, 456],
      dataset_version: "v1",
      eval_protocol: "fixed-val",
    },
    ablations: [],
    created_at: ISO,
    ...overrides,
  };
}

export interface ScenarioResult {
  decisions: { proposal_id: string; outcome: GovernanceDecision["outcome"]; violations: string[] }[];
}

/**
 * Bigger hidden size trap: baseline, naive scale-up (block), malformed scaling (block), proper scaling (allow).
 */
export function biggerHiddenSizeTrap(config: RuntimeConfig): ScenarioResult {
  const registryPath = config.registry_path + ".scenario-trap-" + Date.now();
  const runtime = new ResearchLabRuntime({ ...config, registry_path: registryPath });
  const context = {
    baseline_metrics: { params: 1e6, flops: 1e9, loss: 0.5 },
    budget_ceiling: { max_params: 2e6, max_flops: 2e9, max_runtime_sec: 7200 },
  };
  const decided_at = ISO;

  const baseline = baseProposal({
    id: "exp-baseline-001",
    type: "baseline",
    hypothesis: "Establish baseline at hidden_size=512",
  });
  const naiveScaleUp = baseProposal({
    id: "exp-naive-001",
    type: "architecture",
    hypothesis: "Bigger is better",
    baseline_ref: "exp-baseline-001",
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
    scaling_hypothesis: null,
  });
  const malformedScaling = baseProposal({
    id: "exp-malformed-001",
    type: "scaling_study",
    hypothesis: "Scale up with study",
    baseline_ref: "exp-baseline-001",
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
    scaling_hypothesis: {
      type: "scaling_study",
      intermediate_points: [],
      baseline_scale_included: true,
    },
  });
  const properScaling = baseProposal({
    id: "exp-proper-001",
    type: "scaling_study",
    hypothesis: "Scale hidden_size with intermediate measurements",
    baseline_ref: "exp-baseline-001",
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
    scaling_hypothesis: {
      type: "scaling_study",
      intermediate_points: [768],
      baseline_scale_included: true,
    },
  });

  const proposals = [baseline, naiveScaleUp, malformedScaling, properScaling];
  const decisions: ScenarioResult["decisions"] = [];

  for (const p of proposals) {
    const result = runtime.run({ proposal: p, context, decided_at });
    decisions.push({
      proposal_id: result.proposal_id,
      outcome: result.decision.outcome,
      violations: result.decision.violations,
    });
  }

  return { decisions };
}

/**
 * Run one proposal then tamper the JSONL; verifyChain reflects traceability.
 */
export function tamperScenario(config: RuntimeConfig): {
  beforeValid: boolean;
  afterTamperValid: boolean;
  registryPath: string;
} {
  const registryPath = config.registry_path + ".scenario-tamper-" + Date.now();
  const runtime = new ResearchLabRuntime({ ...config, registry_path: registryPath });
  const proposal = baseProposal({ id: "exp-tamper-001" });
  runtime.run({
    proposal,
    context: {},
    decided_at: ISO,
  });
  const beforeValid = runtime.getRegistry().verifyChain().valid;

  const content = fs.readFileSync(registryPath, "utf8");
  const lines = content.trim().split("\n").filter((l: string) => l.length > 0);
  const first = JSON.parse(lines[0]) as { payload: unknown };
  (first as Record<string, unknown>).payload = { tampered: true };
  lines[0] = JSON.stringify(first);
  fs.writeFileSync(registryPath, lines.join("\n") + "\n", "utf8");

  const registry2 = new JsonlRegistry({
    path: registryPath,
    traceability: config.primitives.traceability,
  });
  const afterTamperValid = registry2.verifyChain().valid;

  return { beforeValid, afterTamperValid, registryPath };
}
