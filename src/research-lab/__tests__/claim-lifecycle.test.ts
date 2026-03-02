/**
 * Claim promotion gates: OBSERVATION → REPLICATED → BASELINE_BEATING → GRADUATED.
 */

import { describe, test, expect } from "vitest";
import {
  canPromoteToReplicated,
  canPromoteToBaselineBeating,
  canPromoteToGraduated,
  type Claim,
} from "../models/claim";

function claim(overrides: Partial<Claim>): Claim {
  return {
    id: "c1",
    experiment_ids: [],
    current_tier: "OBSERVATION",
    stats: { mean: 0.5, std: 0.05, cv: 0.1, effect_size: 0.08 },
    contradictions: [],
    requires_human_approval: false,
    ...overrides,
  };
}

describe("Claim promotion", () => {
  test("OBSERVATION → REPLICATED: need ≥3 seeds and cv ≤ 0.10", () => {
    expect(canPromoteToReplicated(claim({ experiment_ids: ["a", "b"] })).allowed).toBe(false);
    expect(canPromoteToReplicated(claim({ experiment_ids: ["a", "b", "c"] })).allowed).toBe(true);
    expect(
      canPromoteToReplicated(
        claim({
          experiment_ids: ["a", "b", "c"],
          stats: { mean: 0.5, std: 0.1, cv: 0.25, effect_size: 0.05 },
        })
      ).allowed
    ).toBe(false);
  });

  test("REPLICATED → BASELINE_BEATING: effect_size ≥ 0.05 and positive", () => {
    const c = claim({
      current_tier: "REPLICATED",
      stats: { mean: 0.5, std: 0.05, cv: 0.08, effect_size: 0.03 },
    });
    expect(canPromoteToBaselineBeating(c).allowed).toBe(false);
    expect(
      canPromoteToBaselineBeating(
        claim({
          current_tier: "REPLICATED",
          stats: { mean: 0.5, std: 0.05, cv: 0.08, effect_size: 0.08 },
        })
      ).allowed
    ).toBe(true);
    expect(
      canPromoteToBaselineBeating(
        claim({
          current_tier: "REPLICATED",
          stats: { mean: 0.5, std: 0.05, cv: 0.08, effect_size: -0.1 },
        })
      ).allowed
    ).toBe(false);
  });

  test("BASELINE_BEATING → GRADUATED: requires_human_approval must be true", () => {
    expect(
      canPromoteToGraduated(
        claim({ current_tier: "BASELINE_BEATING", requires_human_approval: false })
      ).allowed
    ).toBe(false);
    expect(
      canPromoteToGraduated(
        claim({ current_tier: "BASELINE_BEATING", requires_human_approval: true })
      ).allowed
    ).toBe(true);
  });
});
