/**
 * JSONL tamper detection: with traceability ON, tampering breaks verifyChain.
 */

import { describe, test, expect } from "vitest";
import { tamperScenario } from "../runtime/scenarios";
import { DEFAULT_CONFIG } from "../runtime/config";

describe("Tamper detection", () => {
  test("traceability ON: before tamper valid, after tamper invalid", () => {
    const config = {
      ...DEFAULT_CONFIG,
      primitives: { governance: true, reasoning: true, traceability: true },
      registry_path: "./data/experiments-tamper-on.test.jsonl",
    };
    const { beforeValid, afterTamperValid } = tamperScenario(config);
    expect(beforeValid).toBe(true);
    expect(afterTamperValid).toBe(false);
  });

  test("traceability OFF: after tamper still reports valid", () => {
    const config = {
      ...DEFAULT_CONFIG,
      primitives: { governance: true, reasoning: true, traceability: false },
      registry_path: "./data/experiments-tamper-off.test.jsonl",
    };
    const { beforeValid, afterTamperValid } = tamperScenario(config);
    expect(beforeValid).toBe(true);
    expect(afterTamperValid).toBe(true);
  });
});
