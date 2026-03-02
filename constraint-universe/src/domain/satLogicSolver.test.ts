import { describe, it, expect } from "vitest";
import { solveCnfWithAssumptions } from "./satLogicSolver";

type Lit = number;
type Clause = Lit[];

describe("logic-solver harness sanity", () => {
  it("SAT: (x1)", () => {
    const cnf: Clause[] = [[1]];
    const r = solveCnfWithAssumptions(cnf, []);
    expect(r.status).toBe("SAT");
  });

  it("UNSAT: (x1) AND (¬x1)", () => {
    const cnf: Clause[] = [[1], [-1]];
    const r = solveCnfWithAssumptions(cnf, []);
    expect(r.status).toBe("UNSAT");
  });

  it("SAT: (x1 ∨ x2) AND (¬x1)", () => {
    const cnf: Clause[] = [[1, 2], [-1]];
    const r = solveCnfWithAssumptions(cnf, []);
    expect(r.status).toBe("SAT");
  });
});

