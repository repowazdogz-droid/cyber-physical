/**
 * Bigger hidden size trap scenario: baseline → naive (block) → malformed (block) → proper (allow).
 */

import { describe, test, expect } from "vitest";
import { biggerHiddenSizeTrap } from "../runtime/scenarios";
import { DEFAULT_CONFIG } from "../runtime/config";

describe("Scaling trap scenario", () => {
  test("all primitives ON: naive blocked, malformed blocked, proper allowed", () => {
    const config = {
      ...DEFAULT_CONFIG,
      registry_path: "./data/experiments-trap.test.jsonl",
    };
    const result = biggerHiddenSizeTrap(config);

    expect(result.decisions).toHaveLength(4);
    expect(result.decisions[0].proposal_id).toBe("exp-baseline-001");
    expect(result.decisions[0].outcome).toBe("allow");

    expect(result.decisions[1].proposal_id).toBe("exp-naive-001");
    expect(result.decisions[1].outcome).toBe("block");
    expect(result.decisions[1].violations).toContain("NO_SCALING_HYPOTHESIS");

    expect(result.decisions[2].proposal_id).toBe("exp-malformed-001");
    expect(result.decisions[2].outcome).toBe("block");
    expect(result.decisions[2].violations).toContain("NO_INTERMEDIATE_POINTS");

    expect(result.decisions[3].proposal_id).toBe("exp-proper-001");
    expect(result.decisions[3].outcome).toBe("allow");
  });
});
