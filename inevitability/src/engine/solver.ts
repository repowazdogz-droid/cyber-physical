import { satisfiesCardinality } from "./cardinality";
import type { Analysis, Constraint, StateId, Universe } from "./types";
import { allWorlds } from "./util";

function satisfies(world: Set<StateId>, c: Constraint): boolean {
  switch (c.kind) {
    case "NOT_TOGETHER": {
      const hasA = world.has(c.a);
      const hasB = world.has(c.b);
      return !(hasA && hasB);
    }
    case "REQUIRES": {
      if (!world.has(c.a)) return true;
      return world.has(c.b);
    }
    case "AT_MOST_K_OF_SET":
    case "EXACTLY_K_OF_SET":
      return satisfiesCardinality(world, c);
    default: {
      const _: never = c;
      return _;
    }
  }
}

function worldAllowed(world: Set<StateId>, constraints: Constraint[]): boolean {
  for (const c of constraints) if (!satisfies(world, c)) return false;
  return true;
}

/**
 * Analyze universe: classify each state as possible, impossible, or inevitable.
 * - INEVITABLE: appears in every allowed world
 * - IMPOSSIBLE: appears in no allowed world
 * - POSSIBLE: appears in at least one but not all allowed worlds
 */
export function analyze(universe: Universe): Analysis {
  const { states, constraints } = universe;
  const worlds = allWorlds(states);
  const allowed = worlds.filter((w) => worldAllowed(w, constraints));

  const possible = new Set<StateId>();
  const impossible = new Set<StateId>(states);
  const inevitable = new Set<StateId>(states);

  for (const world of allowed) {
    for (const s of world) {
      possible.add(s);
      impossible.delete(s);
    }
    for (const s of states) {
      if (!world.has(s)) inevitable.delete(s);
    }
  }

  if (allowed.length === 0) {
    return {
      possible: new Set(),
      impossible: new Set(states),
      inevitable: new Set(),
      allowedWorldCount: 0,
    };
  }

  return {
    possible,
    impossible,
    inevitable,
    allowedWorldCount: allowed.length,
  };
}
