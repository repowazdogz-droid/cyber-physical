import { describe, it, expect } from "vitest";
import { canPromoteToActive, nextStateAfterObservation } from "./gating";

describe("gating", () => {
  it("does not promote with fewer than 3 observations", () => {
    const obs = [
      { id: "1", surfaceFormFamily: "direct", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
      { id: "2", surfaceFormFamily: "scenario", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
    ];
    expect(canPromoteToActive(obs)).toBe(false);
  });

  it("promotes with 3 observations from different surface form families above threshold", () => {
    const obs = [
      { id: "1", surfaceFormFamily: "direct", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
      { id: "2", surfaceFormFamily: "scenario", matchStrength: 0.75, conceptId: "c1", grammarLabel: "g1" },
      { id: "3", surfaceFormFamily: "equation", matchStrength: 0.9, conceptId: "c1", grammarLabel: "g1" },
    ];
    expect(canPromoteToActive(obs)).toBe(true);
  });

  it("does not promote when observations below match strength threshold", () => {
    const obs = [
      { id: "1", surfaceFormFamily: "direct", matchStrength: 0.5, conceptId: "c1", grammarLabel: "g1" },
      { id: "2", surfaceFormFamily: "scenario", matchStrength: 0.6, conceptId: "c1", grammarLabel: "g1" },
      { id: "3", surfaceFormFamily: "equation", matchStrength: 0.65, conceptId: "c1", grammarLabel: "g1" },
    ];
    expect(canPromoteToActive(obs, { matchStrengthThreshold: 0.7 })).toBe(false);
  });

  it("does not promote when same surface form family repeated", () => {
    const obs = [
      { id: "1", surfaceFormFamily: "direct", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
      { id: "2", surfaceFormFamily: "direct", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
      { id: "3", surfaceFormFamily: "direct", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
    ];
    expect(canPromoteToActive(obs)).toBe(false);
  });

  it("nextStateAfterObservation stays EMERGING until gating met", () => {
    const obs2 = [
      { id: "1", surfaceFormFamily: "direct", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
      { id: "2", surfaceFormFamily: "scenario", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" },
    ];
    expect(nextStateAfterObservation("EMERGING", obs2)).toBe("EMERGING");
    const obs3 = [...obs2, { id: "3", surfaceFormFamily: "equation", matchStrength: 0.8, conceptId: "c1", grammarLabel: "g1" }];
    expect(nextStateAfterObservation("EMERGING", obs3)).toBe("ACTIVE");
    expect(nextStateAfterObservation("ACTIVE", obs3)).toBe("ACTIVE");
  });
});
