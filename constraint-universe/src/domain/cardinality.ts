import type { Clause, Lit } from "./cnf";

/**
 * Sinz sequential counter encoding for AtMostK.
 * Given literals x1..xn, constrain sum(xi) <= k.
 *
 * Returns CNF clauses. Uses freshVar() to allocate aux vars.
 *
 * Notes:
 * - If k < 0 => UNSAT (return [[]])
 * - If k >= n => no constraints (return [])
 * - If n === 0 => return [] if k>=0 else [[]]
 */
export function atMostK_Sinz(lits: Lit[], k: number, freshVar: () => number): Clause[] {
  const n = lits.length;
  if (k < 0) return [[]];
  if (k >= n) return [];
  if (n === 0) return [];
  if (k <= 0) {
    // AtMost0: all literals must be false
    return lits.map(l => [-l]);
  }
  if (n === 1) {
    // n=1, k>=1: no constraint
    return [];
  }

  // Auxiliary vars s(i,j) for i=1..n, j=1..k
  // We'll index them as s[i][j] with i in [1..n], j in [1..k]
  // Allocate array with n+1 elements (indices 0..n), but we use indices 1..n
  const s: number[][] = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= k; j++) {
      s[i]![j] = freshVar();
    }
  }

  const C: Clause[] = [];

  // Sinz sequential counter encoding for AtMostK
  // s(i,j) means "at least j of x1..xi are true"
  
  // (1) First row: ¬x1 ∨ s(1,1)
  C.push([-lits[0]!, s[1]![1]!]);

  // (2) For j=2..k: ¬s(1,j) (s(1,j) can't be true for j>1)
  for (let j = 2; j <= k; j++) {
    C.push([-s[1]![j]!]);
  }

  // For i=2..n:
  for (let i = 2; i <= n; i++) {
    // (3) ¬xi ∨ s(i,1) (if xi is true, at least 1 of x1..xi is true)
    C.push([-lits[i - 1]!, s[i]![1]!]);

    // (4) ¬s(i-1,1) ∨ s(i,1) (if at least 1 of x1..x(i-1), then at least 1 of x1..xi)
    C.push([-s[i - 1]![1]!, s[i]![1]!]);

    // (5) For j=2..k: (¬xi ∨ ¬s(i-1,j-1) ∨ s(i,j))
    // If xi is true and at least (j-1) of x1..x(i-1) are true, then at least j of x1..xi are true
    for (let j = 2; j <= k; j++) {
      C.push([-lits[i - 1]!, -s[i - 1]![j - 1]!, s[i]![j]!]);
    }

    // (6) For j=2..k: (¬s(i-1,j) ∨ s(i,j))
    // If at least j of x1..x(i-1) are true, then at least j of x1..xi are true
    for (let j = 2; j <= k; j++) {
      C.push([-s[i - 1]![j]!, s[i]![j]!]);
    }

    // (7) For i > k: prevent exceeding k
    // If we already have k true in x1..x(i-1), then xi must be false
    if (i > k) {
      C.push([-lits[i - 1]!, -s[i - 1]![k]!]);
    }
  }

  return C;
}

