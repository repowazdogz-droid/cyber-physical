import Logic from "logic-solver";
import type { CNF, Lit } from "./cnf";

export type SatResult =
  | { status: "SAT"; model: Set<number> }   // positive vars assigned true
  | { status: "UNSAT" };

function litToFormula(lit: Lit) {
  const v = Math.abs(lit);
  const sym = `v${v}`;
  return lit > 0 ? sym : Logic.not(sym);
}

export function solveCnfWithAssumptions(cnf: CNF, assumptions: Lit[]): SatResult {
  const s = new Logic.Solver();

  // Add CNF clauses
  for (const clause of cnf) {
    const disj = clause.map(litToFormula);
    s.require(Logic.or(...disj));
  }

  // Add assumptions as unit clauses
  for (const a of assumptions) {
    s.require(litToFormula(a));
  }

  const sol = s.solve();
  if (!sol) return { status: "UNSAT" };

  // Extract model: vars with symbol vN true
  const trueVars = new Set<number>();
  for (const k of sol.getTrueVars()) {
    // k may be like "v12"
    if (typeof k === "string" && k.startsWith("v")) {
      const n = parseInt(k.slice(1), 10);
      if (Number.isFinite(n)) trueVars.add(n);
    }
  }
  return { status: "SAT", model: trueVars };
}

























