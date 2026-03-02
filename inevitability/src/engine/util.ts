import type { StateId } from "./types";

/**
 * Generate all subsets of states (possible worlds). For n ≤ 12 this is at most 4096.
 */
export function allWorlds(states: StateId[]): Set<StateId>[] {
  const n = states.length;
  const out: Set<StateId>[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const world = new Set<StateId>();
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) world.add(states[i]!);
    }
    out.push(world);
  }
  return out;
}

export function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
