import type { CnfCompilation, Clause, Lit } from "./cnf";
import { solveCnfWithAssumptions } from "./satLogicSolver";

export type CountCI = { est: number; lo: number; hi: number; k: number; trials: number; p: number; pLo: number; pHi: number };
export type ProbCI = { est: number; lo: number; hi: number };

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function wilsonCI(successes: number, n: number, z = 1.96): { lo: number; hi: number } {
  if (n <= 0) return { lo: 0, hi: 1 };
  const phat = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (phat + (z * z) / (2 * n)) / denom;
  const rad = (z / denom) * Math.sqrt((phat * (1 - phat)) / n + (z * z) / (4 * n * n));
  return { lo: clamp01(center - rad), hi: clamp01(center + rad) };
}

function safeNegLn1m(p: number) {
  // -ln(1-p) stable near p≈0
  const q = Math.max(1e-12, 1 - clamp01(p));
  return -Math.log(q);
}

function rng32(seed: number) {
  let x = seed | 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function pickSubset(r: () => number, vars: number[], density = 0.5): number[] {
  // random subset; ensure non-empty
  const out: number[] = [];
  for (const v of vars) if (r() < density) out.push(v);
  if (out.length === 0) out.push(vars[Math.floor(r() * vars.length)]!);
  return out;
}

// Encode y = a XOR b in CNF (y is new variable)
function xor2Clauses(a: number, b: number, y: number): Clause[] {
  // y <-> a xor b
  // (¬a ∨ ¬b ∨ ¬y) ∧ (¬a ∨ b ∨ y) ∧ (a ∨ ¬b ∨ y) ∧ (a ∨ b ∨ ¬y)
  return [
    [-a, -b, -y],
    [-a,  b,  y],
    [ a, -b,  y],
    [ a,  b, -y],
  ];
}

// Encode XOR(parity(vars)) = rhs (0/1). Returns { clauses, outVar } where outVar is the computed parity variable (or single var).
function xorChain(vars: number[], rhs: 0 | 1, freshVar: () => number): { clauses: Clause[]; outLit: Lit } {
  const clauses: Clause[] = [];
  if (vars.length === 1) {
    const v = vars[0]!;
    return { clauses, outLit: rhs === 1 ? v : -v };
  }
  let acc = freshVar();
  clauses.push(...xor2Clauses(vars[0]!, vars[1]!, acc));
  for (let i = 2; i < vars.length; i++) {
    const nxt = freshVar();
    clauses.push(...xor2Clauses(acc, vars[i]!, nxt));
    acc = nxt;
  }
  return { clauses, outLit: rhs === 1 ? acc : -acc };
}

function applyRandomXors(
  baseClauses: Clause[],
  vars: number[],
  k: number,
  seed: number
): { clauses: Clause[]; numVars: number } {
  let numVars = Math.max(...vars);
  const freshVar = () => (++numVars);

  const r = rng32(seed);
  const extra: Clause[] = [];

  for (let i = 0; i < k; i++) {
    const subset = pickSubset(r, vars, 0.5);
    const rhs: 0 | 1 = (r() < 0.5 ? 0 : 1);
    const enc = xorChain(subset, rhs, freshVar);
    extra.push(...enc.clauses);
    // constrain parity literal to TRUE (unit clause)
    extra.push([enc.outLit]);
  }

  return { clauses: [...baseClauses, ...extra], numVars };
}

function isSat(clauses: Clause[], assumptions: Lit[]) {
  const res = solveCnfWithAssumptions(clauses, assumptions);
  return res.status === "SAT";
}

// Find a k where p_sat is not degenerate (between pMin..pMax) to stabilize estimate
function chooseK(comp: CnfCompilation, assumptions: Lit[], vars: number[], trials: number, seed0: number, kMax: number) {
  const pMin = 0.25, pMax = 0.75;
  let best = { k: 0, p: 1.0, successes: trials, satClauses: comp.clauses };

  for (let k = 0; k <= kMax; k++) {
    let succ = 0;
    for (let i = 0; i < trials; i++) {
      const seed = (seed0 + 1009 * k + 9176 * i) | 0;
      const withX = applyRandomXors(comp.clauses, vars, k, seed);
      if (isSat(withX.clauses, assumptions)) succ++;
    }
    const p = succ / trials;
    best = { k, p, successes: succ, satClauses: comp.clauses };

    if (p >= pMin && p <= pMax) return { k, p, successes: succ };
    // If already UNSAT almost always, stop increasing
    if (p <= 0.02) return { k, p, successes: succ };
  }
  return { k: best.k, p: best.p, successes: best.successes };
}

export function approxCountWithCI(
  comp: CnfCompilation,
  assumptions: Lit[],
  opts?: { trials?: number; seed?: number; kMax?: number; z?: number }
): CountCI {
  const trials = Math.max(10, Math.min(200, opts?.trials ?? 40));
  const seed = (opts?.seed ?? (Date.now() & 0xffffffff)) | 0;
  const kMax = Math.max(0, Math.min(40, opts?.kMax ?? 26));
  const z = opts?.z ?? 1.96;

  // Count over all time-indexed vars in compilation:
  const vars: number[] = [];
  for (let v = 1; v <= comp.numVars; v++) vars.push(v);

  const picked = chooseK(comp, assumptions, vars, trials, seed, kMax);
  const p = clamp01(picked.p);

  const ciP = wilsonCI(picked.successes, trials, z);
  const pLo = clamp01(ciP.lo);
  const pHi = clamp01(ciP.hi);

  // Estimate |F| ≈ -ln(1-p) * 2^k
  const scale = Math.pow(2, picked.k);
  const est = safeNegLn1m(p) * scale;
  const lo = safeNegLn1m(pLo) * scale;
  const hi = safeNegLn1m(pHi) * scale;

  return { est, lo, hi, k: picked.k, trials, p, pLo, pHi };
}

export function approxProbLitWithCI(
  comp: CnfCompilation,
  baseAssumps: Lit[],
  lit: Lit,
  opts?: { trials?: number; seed?: number; kMax?: number; z?: number }
): { p: ProbCI; total: CountCI; withLit: CountCI } {
  const total = approxCountWithCI(comp, baseAssumps, opts);
  const withLit = approxCountWithCI(comp, [...baseAssumps, lit], opts);

  const est = total.est <= 0 ? 0 : clamp01(withLit.est / total.est);
  // conservative ratio bounds:
  const lo = total.hi <= 0 ? 0 : clamp01(withLit.lo / total.hi);
  const hi = total.lo <= 0 ? 1 : clamp01(withLit.hi / total.lo);

  return { p: { est, lo, hi }, total, withLit };
}

























