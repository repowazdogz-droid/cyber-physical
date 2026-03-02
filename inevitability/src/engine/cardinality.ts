import type { StateId } from "./types";

export function countInSet(world: Set<StateId>, set: StateId[]): number {
  let n = 0;
  for (const s of set) if (world.has(s)) n++;
  return n;
}

export function satisfiesCardinality(
  world: Set<StateId>,
  c: { kind: string; set: StateId[]; k: number }
): boolean {
  const count = countInSet(world, c.set);
  if (c.kind === "AT_MOST_K_OF_SET") return count <= c.k;
  if (c.kind === "EXACTLY_K_OF_SET") return count === c.k;
  return true;
}
