import { describe, it, expect } from "vitest";
import type { Universe } from "./types";
import { analyzeUniverseBrute } from "./engine";
import { analyzeUniverseSat } from "./solverSat";

const DEBUG_SIGNATURES = true;

function sameSets(a: Set<any>, b: Set<any>) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

describe("SAT encoding matches brute force (small universes)", () => {
  it("basic requires + not_together", () => {
    const u: Universe = {
      states: ["A","B","C","D"] as any,
      constraints: [
        { id: "1", kind: "REQUIRES", a: "A", b: "B" } as any,
        { id: "2", kind: "NOT_TOGETHER", a: "B", b: "C" } as any
      ]
    };
    const b = analyzeUniverseBrute(u);
    const s = analyzeUniverseSat(u);
    expect(sameSets(b.possible, s.possible)).toBe(true);
    expect(sameSets(b.impossible, s.impossible)).toBe(true);
    expect(sameSets(b.inevitable, s.inevitable)).toBe(true);
  });

  it("at most / exactly constraints", () => {
    const u: Universe = {
      states: ["A","B","C","D","E"] as any,
      constraints: [
        { id: "1", kind: "AT_MOST_K_OF_SET", set: ["A","B","C"], k: 1 } as any,
        { id: "2", kind: "EXACTLY_K_OF_SET", set: ["D","E"], k: 2 } as any
      ]
    };
    const b = analyzeUniverseBrute(u);
    const s = analyzeUniverseSat(u);
    if (!sameSets(b.possible, s.possible) && DEBUG_SIGNATURES) {
      // eslint-disable-next-line no-console
      console.error("possible mismatch", { brute: [...b.possible].sort(), sat: [...s.possible].sort() });
    }
    expect(sameSets(b.possible, s.possible)).toBe(true);
    if (!sameSets(b.impossible, s.impossible) && DEBUG_SIGNATURES) {
      // eslint-disable-next-line no-console
      console.error("impossible mismatch", { brute: [...b.impossible].sort(), sat: [...s.impossible].sort() });
    }
    expect(sameSets(b.impossible, s.impossible)).toBe(true);
    if (!sameSets(b.inevitable, s.inevitable) && DEBUG_SIGNATURES) {
      // eslint-disable-next-line no-console
      console.error("inevitable mismatch", { brute: [...b.inevitable].sort(), sat: [...s.inevitable].sort() });
    }
    expect(sameSets(b.inevitable, s.inevitable)).toBe(true);
  });

  it("paradox is UNSAT in both", () => {
    const u: Universe = {
      states: ["A","B"] as any,
      constraints: [
        // Force A to be true via EXACTLY_K_OF_SET
        { id: "1", kind: "EXACTLY_K_OF_SET", set: ["A"], k: 1 } as any,
        // A requires B
        { id: "2", kind: "REQUIRES", a: "A", b: "B" } as any,
        // But A and B cannot be together
        { id: "3", kind: "NOT_TOGETHER", a: "A", b: "B" } as any
      ]
    };
    const b = analyzeUniverseBrute(u);
    const s = analyzeUniverseSat(u);
    expect(b.witnessWorld).toBe(null);
    expect(s.witnessWorld).toBe(null);
  });
});


