import { describe, it, expect } from "vitest";
import { compileUniverseToCnf } from "./cnf";
import { solveCnfWithAssumptions } from "./satLogicSolver";
import type { Universe, Constraint } from "./types";

function mk(c: Omit<Constraint, "id">): Constraint {
  return { id: Math.random().toString(16).slice(2), ...c } as Constraint;
}

import { analyzeUniverseSat } from "./solverSat";

describe("EXACTLY_K smoke", () => {
  it("EXACTLY_2({D,E}) forces D and E true (t=0)", () => {
    const states = ["A","B","C","D","E"] as const;
    const constraints: Constraint[] = [
      mk({ kind: "EXACTLY_K_OF_SET", set: ["D","E"], k: 2 }),
    ];

    const u: Universe = { states: [...states], constraints, horizon: 0 };
    const comp = compileUniverseToCnf(u);

    // enable all constraints:
    const acts = comp.enableAllAssumptions.slice();

    const vD = comp.varOfStateAt("D", 0);
    const vE = comp.varOfStateAt("E", 0);

    // Debug: dump clauses and activation vars
    console.log({ 
      acts, 
      clauses: comp.clauses.slice(0, 80), 
      stateVars: { D: vD, E: vE },
      numClauses: comp.clauses.length,
      numVars: comp.numVars
    });

    // F is SAT
    const base = solveCnfWithAssumptions(comp.clauses, acts);
    expect(base.status).toBe("SAT");

    // F ∧ D is SAT
    const withD = solveCnfWithAssumptions(comp.clauses, [...acts, vD]);
    expect(withD.status).toBe("SAT");

    // F ∧ ¬D is UNSAT
    const withNotD = solveCnfWithAssumptions(comp.clauses, [...acts, -vD]);
    expect(withNotD.status).toBe("UNSAT");

    // F ∧ E is SAT
    const withE = solveCnfWithAssumptions(comp.clauses, [...acts, vE]);
    expect(withE.status).toBe("SAT");

    // F ∧ ¬E is UNSAT
    const withNotE = solveCnfWithAssumptions(comp.clauses, [...acts, -vE]);
    expect(withNotE.status).toBe("UNSAT");
  });

  it("analyzeUniverseSat correctly classifies D and E as inevitable", () => {
    const states = ["A","B","C","D","E"] as const;
    const constraints: Constraint[] = [
      mk({ kind: "AT_MOST_K_OF_SET", set: ["A","B","C"], k: 1 }),
      mk({ kind: "EXACTLY_K_OF_SET", set: ["D","E"], k: 2 }),
    ];

    const u: Universe = { states: [...states], constraints, horizon: 0 };
    const analysis = analyzeUniverseSat(u);

    console.log({
      possible: [...analysis.possible].sort(),
      impossible: [...analysis.impossible].sort(),
      inevitable: [...analysis.inevitable].sort(),
    });

    // D and E should be inevitable (forced by EXACTLY_2)
    expect(analysis.inevitable.has("D")).toBe(true);
    expect(analysis.inevitable.has("E")).toBe(true);
    
    // D and E should also be in possible (inevitable implies possible)
    expect(analysis.possible.has("D")).toBe(true);
    expect(analysis.possible.has("E")).toBe(true);
  });
});

