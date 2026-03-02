import { describe, it, expect } from "vitest";
import { atMostK_Sinz } from "./cardinality";

type Lit = number;
type Clause = Lit[];
type Cnf = Clause[];

function evalLit(lit: Lit, asg: boolean[]): boolean {
  const v = Math.abs(lit);
  const val = asg[v] ?? false; // vars are 1-indexed; asg[0] unused
  return lit > 0 ? val : !val;
}

function evalClause(cl: Clause, asg: boolean[]): boolean {
  // empty clause is UNSAT
  if (cl.length === 0) return false;
  for (const lit of cl) if (evalLit(lit, asg)) return true;
  return false;
}

function evalCnf(cnf: Cnf, asg: boolean[]): boolean {
  for (const cl of cnf) if (!evalClause(cl, asg)) return false;
  return true;
}

function popcount(x: number): number {
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

function boolsFromMask(n: number, mask: number): boolean[] {
  // asg[1..n] correspond to x1..xn
  const asg = new Array<boolean>(n + 1).fill(false);
  for (let i = 0; i < n; i++) {
    asg[i + 1] = ((mask >>> i) & 1) === 1;
  }
  return asg;
}

describe("cardinality: atMostK_Sinz", () => {
  it("micro: n=3 k=1 (find minimal counterexample if any)", () => {
    const n = 3;
    const k = 1;

    let next = n + 1;
    const fresh = () => next++;
    const lits = [1, 2, 3];
    const cnf = atMostK_Sinz(lits, k, fresh);

    // check all assignments over x1..xn (aux vars default false unless forced)
    // We'll extend assignment size to include aux vars and brute force aux as well if needed.
    // BUT: Sinz encodings should be satisfiable with some aux assignment if and only if constraint holds.
    // So we must quantify over aux vars: exists aux assignment.
    const auxN = next - 1 - n;
    const totalVars = n + auxN;

    const existsAuxSat = (xMask: number): boolean => {
      // iterate all aux assignments (small: here auxN is small)
      for (let auxMask = 0; auxMask < (1 << auxN); auxMask++) {
        const asg = new Array<boolean>(totalVars + 1).fill(false);
        // set x vars
        for (let i = 0; i < n; i++) asg[i + 1] = ((xMask >>> i) & 1) === 1;
        // set aux vars
        for (let j = 0; j < auxN; j++) asg[n + 1 + j] = ((auxMask >>> j) & 1) === 1;
        if (evalCnf(cnf, asg)) return true;
      }
      return false;
    };

    for (let xMask = 0; xMask < (1 << n); xMask++) {
      const ones = popcount(xMask);
      const expected = ones <= k;
      const actual = existsAuxSat(xMask);

      if (expected !== actual) {
        // minimal counterexample: print exact assignment and CNF stats
        const bits = boolsFromMask(n, xMask).slice(1).map(b => (b ? 1 : 0)).join("");
        console.error("COUNTEREXAMPLE",
          { n, k, xMask, bits, ones, expected, actual, clauses: cnf.length, auxN }
        );
        // fail immediately so we stop chasing ghosts
        expect(actual).toBe(expected);
      }
    }

    expect(true).toBe(true);
  });

  it("edge: k=0 forbids any true literal", () => {
    const n = 4;
    const k = 0;
    let next = n + 1;
    const fresh = () => next++;
    const lits = [1, 2, 3, 4];
    const cnf = atMostK_Sinz(lits, k, fresh);
    const auxN = next - 1 - n;
    const totalVars = n + auxN;

    const existsAuxSat = (xMask: number): boolean => {
      for (let auxMask = 0; auxMask < (1 << auxN); auxMask++) {
        const asg = new Array<boolean>(totalVars + 1).fill(false);
        for (let i = 0; i < n; i++) asg[i + 1] = ((xMask >>> i) & 1) === 1;
        for (let j = 0; j < auxN; j++) asg[n + 1 + j] = ((auxMask >>> j) & 1) === 1;
        if (evalCnf(cnf, asg)) return true;
      }
      return false;
    };

    // only all-false should satisfy
    for (let xMask = 0; xMask < (1 << n); xMask++) {
      const expected = popcount(xMask) <= 0;
      const actual = existsAuxSat(xMask);
      expect(actual).toBe(expected);
    }
  });
});
