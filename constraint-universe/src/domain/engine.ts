import type { Analysis, Constraint, Reason, StateId, Universe } from "./types";

function nowMs(): number {
  return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}

/**
 * MVU semantics:
 * - A "world" is any subset of states.
 * - Constraints restrict which worlds are allowed.
 * - A state is:
 *    POSSIBLE   if it appears in at least one allowed world
 *    IMPOSSIBLE if it appears in no allowed worlds
 *    INEVITABLE if it appears in every allowed world (strong signal)
 *
 * This is exponential; MVU keeps state count small (10).
 * Later we can swap in smarter solvers without changing the UI contract.
 */

function satisfies(world: Set<StateId>, c: Constraint): boolean {
  switch (c.kind) {
    case "NOT_TOGETHER": {
      const hasA = world.has(c.a);
      const hasB = world.has(c.b);
      return !(hasA && hasB);
    }
    case "REQUIRES": {
      // If A is present, B must be present.
      if (!world.has(c.a)) return true;
      return world.has(c.b);
    }
    case "NEXT_REQUIRES": {
      // Temporal constraint: brute-force solver ignores (SAT solver handles with time-indexed vars)
      return true;
    }
    case "PERSIST": {
      // Temporal constraint: brute-force solver ignores (SAT solver handles with time-indexed vars)
      return true;
    }
    case "AT_MOST_K_OF_SET": {
      let count = 0;
      for (const s of c.set) if (world.has(s)) count++;
      return count <= c.k;
    }
    case "EXACTLY_K_OF_SET": {
      let count = 0;
      for (const s of c.set) if (world.has(s)) count++;
      return count === c.k;
    }
    default: {
      const _exhaustive: never = c;
      return _exhaustive;
    }
  }
}

function worldAllowed(world: Set<StateId>, constraints: Constraint[]): boolean {
  for (const c of constraints) if (!satisfies(world, c)) return false;
  return true;
}

function countAllowedWorlds(u: Universe): number {
  const states = u.states;
  const n = states.length;
  let count = 0;

  for (let mask = 0; mask < (1 << n); mask++) {
    const world = new Set<StateId>();
    for (let i = 0; i < n; i++) if (mask & (1 << i)) world.add(states[i]!);
    if (worldAllowed(world, u.constraints)) count++;
  }
  return count;
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

function buildRequiresGraph(constraints: Constraint[]): Map<StateId, StateId[]> {
  const g = new Map<StateId, StateId[]>();
  for (const c of constraints) {
    if (c.kind !== "REQUIRES") continue;
    const arr = g.get(c.a) ?? [];
    arr.push(c.b);
    g.set(c.a, arr);
  }
  return g;
}

function findRequiresPath(g: Map<StateId, StateId[]>, from: StateId, to: StateId, maxDepth = 10): StateId[] | null {
  if (from === to) return [from];
  const q: Array<{ node: StateId; path: StateId[] }> = [{ node: from, path: [from] }];
  const seen = new Set<StateId>([from]);
  while (q.length) {
    const { node, path } = q.shift()!;
    if (path.length > maxDepth) continue;
    for (const nxt of g.get(node) ?? []) {
      if (seen.has(nxt)) continue;
      const np = [...path, nxt];
      if (nxt === to) return np;
      seen.add(nxt);
      q.push({ node: nxt, path: np });
    }
  }
  return null;
}

export function analyzeUniverseBrute(u: Universe): Analysis {
  const states = u.states;
  const n = states.length;
  const t0 = nowMs();

  const possible = new Set<StateId>();
  const impossible = new Set<StateId>(states);
  const inevitable = new Set<StateId>(states);

  let witnessWorld: Set<StateId> | null = null;
  let allowedWorldCount = 0;

  // Enumerate all subsets (worlds)
  for (let mask = 0; mask < (1 << n); mask++) {
    const world = new Set<StateId>();
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) world.add(states[i]!);
    }

    if (!worldAllowed(world, u.constraints)) continue;

    allowedWorldCount++;
    if (!witnessWorld) witnessWorld = world;

    // Update possible/impossible
    for (const s of world) {
      possible.add(s);
      impossible.delete(s);
    }

    // Update inevitable: intersection over all allowed worlds
    for (const s of states) {
      if (!world.has(s)) inevitable.delete(s);
    }
  }

  // If no allowed worlds exist, everything becomes impossible & nothing inevitable
  if (allowedWorldCount === 0) {
    return {
      possible: new Set(),
      impossible: new Set(states),
      inevitable: new Set(),
      witnessWorld: null,
      reasons: new Map(),
      perf: { worlds: 1 << n, ms: nowMs() - t0 },
      tension: []
    };
  }

  const reasons = new Map<StateId, Reason>();
  const g = buildRequiresGraph(u.constraints);

  // Anchor: EXACTLY_K_OF_SET can force members when k == set size; can force absence when k == 0.
  for (const c of u.constraints) {
    if (c.kind === "EXACTLY_K_OF_SET") {
      if (c.k === c.set.length) {
        for (const s of c.set) if (inevitable.has(s)) reasons.set(s, { kind: "SET_RULE", rule: `|{${c.set.join(",")}}| = ${c.k}` });
      }
      if (c.k === 0) {
        // doesn't explain inevitability; it's an impossibility anchor—skip for now
      }
    }
  }

  // For each inevitable state, try to explain it by finding a chain from any state that is "pinned" by a set rule
  // or by itself if directly required by some other inevitable.
  const anchors = new Set<StateId>();
  for (const c of u.constraints) {
    if (c.kind === "EXACTLY_K_OF_SET" && c.k === c.set.length) for (const s of c.set) anchors.add(s);
  }

  for (const target of inevitable) {
    if (reasons.has(target)) continue;

    // Try from anchors first
    let explained = false;
    for (const a of anchors) {
      const path = findRequiresPath(g, a, target);
      if (path && path.length >= 2) {
        reasons.set(target, { kind: "REQUIRES_CHAIN", chain: path });
        explained = true;
        break;
      }
    }
    if (explained) continue;

    // Try from any other inevitable as a source (shows chain inside inevitables)
    for (const src of inevitable) {
      if (src === target) continue;
      const path = findRequiresPath(g, src, target);
      if (path && path.length >= 2) {
        reasons.set(target, { kind: "REQUIRES_CHAIN", chain: path });
        explained = true;
        break;
      }
    }

    if (!explained) reasons.set(target, { kind: "UNKNOWN" });
  }

  const baselineAllowed = allowedWorldCount; // already computed for all constraints
  const tension = u.constraints.map((c) => {
    const without = u.constraints.filter(x => x.id !== c.id);
    const allowedWithout = countAllowedWorlds({ states: u.states, constraints: without });
    const delta = Math.max(0, allowedWithout - baselineAllowed); // how many worlds this constraint removes
    return { id: c.id, label: labelConstraint(c), delta };
  }).sort((a,b) => b.delta - a.delta).slice(0, 5);

  const perf = { worlds: 1 << n, ms: nowMs() - t0 };
  return { possible, impossible, inevitable, witnessWorld, reasons, perf, tension };
}

export function hasAnyAllowedWorld(u: Universe): boolean {
  return analyzeUniverseBrute(u).witnessWorld !== null;
}

/**
 * Greedy normalization:
 * - If universe is contradictory (no allowed worlds), remove constraints from newest → oldest
 *   until at least one allowed world exists (or none left).
 * - Returns the kept constraints + final analysis.
 *
 * This is deliberately simple and reversible; later we can replace with MUS/MCS logic.
 */
export function normalizeConstraintsGreedy(u: Universe): {
  kept: Constraint[];
  removed: Constraint[];
} {
  const removed: Constraint[] = [];
  let kept = [...u.constraints];

  // Fast path
  if (hasAnyAllowedWorld({ states: u.states, constraints: kept })) {
    return { kept, removed };
  }

  // Remove newest first (constraints list is newest-first in UI)
  while (kept.length > 0 && !hasAnyAllowedWorld({ states: u.states, constraints: kept })) {
    const c = kept.shift()!;
    removed.push(c);
  }

  return { kept, removed };
}

export const analyzeUniverse = analyzeUniverseBrute;

