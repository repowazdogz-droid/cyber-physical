/**
 * Governance policy enforcement tests.
 */

import { describe, test, expect } from "vitest";
import { GovernanceEngine } from "../governance/engine";
import { createProposal } from "../models/proposal";
import type { ExperimentProposal } from "../models/proposal";
import { DEFAULT_CONFIG } from "../runtime/config";

const ISO = "2025-01-15T12:00:00.000Z";

function fullProposal(overrides: Partial<ExperimentProposal>): ExperimentProposal {
  return createProposal({
    id: "exp-001",
    hypothesis: "Test",
    type: "baseline",
    baseline_ref: null,
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 512 },
    compute_budget: { max_params: 1e6, max_flops: 1e9, max_runtime_sec: 3600 },
    scaling_hypothesis: null,
    controls: { seed_plan: [42, 123, 456], dataset_version: "v1", eval_protocol: "p1" },
    ablations: [],
    created_at: ISO,
    ...overrides,
  });
}

describe("GovernanceEngine", () => {
  test("proposal validation: invalid proposal throws", () => {
    expect(() =>
      createProposal({
        ...fullProposal({}),
        id: "",
      } as ExperimentProposal)
    ).toThrow();
    expect(() =>
      createProposal({
        ...fullProposal({}),
        controls: { seed_plan: [], dataset_version: "v1", eval_protocol: "p1" },
      } as ExperimentProposal)
    ).toThrow();
  });

  test("baseline proposal allowed", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({ type: "baseline" });
    const decision = engine.evaluate(proposal, {}, ISO);
    expect(decision.outcome).toBe("allow");
    expect(decision.violations).toHaveLength(0);
    expect(decision.decision_hash).toBeTruthy();
  });

  test("missing baseline_ref blocked", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({ type: "architecture", baseline_ref: null });
    const decision = engine.evaluate(proposal, {}, ISO);
    expect(decision.outcome).toBe("block");
    expect(decision.violations).toContain("MISSING_BASELINE_REF");
  });

  test("naive scale-up without scaling_hypothesis blocked", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({
      type: "architecture",
      baseline_ref: "exp-000",
      proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
      scaling_hypothesis: null,
    });
    const decision = engine.evaluate(proposal, {}, ISO);
    expect(decision.outcome).toBe("block");
    expect(decision.violations).toContain("NO_SCALING_HYPOTHESIS");
  });

  test("scaling_study with no intermediate points blocked", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({
      type: "scaling_study",
      baseline_ref: "exp-000",
      proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
      scaling_hypothesis: {
        type: "scaling_study",
        intermediate_points: [],
        baseline_scale_included: true,
      },
    });
    const decision = engine.evaluate(proposal, {}, ISO);
    expect(decision.outcome).toBe("block");
    expect(decision.violations).toContain("NO_INTERMEDIATE_POINTS");
  });

  test("scaling_study with intermediate points allowed", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({
      type: "scaling_study",
      baseline_ref: "exp-000",
      proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
      scaling_hypothesis: {
        type: "scaling_study",
        intermediate_points: [768],
        baseline_scale_included: true,
      },
    });
    const decision = engine.evaluate(proposal, {}, ISO);
    expect(decision.outcome).toBe("allow");
    expect(decision.violations).toHaveLength(0);
  });

  test("insufficient seeds blocked", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({
      controls: { seed_plan: [42], dataset_version: "v1", eval_protocol: "p1" },
    });
    const decision = engine.evaluate(proposal, {}, ISO);
    expect(decision.outcome).toBe("block");
    expect(decision.violations).toContain("INSUFFICIENT_SEEDS");
  });

  test("deterministic: same inputs → same decision_hash", () => {
    const engine = new GovernanceEngine({ scaling: DEFAULT_CONFIG.scaling });
    const proposal = fullProposal({
      type: "scaling_study",
      baseline_ref: "exp-000",
      proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
      scaling_hypothesis: {
        type: "scaling_study",
        intermediate_points: [768],
        baseline_scale_included: true,
      },
    });
    const d1 = engine.evaluate(proposal, {}, ISO);
    const d2 = engine.evaluate(proposal, {}, ISO);
    expect(d1.decision_hash).toBe(d2.decision_hash);
  });
});
