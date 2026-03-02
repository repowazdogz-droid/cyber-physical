import type { Analysis, Constraint, Reason, StateId, Universe } from "./types";
import { compileUniverseToCnf } from "./cnf";
import type { CNF, Lit, CnfCompilation } from "./cnf";
import { solveCnfWithAssumptions } from "./satLogicSolver";
import { getOrCompileCnf } from "./cnfCache";
import { cacheGet, cacheSet } from "./queryCache";

function worldAtTFromModel(u: Universe, model: Set<number>, comp: any, t: number) {
  const w = new Set<StateId>();
  for (const s of u.states) {
    const v = comp.varOfStateAt(s, t);
    if (model.has(v)) w.add(s);
  }
  return w;
}

function nowMs(): number {
  return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}

function labelConstraint(c: Constraint): string {
  if (c.kind === "NOT_TOGETHER") return `¬(${c.a} ∧ ${c.b})`;
  if (c.kind === "REQUIRES") return `${c.a} → ${c.b}`;
  if (c.kind === "NEXT_REQUIRES") return `${c.a}@t → ${c.b}@t+1`;
  if (c.kind === "PERSIST") return `PERSIST(${c.s})`;
  if (c.kind === "AT_MOST_K_OF_SET") return `|{${c.set.join(",")}}| ≤ ${c.k}`;
  if (c.kind === "EXACTLY_K_OF_SET") return `|{${c.set.join(",")}}| = ${c.k}`;
  const _x: never = c;
  return String(_x);
}

// Greedy deletion-based shrink to a small UNSAT core over activation vars.
// assumptionsBase = [act1, act2, ...] (+ goal literal like -vS or +vS, or null for pure UNSAT)
function shrinkUnsatCore(
  clauses: CNF,
  acts: number[],
  goalLit: Lit | null
): number[] {
  // Start from all activations. Remove any activation that is not needed to keep UNSAT.
  let core = [...acts];
  const assumptions = goalLit === null ? [...core] : [...core, goalLit];
  const initial = solveCnfWithAssumptions(clauses, assumptions);
  if (initial.status !== "UNSAT") return [];

  for (let i = 0; i < core.length; i++) {
    const trial = core.filter((_, idx) => idx !== i);
    const res = solveCnfWithAssumptions(
      clauses,
      goalLit === null ? [...trial] : [...trial, goalLit]
    );
    if (res.status === "UNSAT") {
      core = trial;
      i = -1; // restart for greedy minimization
    }
  }
  return core;
}

const MAX_CORES = 3;

function minimizeToMUS(
  baseClauses: CNF,
  coreActs: number[],
  goalLit: Lit | null
): number[] {
  // Deletion-based MUS minimization:
  // Remove any activation that is not necessary to keep UNSAT.
  let mus = [...coreActs];

  // Sanity: must be UNSAT to begin with
  const init = solveCnfWithAssumptions(
    baseClauses,
    goalLit === null ? [...mus] : [...mus, goalLit]
  );
  if (init.status !== "UNSAT") return [];

  for (let i = 0; i < mus.length; i++) {
    const trial = mus.filter((_, idx) => idx !== i);
    const res = solveCnfWithAssumptions(
      baseClauses,
      goalLit === null ? [...trial] : [...trial, goalLit]
    );
    if (res.status === "UNSAT") {
      // activation not needed, drop it and restart scan
      mus = trial;
      i = -1;
    }
  }

  return mus;
}

function enumerateUnsatCores(
  baseClauses: CNF,
  acts: number[],
  goalLit: Lit | null
): number[][] {
  const cores: number[][] = [];
  const blocked: CNF = []; // extra clauses (blocking)

  for (let iter = 0; iter < MAX_CORES; iter++) {
    const clauses = [...baseClauses, ...blocked];

    const core = shrinkUnsatCore(clauses, acts, goalLit);
    if (core.length === 0) break;

    const mus = minimizeToMUS(clauses, core, goalLit);
    if (mus.length === 0) break;

    cores.push(mus);

    // Block the MUS (not the non-minimal core)
    blocked.push(mus.map(a => -a));
  }

  return cores;
}

function* kCombinations<T>(arr: T[], k: number, start = 0, picked: T[] = []): Generator<T[]> {
  if (picked.length === k) { yield picked.slice(); return; }
  for (let i = start; i <= arr.length - (k - picked.length); i++) {
    picked.push(arr[i]!);
    yield* kCombinations(arr, k, i + 1, picked);
    picked.pop();
  }
}

/**
 * Find minimal correction sets (MCS) of size <= kMax.
 * Returns up to `limit` distinct options.
 * Exact for k <= kMax (by brute over core constraints), which is what matters for UX.
 */
function computeMcsOptions(
  clauses: CNF,
  allActs: number[],
  coreActs: number[],
  kMax: number,
  limit: number
): number[][] {
  const opts: number[][] = [];

  // Search by increasing k
  for (let k = 1; k <= kMax; k++) {
    for (const drop of kCombinations(coreActs, k)) {
      // SAT if we disable these activations (remove constraints)
      const trial = allActs.filter(a => !drop.includes(a));
      const res = solveCnfWithAssumptions(clauses, trial);
      if (res.status === "SAT") {
        opts.push(drop);
        if (opts.length >= limit) return opts;
      }
    }
    if (opts.length > 0) return opts; // only minimal-k sets
  }
  return opts;
}

function computeFixOptionsIfUnsat(
  clauses: CNF,
  acts: number[]
): { coreActs: number[]; mcs: number[][] } {
  const coreActs = shrinkUnsatCore(clauses, acts, null);
  if (coreActs.length === 0) return { coreActs: [], mcs: [] };

  // Exact minimal fixes up to k=3, return up to 6 options
  const mcs = computeMcsOptions(clauses, acts, coreActs, 3, 6);
  return { coreActs, mcs };
}

/**
 * SAT-based analysis:
 * - POSSIBLE(S): SAT(Constraints ∧ S)
 * - INEVITABLE(S): UNSAT(Constraints ∧ ¬S)
 * - Witness world: any SAT model for Constraints
 *
 * Uses activation vars: assumptions enable all constraints.
 */
export function analyzeUniverseSat(u: Universe): Analysis {
  const t0 = nowMs();
  const { key: uKey, comp } = getOrCompileCnf(u);

  // Build maps before base solve (needed for fixes computation)
  const actToId = new Map<number, string>();
  const idToPretty = new Map<string, string>();
  for (const c of u.constraints) {
    const act = comp.actVarOfConstraintId.get(c.id)!;
    actToId.set(act, c.id);
    idToPretty.set(c.id, labelConstraint(c));
  }

  const acts = comp.enableAllAssumptions.map(a => Math.abs(a)); // activation vars are positive

  // Base satisfiable check (for witness) - cached
  const baseKey = `${uKey}::baseSAT`;
  const baseHit = cacheGet<any>(baseKey);
  let base: any;
  if (baseHit.ok) {
    base = baseHit.value;
  } else {
    base = solveCnfWithAssumptions(comp.clauses, comp.enableAllAssumptions);
    cacheSet(baseKey, base);
  }
  if (base.status === "UNSAT") {
    const { mcs } = computeFixOptionsIfUnsat(comp.clauses, acts);

    const options = mcs.map((dropActs) => {
      const ids = dropActs.map(a => actToId.get(a)!).filter(Boolean);
      const pretty = ids.map(id => idToPretty.get(id) ?? id);
      return { constraintIds: ids, pretty };
    });

    return {
      possible: new Set(),
      impossible: new Set(u.states),
      inevitable: new Set(),
      witnessWorld: null,
      reasons: new Map<StateId, Reason>(),
      tension: [],
      fixes: { options },
      perf: { worlds: 0, ms: nowMs() - t0 } // worlds not enumerated
    };
  }

  const witnessWorld = worldAtTFromModel(u, base.model, comp, 0);

  const T = (u.horizon ?? 0) | 0;
  const trajectory: Array<Set<StateId>> = [];
  for (let t = 0; t <= T; t++) {
    trajectory.push(worldAtTFromModel(u, base.model, comp, t));
  }

  const possible = new Set<StateId>();
  const impossible = new Set<StateId>();
  const inevitable = new Set<StateId>();
  const reasons = new Map<StateId, Reason>();
  const witnesses = new Map<StateId, Set<StateId>>();

  // Query each state at time 0 - cached
  for (const s of u.states) {
    const v0 = comp.varOfStateAt(s, 0);

    const possKey = `${uKey}::stateSAT::t0::${s}::lit=${v0}`;
    const possHit = cacheGet<any>(possKey);
    let poss: any;
    if (possHit.ok) {
      poss = possHit.value;
    } else {
      poss = solveCnfWithAssumptions(comp.clauses, [...comp.enableAllAssumptions, v0]);
      cacheSet(possKey, poss);
    }
    const isPossible = poss.status === "SAT";

    const inevKey = `${uKey}::stateUNSAT::t0::${s}::lit=${-v0}`;
    const inevHit = cacheGet<any>(inevKey);
    let testInev: any;
    if (inevHit.ok) {
      testInev = inevHit.value;
    } else {
      testInev = solveCnfWithAssumptions(comp.clauses, [...comp.enableAllAssumptions, -v0]);
      cacheSet(inevKey, testInev);
    }
    const isInev = testInev.status === "UNSAT";

    if (isInev) {
      inevitable.add(s);
      // Inevitable states are also possible (they appear in all allowed worlds)
      possible.add(s);
      const coresActs = enumerateUnsatCores(comp.clauses, acts, -v0);

      const cores = coresActs.map(core => {
        const ids = core.map(a => actToId.get(a)!).filter(Boolean);
        const pretty = ids.map(id => idToPretty.get(id) ?? id);
        return { constraintIds: ids, pretty };
      });

      reasons.set(s, {
        kind: "UNSAT_CORES",
        goal: "INEVITABLE",
        state: s,
        cores
      });
      // Store witness world for INEVITABLE states (they're also possible)
      if (poss.status === "SAT") {
        witnesses.set(s, worldAtTFromModel(u, poss.model, comp, 0));
      }
    } else if (isPossible) {
      possible.add(s);
      // Store witness world for POSSIBLE states at time 0
      witnesses.set(s, worldAtTFromModel(u, poss.model, comp, 0));
    } else {
      impossible.add(s);
      const coresActs = enumerateUnsatCores(comp.clauses, acts, v0);

      const cores = coresActs.map(core => {
        const ids = core.map(a => actToId.get(a)!).filter(Boolean);
        const pretty = ids.map(id => idToPretty.get(id) ?? id);
        return { constraintIds: ids, pretty };
      });

      reasons.set(s, {
        kind: "UNSAT_CORES",
        goal: "IMPOSSIBLE",
        state: s,
        cores
      });
    }
  }

  // Minimal tension not computed here yet; leave empty (we'll compute via SAT later)
  return {
    possible,
    impossible,
    inevitable,
    witnessWorld,
    reasons,
    witnesses,
    trajectory,
    tension: [],
    perf: { worlds: 0, ms: nowMs() - t0 }
  };
}

export function isStatePossibleAtTime(u: Universe, state: StateId, t: number): boolean {
  const comp = compileUniverseToCnf(u);
  const v = comp.varOfStateAt(state, t);
  const res = solveCnfWithAssumptions(comp.clauses, [...comp.enableAllAssumptions, v]);
  return res.status === "SAT";
}

function expandByWeight(vars: number[], weights: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < vars.length; i++) {
    const w = Math.max(1, Math.floor(weights[i] ?? 1));
    for (let k = 0; k < w; k++) out.push(vars[i]!);
  }
  return out;
}

function atMostKRelax(clauses: any[], relaxVars: number[], k: number, freshVar: () => number): CNF {
  // Sequential counter (Sinz) for relax vars: sum(relaxVars) <= k
  const n = relaxVars.length;
  if (k >= n) return [];
  if (k <= 0) {
    return relaxVars.map(v => [-v]);
  }

  const s: number[][] = Array.from({ length: n - 1 }, () => Array.from({ length: k }, () => freshVar()));
  const out: CNF = [];

  // v1 -> s1,1
  out.push([-relaxVars[0]!, s[0]![0]!]);
  // for j=2..k: ¬s1,j
  for (let j = 1; j < k; j++) out.push([-s[0]![j]!]);

  for (let i = 1; i <= n - 2; i++) {
    // vi -> si,1
    out.push([-relaxVars[i]!, s[i]![0]!]);
    // s(i-1),1 -> si,1
    out.push([-s[i - 1]![0]!, s[i]![0]!]);
    // for j=2..k:
    for (let j = 1; j < k; j++) {
      // vi ∧ s(i-1),j-1 -> si,j
      out.push([-relaxVars[i]!, -s[i - 1]![j - 1]!, s[i]![j]!]);
      // s(i-1),j -> si,j
      out.push([-s[i - 1]![j]!, s[i]![j]!]);
    }
    // vi ∧ s(i-1),k -> false
    out.push([-relaxVars[i]!, -s[i - 1]![k - 1]!]);
  }

  // final vn -> ¬s(n-1),k
  out.push([-relaxVars[n - 1]!, -s[n - 2]![k - 1]!]);
  return out;
}

function diffTargetWitness(target: Set<StateId>, w: Set<StateId>): { missing: StateId[]; extra: StateId[] } {
  const missing: StateId[] = [];
  const extra: StateId[] = [];
  for (const s of target) if (!w.has(s)) missing.push(s);
  for (const s of w) if (!target.has(s)) extra.push(s);
  missing.sort(); extra.sort();
  return { missing, extra };
}

function closestReachExactAtTime(
  u: Universe,
  comp: CnfCompilation,
  t: number,
  target: StateId[],
  wMissing: number,
  wExtra: number
): { k: number; witnessAtT: Set<StateId>; missing: StateId[]; extra: StateId[] } | null {
  // Note: This function is called from runTemporalQuery which already has uKey cached
  // We could add caching here too, but it's less critical since it's only called for REACH_EXACT
  const targetSet = new Set<StateId>(target);
  const goalLits: Lit[] = [];
  const goalWeights: number[] = [];

  // For each state s:
  // - If s is in target: we want S@t TRUE  (missing if violated)
  // - Else: we want S@t FALSE (extra if violated)
  for (const s of u.states) {
    const v = comp.varOfStateAt(s, t);
    if (targetSet.has(s)) {
      goalLits.push(v);
      goalWeights.push(wMissing);
    } else {
      goalLits.push(-v);
      goalWeights.push(wExtra);
    }
  }

  // Soft-enforce each goal literal by allowing relaxation:
  // (goalLit ∨ r_i) where r_i means "we violate this goal literal"
  const relax: number[] = [];
  let next = comp.numVars + 1;
  const freshVar = () => next++;

  const softClauses: CNF = [];
  for (const lit of goalLits) {
    const r = freshVar();
    relax.push(r);
    softClauses.push([lit, r]);
  }

  // Expand relaxation variables by weight (unary encoding)
  const weightedRelax = expandByWeight(relax, goalWeights);

  // Search minimal k (total weight) such that SAT(base ∧ softClauses ∧ atMost(weightedRelax,k))
  const Wmax = weightedRelax.length;
  for (let k = 0; k <= Wmax; k++) {
    const boundClauses = atMostKRelax([], weightedRelax, k, freshVar);
    const cnf = [...comp.clauses, ...softClauses, ...boundClauses];
    const res = solveCnfWithAssumptions(cnf, [...comp.enableAllAssumptions]);
    if (res.status === "SAT") {
      const w = worldAtTFromModel(u, res.model, comp, t);
      const d = diffTargetWitness(targetSet, w);
      return { k, witnessAtT: w, missing: d.missing, extra: d.extra };
    }
  }

  return null;
}

export type TemporalQueryResult =
  | { status: "SAT"; witnessAtT: Set<StateId>; t?: number; note?: string }
  | {
      status: "UNSAT";
      muses: Array<{ constraintIds: string[]; pretty: string[] }>;
      mcs: Array<{ constraintIds: string[]; pretty: string[] }>;
      note?: string;
      closest?: {
        k: number; // number of violated target literals (minimum found)
        witnessAtT: Set<StateId>;
        missing: StateId[]; // in target but not in witness
        extra: StateId[];   // in witness but not in target
      };
    };

export type TemporalQueryKind =
  | { kind: "STATE"; state: StateId; want: "TRUE" | "FALSE"; t: number }
  | { kind: "REACH_EXACT"; target: StateId[]; t: number; wMissing?: number; wExtra?: number }
  | { kind: "EVENTUALLY"; state: StateId }
  | { kind: "ALWAYS"; state: StateId };

export function runTemporalQuery(u: Universe, q: TemporalQueryKind): TemporalQueryResult {
  const { key: uKey, comp } = getOrCompileCnf(u);

  const actToId = new Map<number, string>();
  const idToPretty = new Map<string, string>();
  const acts = comp.enableAllAssumptions.map(a => Math.abs(a));
  for (const c of u.constraints) {
    const act = comp.actVarOfConstraintId.get(c.id)!;
    actToId.set(act, c.id);
    idToPretty.set(c.id, labelConstraint(c));
  }

  function qKey(label: string, goalLits: number[], extraClauses: number[][]) {
    return `${uKey}::${label}::lits=${goalLits.slice().sort((a,b)=>a-b).join(",")}::extra=${JSON.stringify(extraClauses)}`;
  }

  const T = (u.horizon ?? 0) | 0;

  // Build goal assumptions as CNF clauses (for existential/disjunction cases we handle separately)
  let goalLits: Lit[] = [];
  let goalAsExtraClauses: CNF = []; // each is a clause

  if (q.kind === "STATE") {
    const v = comp.varOfStateAt(q.state, q.t);
    goalLits = [q.want === "TRUE" ? v : -v];
  } else if (q.kind === "REACH_EXACT") {
    const targetSet = new Set(q.target);
    for (const s of u.states) {
      const v = comp.varOfStateAt(s, q.t);
      goalLits.push(targetSet.has(s) ? v : -v);
    }
  } else if (q.kind === "EVENTUALLY") {
    // ∃t S@t  === add one clause (S@0 ∨ S@1 ∨ ... ∨ S@T)
    const disj: Lit[] = [];
    for (let t = 0; t <= T; t++) disj.push(comp.varOfStateAt(q.state, t));
    goalAsExtraClauses = [disj];
  } else if (q.kind === "ALWAYS") {
    // ALWAYS(S) is true iff UNSAT(∃t ¬S@t).
    // We'll solve for counterexample existence: (¬S@0 ∨ ¬S@1 ∨ ... ∨ ¬S@T)
    // If SAT -> NOT always (counterexample exists). If UNSAT -> always.
    const disj: Lit[] = [];
    for (let t = 0; t <= T; t++) disj.push(-comp.varOfStateAt(q.state, t));
    goalAsExtraClauses = [disj];
  }

  const assumps = [...comp.enableAllAssumptions, ...goalLits];
  const extra = goalAsExtraClauses;
  const key0 = qKey(`run:${q.kind}`, assumps, extra);

  const hit0 = cacheGet<any>(key0);
  if (hit0.ok) return hit0.value;

  const cnf = extra.length ? [...comp.clauses, ...extra] : comp.clauses;
  const res = solveCnfWithAssumptions(cnf, assumps);
  if (res.status === "SAT") {
    // For STATE/REACH_EXACT we know (q as any).t; for EVENTUALLY/ALWAYS we choose a meaningful t.
    let tPick = 0;
    let note: string | undefined;

    if (q.kind === "STATE") tPick = q.t;
    else if (q.kind === "REACH_EXACT") tPick = q.t;
    else if (q.kind === "EVENTUALLY") {
      // find earliest t where state is true in the model
      tPick = 0;
      for (let t = 0; t <= T; t++) {
        const v = comp.varOfStateAt(q.state, t);
        if (res.model.has(v)) { tPick = t; break; }
      }
      note = `holds at t=${tPick}`;
    } else if (q.kind === "ALWAYS") {
      // SAT here means counterexample exists (not always)
      // find earliest t where state is false in the model
      tPick = 0;
      for (let t = 0; t <= T; t++) {
        const v = comp.varOfStateAt(q.state, t);
        if (!res.model.has(v)) { tPick = t; break; }
      }
      note = `counterexample at t=${tPick}`;
    }

    const w = worldAtTFromModel(u, res.model, comp, tPick);
    const out = { status: "SAT" as const, witnessAtT: w, t: tPick, note };
    cacheSet(key0, out);
    return out;
  }

  // UNSAT proofs/fixes for the query:
  const cnfForQuery = goalAsExtraClauses.length ? [...comp.clauses, ...goalAsExtraClauses] : comp.clauses;

  function boolKey(prefix: string, acts: number[]) {
    const a = acts.slice().sort((x,y)=>x-y).join(",");
    const g = goalLits.slice().sort((x,y)=>x-y).join(",");
    const e = JSON.stringify(goalAsExtraClauses);
    return `${uKey}::${prefix}::acts=${a}::goal=${g}::extra=${e}`;
  }

  function isUnsatWithActs(trialActs: number[]): boolean {
    const k = boolKey("unsatWithActs", [...trialActs]);
    const hit = cacheGet<boolean>(k);
    if (hit.ok) return hit.value;

    const rr = solveCnfWithAssumptions(cnfForQuery, [...trialActs, ...goalLits]);
    const v = rr.status === "UNSAT";
    cacheSet(k, v);
    return v;
  }

  // MUS minimization over acts for this query (goalLits are fixed)
  function minimizeActsToMUS(seedActs: number[]): number[] {
    let mus = [...seedActs];
    if (!isUnsatWithActs(mus)) return [];
    for (let i = 0; i < mus.length; i++) {
      const trial = mus.filter((_, idx) => idx !== i);
      if (isUnsatWithActs(trial)) { mus = trial; i = -1; }
    }
    return mus;
  }

  // Enumerate up to 3 MUSes with blocking
  const musActsList: number[][] = [];
  const blocked: CNF = [];
  for (let iter = 0; iter < 3; iter++) {
    const baseClauses = [...cnfForQuery, ...blocked];
    const goalAsClauses = goalLits.map(l => [l]);
    const withGoal = [...baseClauses, ...goalAsClauses];

    const core = shrinkUnsatCore(withGoal, acts, null);
    if (core.length === 0) break;

    const mus = minimizeActsToMUS(core);
    if (mus.length === 0) break;

    musActsList.push(mus);
    blocked.push(mus.map(a => -a));
  }

  const muses = musActsList.map(core => {
    const ids = core.map(a => actToId.get(a)!).filter(Boolean);
    const pretty = ids.map(id => idToPretty.get(id) ?? id);
    return { constraintIds: ids, pretty };
  });

  // MCS options (k<=3) using first MUS
  const coreActs = musActsList[0] ?? [];
  const mcsActs = coreActs.length ? computeMcsOptions(cnfForQuery, acts, coreActs, 3, 6) : [];
  const mcs = mcsActs.map(dropActs => {
    const ids = dropActs.map(a => actToId.get(a)!).filter(Boolean);
    const pretty = ids.map(id => idToPretty.get(id) ?? id);
    return { constraintIds: ids, pretty };
  });

  let note: string | undefined;
  if (q.kind === "EVENTUALLY") note = `never holds within t≤${T}`;
  if (q.kind === "ALWAYS") note = `holds for all t≤${T}`;

  let closest: any = undefined;
  if (q.kind === "REACH_EXACT") {
    const wM = Math.max(1, Math.floor(q.wMissing ?? 2));
    const wE = Math.max(1, Math.floor(q.wExtra ?? 1));
    const c = closestReachExactAtTime(u, comp, q.t, q.target, wM, wE);
    if (c) closest = c;
  }

  const out = { status: "UNSAT" as const, muses, mcs, note, closest };
  cacheSet(key0, out);
  return out;
}

export function queryAtTime(u: Universe, state: StateId, t: number, want: "TRUE" | "FALSE"): TemporalQueryResult {
  return runTemporalQuery(u, { kind: "STATE", state, t, want });
}

