/**
 * Irreducibility: disable each primitive and show deterministic failure.
 */

import { describe, test, expect } from "vitest";
import * as fs from "fs";
import { biggerHiddenSizeTrap, tamperScenario } from "../runtime/scenarios";
import { ResearchLabRuntime } from "../runtime/runner";
import { DEFAULT_CONFIG } from "../runtime/config";
import type { ExperimentProposal } from "../models/proposal";
import { createProposal } from "../models/proposal";

const ISO = "2025-01-15T12:00:00.000Z";

// Dedicated file for trace test; remove before run so verifyChain sees only this run's records
const TRACE_TEST_REGISTRY = "./data/irreducibility-trace-only.jsonl";

function baseProposal(overrides: Partial<ExperimentProposal>): ExperimentProposal {
  return createProposal({
    id: "exp-base",
    hypothesis: "Baseline",
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

describe("Irreducibility: all three primitives required", () => {
  describe("All primitives ON (control)", () => {
    test("bigger hidden size trap: naive blocked, malformed blocked, proper allowed", () => {
      const config = {
        ...DEFAULT_CONFIG,
        registry_path: "./data/irreducibility-control.test.jsonl",
      };
      const result = biggerHiddenSizeTrap(config);
      expect(result.decisions[1].outcome).toBe("block");
      expect(result.decisions[2].outcome).toBe("block");
      expect(result.decisions[3].outcome).toBe("allow");
    });

    test("full reasoning trace exists and verifies", () => {
      if (fs.existsSync(TRACE_TEST_REGISTRY)) {
        fs.unlinkSync(TRACE_TEST_REGISTRY);
      }
      const config = {
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: true },
        registry_path: TRACE_TEST_REGISTRY,
      };
      const runtime = new ResearchLabRuntime(config);
      const proposal = baseProposal({
        id: "exp-trace-001",
        type: "scaling_study",
        baseline_ref: "exp-000",
        proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
        scaling_hypothesis: {
          type: "scaling_study",
          intermediate_points: [768],
          baseline_scale_included: true,
        },
      });
      const out = runtime.run({ proposal, context: {}, decided_at: ISO });
      expect(out.trace).not.toBeNull();
      expect(out.trace!.nodes).toHaveLength(5);
      expect(runtime.getRegistry().verifyChain().valid).toBe(true);
    });
  });

  describe("Governance OFF → rogue actions execute", () => {
    test("naive scale-up allowed when governance OFF", () => {
      const config = {
        ...DEFAULT_CONFIG,
        primitives: { governance: false, reasoning: true, traceability: true },
        registry_path: "./data/irreducibility-gov-off.test.jsonl",
      };
      const result = biggerHiddenSizeTrap(config);
      expect(result.decisions[1].outcome).toBe("allow");
      expect(result.decisions[1].violations).toHaveLength(0);
    });
  });

  describe("Reasoning OFF → decisions are opaque", () => {
    test("governance still blocks/allows but no trace", () => {
      const config = {
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: false, traceability: true },
        registry_path: "./data/irreducibility-reason-off.test.jsonl",
      };
      const runtime = new ResearchLabRuntime(config);
      const proposal = baseProposal({
        id: "exp-opaque-001",
        type: "architecture",
        baseline_ref: "exp-000",
        proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
        scaling_hypothesis: null,
      });
      const out = runtime.run({ proposal, context: {}, decided_at: ISO });
      expect(out.decision.outcome).toBe("block");
      expect(out.trace).toBeNull();
    });
  });

  describe("Traceability OFF → history is mutable", () => {
    test("tamper then verifyChain still valid", () => {
      const config = {
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: false },
        registry_path: "./data/irreducibility-trace-off.test.jsonl",
      };
      const { beforeValid, afterTamperValid } = tamperScenario(config);
      expect(beforeValid).toBe(true);
      expect(afterTamperValid).toBe(true);
    });
  });
});
