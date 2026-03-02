import { analyze } from "../engine/solver";
import type { Constraint, Universe } from "../engine/types";
import type { Goal, PlacedRule } from "./types";

export function placedToConstraints(placed: PlacedRule[]): Constraint[] {
  return placed.map((p) => {
    const id = p.id;
    if (p.type === "NOT_TOGETHER" && p.a != null && p.b != null)
      return { id, kind: "NOT_TOGETHER" as const, a: p.a, b: p.b };
    if (p.type === "REQUIRES" && p.a != null && p.b != null)
      return { id, kind: "REQUIRES" as const, a: p.a, b: p.b };
    if (p.type === "AT_MOST_K_OF_SET" && p.set != null && p.k != null)
      return { id, kind: "AT_MOST_K_OF_SET" as const, set: p.set, k: p.k };
    if (p.type === "EXACTLY_K_OF_SET" && p.set != null && p.k != null)
      return { id, kind: "EXACTLY_K_OF_SET" as const, set: p.set, k: p.k };
    throw new Error(`Invalid placed rule: ${JSON.stringify(p)}`);
  });
}

export function buildUniverse(states: string[], placed: PlacedRule[]): Universe {
  return {
    states: [...states],
    constraints: placedToConstraints(placed),
  };
}

export function checkGoal(
  goal: Goal,
  analysis: { possible: Set<string>; impossible: Set<string>; inevitable: Set<string>; allowedWorldCount: number },
  states: string[],
  hadContradiction?: boolean
): boolean {
  if (goal.resolveParadox) {
    return hadContradiction === true && analysis.allowedWorldCount > 0;
  }
  if (goal.allInevitable) {
    return states.every((s) => analysis.inevitable.has(s));
  }
  if (goal.inevitableCount != null || goal.impossibleCount != null || goal.possibleCount != null) {
    const inv = goal.inevitableCount ?? 0;
    const imp = goal.impossibleCount ?? 0;
    const pos = goal.possibleCount ?? 0;
    if (analysis.inevitable.size !== inv) return false;
    if (analysis.impossible.size !== imp) return false;
    if (pos > 0 && analysis.possible.size !== pos) return false;
    return true;
  }
  if (goal.possibleRest && goal.inevitableCount != null && goal.impossibleCount != null) {
    const rest = states.length - goal.inevitableCount - goal.impossibleCount;
    const restStates = states.filter(
      (s) => !analysis.inevitable.has(s) && !analysis.impossible.has(s)
    );
    if (analysis.inevitable.size !== goal.inevitableCount) return false;
    if (analysis.impossible.size !== goal.impossibleCount) return false;
    return restStates.every((s) => analysis.possible.has(s)) && restStates.length === rest;
  }
  if (goal.inevitable?.length) {
    const required = new Set(goal.inevitable);
    for (const s of required) if (!analysis.inevitable.has(s)) return false;
    if (goal.inevitableExact && analysis.inevitable.size !== required.size) return false;
  }
  if (goal.impossible?.length) {
    for (const s of goal.impossible) if (!analysis.impossible.has(s)) return false;
  }
  if (goal.possible?.length) {
    for (const s of goal.possible) if (!analysis.possible.has(s)) return false;
  }
  const hasAny =
    (goal.inevitable?.length ?? 0) > 0 ||
    (goal.impossible?.length ?? 0) > 0 ||
    (goal.possible?.length ?? 0) > 0 ||
    goal.resolveParadox ||
    goal.allInevitable ||
    goal.inevitableCount != null ||
    goal.impossibleCount != null ||
    goal.possibleCount != null ||
    goal.possibleRest === true;
  return hasAny;
}

export { analyze };
