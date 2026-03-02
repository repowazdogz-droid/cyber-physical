import type { Constraint, StateId, Universe } from "./types";
import { atMostK_Sinz } from "./cardinality";

export type Lit = number;          // DIMACS literal: +v or -v
export type Clause = Lit[];        // OR of literals
export type CNF = Clause[];        // AND of clauses

export type CnfCompilation = {
  numVars: number;
  clauses: CNF;

  // State vars (time-indexed: keys like "A@0", "A@1", ...)
  varOfState: Map<string, number>;
  stateOfVar: Map<number, string>;

  // Constraint activation vars (one per constraint id)
  actVarOfConstraintId: Map<string, number>;

  // Assumptions to enable all constraints: [a1, a2, ...]
  enableAllAssumptions: Lit[];

  // For debugging/UI later
  constraintToClauseIdxs: Map<string, number[]>;

  // Temporal
  horizon: number;
  varOfStateAt: (s: StateId, t: number) => number;
};

function assertNever(x: never): never {
  throw new Error("Unexpected: " + String(x));
}

// Old atMostK_Sinz implementation removed - now using imported version from cardinality.ts

function addActivatedClauses(
  out: CNF,
  act: number,
  rawClauses: CNF,
  constraintId: string,
  idxMap: Map<string, number[]>
) {
  for (const cl of rawClauses) {
    // act => clause  == (¬act ∨ clause)
    const activated = [-act, ...cl];
    const idx = out.length;
    out.push(activated);
    const arr = idxMap.get(constraintId) ?? [];
    arr.push(idx);
    idxMap.set(constraintId, arr);
  }
}

function labelToLits_set_at(states: StateId[], t: number, varOfStateAt: (s: StateId, t: number) => number): Lit[] {
  return states.map(s => varOfStateAt(s, t));
}

/**
 * Compile the universe into CNF with:
 * - one boolean var per state
 * - one activation var per constraint
 * - each constraint expands into 1+ clauses, guarded by its activation var
 */
export function compileUniverseToCnf(u: Universe): CnfCompilation {
  let nextVar = 1;

  const horizon = Math.max(0, Math.floor((u as any).horizon ?? 0));

  const varOfState = new Map<string, number>();
  const stateOfVar = new Map<number, string>();

  const varOfStateAtFn = (s: StateId, t: number) => {
    const key = `${s}@${t}`;
    const v = varOfState.get(key);
    if (!v) throw new Error(`Unknown var for ${key}`);
    return v;
  };

  // Allocate vars for each state at each time
  for (let t = 0; t <= horizon; t++) {
    for (const s of u.states) {
      const key = `${s}@${t}`;
      const v = nextVar++;
      varOfState.set(key, v);
      stateOfVar.set(v, key);
    }
  }

  const actVarOfConstraintId = new Map<string, number>();
  const constraintToClauseIdxs = new Map<string, number[]>();

  const freshVar = () => nextVar++;

  const clauses: CNF = [];
  const enableAllAssumptions: Lit[] = [];

  for (const c of u.constraints) {
    const act = freshVar();
    actVarOfConstraintId.set(c.id, act);
    enableAllAssumptions.push(act);

    let raw: CNF = [];

    switch (c.kind) {
      case "NOT_TOGETHER": {
        // for all t: ¬(A_t ∧ B_t)
        raw = [];
        for (let t = 0; t <= horizon; t++) {
          const a = varOfStateAtFn(c.a, t);
          const b = varOfStateAtFn(c.b, t);
          raw.push([-a, -b]);
        }
        break;
      }
      case "REQUIRES": {
        // for all t: A_t -> B_t
        raw = [];
        for (let t = 0; t <= horizon; t++) {
          const a = varOfStateAtFn(c.a, t);
          const b = varOfStateAtFn(c.b, t);
          raw.push([-a, b]);
        }
        break;
      }
      case "NEXT_REQUIRES": {
        // for all t < horizon: A_t -> B_{t+1}
        raw = [];
        for (let t = 0; t < horizon; t++) {
          const a = varOfStateAtFn(c.a, t);
          const b = varOfStateAtFn(c.b, t + 1);
          raw.push([-a, b]);
        }
        break;
      }
      case "PERSIST": {
        raw = [];
        for (let t = 0; t < horizon; t++) {
          const a = varOfStateAtFn(c.s, t);
          const b = varOfStateAtFn(c.s, t + 1);
          // S_t -> S_{t+1}
          raw.push([-a, b]);
        }
        break;
      }
      case "AT_MOST_K_OF_SET": {
        raw = [];
        for (let t = 0; t <= horizon; t++) {
          const lits = labelToLits_set_at(c.set, t, varOfStateAtFn);
          raw.push(...atMostK_Sinz(lits, c.k, freshVar));
        }
        break;
      }
      case "EXACTLY_K_OF_SET": {
        raw = [];
        const lits0 = labelToLits_set_at(c.set, 0, varOfStateAtFn);
        const n = lits0.length;
        const k = c.k;
        
        // Guard rails: impossible constraints (check once, applies to all time steps)
        if (k < 0 || k > n) {
          // Force constraint off by making activation imply false: (¬act)
          // Add for all time steps to be consistent
          for (let t = 0; t <= horizon; t++) {
            raw.push([]); // empty clause (UNSAT when activated via addActivatedClauses)
          }
          break;
        }
        
        // EXACTLY_k(X) = AT_MOST_k(X) AND AT_LEAST_k(X)
        // AT_LEAST_k(X) = AT_MOST_(n-k)(¬X)
        for (let t = 0; t <= horizon; t++) {
          const lits = labelToLits_set_at(c.set, t, varOfStateAtFn);
          
          // AtMost(k) on positives
          const atMost = atMostK_Sinz(lits, k, freshVar);
          
          // AtLeast(k) == AtMost(n-k) on negated literals
          const negLits = lits.map(l => -l);
          const atLeast = atMostK_Sinz(negLits, n - k, freshVar);
          
          raw.push(...atMost, ...atLeast);
        }
        break;
      }
      default:
        assertNever(c);
    }

    addActivatedClauses(clauses, act, raw, c.id, constraintToClauseIdxs);
  }

  return {
    numVars: nextVar - 1,
    clauses,
    varOfState,
    stateOfVar,
    actVarOfConstraintId,
    enableAllAssumptions,
    constraintToClauseIdxs,
    horizon,
    varOfStateAt: varOfStateAtFn
  };
}

