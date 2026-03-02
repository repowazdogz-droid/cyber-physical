import type { Level } from "./types";

function rule(
  type: Level["availableRules"][0]["type"],
  label: string,
  opts?: { fixedA?: string; fixedB?: string; fixedSet?: string[]; fixedK?: number }
): Level["availableRules"][0] {
  if (type === "NOT_TOGETHER") return { type: "NOT_TOGETHER", label, fixedA: opts?.fixedA, fixedB: opts?.fixedB };
  if (type === "REQUIRES") return { type: "REQUIRES", label, fixedA: opts?.fixedA, fixedB: opts?.fixedB };
  if (type === "AT_MOST_K") return { type: "AT_MOST_K", label, fixedSet: opts?.fixedSet, fixedK: opts?.fixedK };
  return { type: "EXACTLY_K", label, fixedSet: opts?.fixedSet, fixedK: opts?.fixedK };
}

function repeat<T>(t: T, n: number): T[] {
  return Array.from({ length: n }, () => t);
}

export const LEVELS: Level[] = [
  // ——— Chapter 1: Foundations (1–5) ———
  {
    id: 1,
    name: "First Light",
    description: "Some things are meant to be.",
    states: ["A", "B"],
    availableRules: [rule("EXACTLY_K", "Both must exist", { fixedSet: ["A", "B"], fixedK: 2 })],
    goal: { inevitable: ["A"] },
    par: 1,
  },
  {
    id: 2,
    name: "Exclusion",
    description: "Not everything can coexist.",
    states: ["A", "B", "C"],
    availableRules: repeat(rule("NOT_TOGETHER", "Can't coexist"), 2),
    goal: { impossible: ["A"] },
    par: 1,
  },
  {
    id: 3,
    name: "Dependence",
    description: "Some things pull others into existence.",
    states: ["A", "B", "C"],
    availableRules: repeat(rule("REQUIRES", "A needs B"), 2),
    goal: { inevitable: ["C"] },
    par: 2,
    hint: "If everything needs C...",
  },
  {
    id: 4,
    name: "Balance",
    description: "Precision means knowing what to leave alone.",
    states: ["A", "B", "C", "D"],
    availableRules: [
      rule("EXACTLY_K", "Exactly 2 of these", { fixedSet: ["A", "B", "C", "D"], fixedK: 2 }),
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 2),
    ],
    goal: { possible: ["A"], impossible: ["B"] },
    par: 2,
  },
  {
    id: 5,
    name: "Chain",
    description: "One thing leads to another. And another.",
    states: ["A", "B", "C", "D"],
    availableRules: [
      ...repeat(rule("REQUIRES", "A needs B"), 3),
      rule("EXACTLY_K", "Exactly 1 of these", { fixedSet: ["A", "B", "C", "D"], fixedK: 1 }),
    ],
    goal: { inevitable: ["D"] },
    par: 3,
    hint: "Build a chain of needs.",
  },
  // ——— Chapter 2: Tension (6–10) ———
  {
    id: 6,
    name: "Crowded",
    description: "In a crowded universe, limits create certainty.",
    states: ["A", "B", "C", "D", "E"],
    availableRules: [
      rule("AT_MOST_K", "At most 2 of these", { fixedK: 2 }),
      ...repeat(rule("REQUIRES", "A needs B"), 2),
      rule("NOT_TOGETHER", "Can't coexist"),
    ],
    goal: { inevitable: ["A", "B"], inevitableExact: true },
    par: 3,
  },
  {
    id: 7,
    name: "Sacrifice",
    description: "To guarantee one thing, you must lose another.",
    states: ["A", "B", "C", "D", "E"],
    availableRules: [
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 2),
      ...repeat(rule("REQUIRES", "A needs B"), 2),
      rule("EXACTLY_K", "Exactly 2 of these", { fixedSet: ["A", "B", "C", "D", "E"], fixedK: 2 }),
    ],
    goal: { inevitable: ["C"], impossible: ["E"] },
    par: 3,
  },
  {
    id: 8,
    name: "Cascade",
    description: "One certainty creates many.",
    states: ["A", "B", "C", "D", "E", "F"],
    availableRules: [
      ...repeat(rule("REQUIRES", "A needs B"), 4),
      rule("EXACTLY_K", "Exactly 1 of these", { fixedSet: ["A", "B", "C", "D", "E", "F"], fixedK: 1 }),
    ],
    goal: { inevitable: ["D", "E", "F"] },
    par: 4,
  },
  {
    id: 9,
    name: "Pressure",
    description: "Enough pressure and only one thing survives.",
    states: ["A", "B", "C", "D", "E"],
    availableRules: [
      rule("AT_MOST_K", "At most 1 of these", { fixedK: 1 }),
      rule("AT_MOST_K", "At most 2 of these", { fixedK: 2 }),
      ...repeat(rule("REQUIRES", "A needs B"), 2),
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 2),
    ],
    goal: { inevitable: ["A"], impossible: ["B", "C", "D", "E"] },
    par: 4,
  },
  {
    id: 10,
    name: "Paradox",
    description: "Sometimes the rules themselves are the problem.",
    states: ["A", "B", "C", "D"],
    availableRules: [
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 3),
      ...repeat(rule("REQUIRES", "A needs B"), 2),
      rule("EXACTLY_K", "Exactly 2 of these", { fixedSet: ["A", "B", "C", "D"], fixedK: 2 }),
    ],
    goal: { resolveParadox: true },
    par: 4,
  },
  // ——— Chapter 3: Mastery (11–15) ———
  {
    id: 11,
    name: "Partition",
    description: "Divide the universe in two.",
    states: ["A", "B", "C", "D", "E", "F"],
    availableRules: [
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 3),
      rule("EXACTLY_K", "Exactly 3 of these", { fixedSet: ["A", "B", "C", "D", "E", "F"], fixedK: 3 }),
      rule("EXACTLY_K", "Exactly 2 of these", { fixedK: 2 }),
    ],
    goal: { inevitableCount: 3, impossibleCount: 3 },
    par: 4,
  },
  {
    id: 12,
    name: "Symmetry",
    description: "Mirror images in the logic.",
    states: ["A", "B", "C", "D", "E", "F"],
    availableRules: [
      ...repeat(rule("REQUIRES", "A needs B"), 4),
      rule("AT_MOST_K", "At most 2 of these", { fixedK: 2 }),
    ],
    goal: { inevitable: ["A", "D"], impossible: ["B", "E"], possible: ["C", "F"] },
    par: 5,
  },
  {
    id: 13,
    name: "Network",
    description: "Everything connects. Find the path.",
    states: ["A", "B", "C", "D", "E", "F", "G"],
    availableRules: [
      ...repeat(rule("REQUIRES", "A needs B"), 5),
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 2),
      rule("EXACTLY_K", "Exactly 1 of these", { fixedSet: ["A", "B", "C", "D", "E", "F", "G"], fixedK: 1 }),
    ],
    goal: { inevitable: ["G"] },
    par: 5,
  },
  {
    id: 14,
    name: "Conservation",
    description: "What is gained must be balanced by what is lost.",
    states: ["A", "B", "C", "D", "E", "F", "G", "H"],
    availableRules: [
      rule("EXACTLY_K", "Exactly 4 of these", { fixedSet: ["A", "B", "C", "D", "E", "F", "G", "H"], fixedK: 4 }),
      rule("EXACTLY_K", "Exactly 2 of these", { fixedK: 2 }),
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 3),
      ...repeat(rule("REQUIRES", "A needs B"), 2),
    ],
    goal: { inevitableCount: 4, impossibleCount: 2, possibleRest: true },
    par: 6,
  },
  {
    id: 15,
    name: "Architect",
    description: "You are the architect now.",
    states: ["A", "B", "C", "D", "E", "F", "G", "H"],
    availableRules: [
      ...repeat(rule("NOT_TOGETHER", "Can't coexist"), 2),
      ...repeat(rule("REQUIRES", "A needs B"), 2),
      rule("AT_MOST_K", "At most 4 of these", { fixedK: 4 }),
      rule("EXACTLY_K", "Exactly 4 of these", { fixedK: 4 }),
    ],
    goal: { inevitable: ["A", "C", "E", "G"], impossible: ["B", "D", "F", "H"] },
    par: 6,
  },
  // ——— Chapter 4: Free Play (16–20) ———
  {
    id: 16,
    name: "Sandbox (Small)",
    description: "No goal. Just rules and reality.",
    states: ["A", "B", "C", "D", "E", "F"],
    availableRules: [
      rule("NOT_TOGETHER", "Can't coexist"),
      rule("REQUIRES", "A needs B"),
      rule("AT_MOST_K", "At most 2 of these", { fixedK: 2 }),
      rule("EXACTLY_K", "Exactly 3 of these", { fixedK: 3 }),
    ],
    goal: {},
    par: 0,
  },
  {
    id: 17,
    name: "Sandbox (Medium)",
    description: "A bigger canvas.",
    states: ["A", "B", "C", "D", "E", "F", "G", "H"],
    availableRules: [
      rule("NOT_TOGETHER", "Can't coexist"),
      rule("REQUIRES", "A needs B"),
      rule("AT_MOST_K", "At most 3 of these", { fixedK: 3 }),
      rule("EXACTLY_K", "Exactly 4 of these", { fixedK: 4 }),
    ],
    goal: {},
    par: 0,
  },
  {
    id: 18,
    name: "Sandbox (Large)",
    description: "How much certainty can you create?",
    states: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    availableRules: [
      rule("NOT_TOGETHER", "Can't coexist"),
      rule("REQUIRES", "A needs B"),
      rule("AT_MOST_K", "At most 5 of these", { fixedK: 5 }),
      rule("EXACTLY_K", "Exactly 5 of these", { fixedK: 5 }),
    ],
    goal: {},
    par: 0,
  },
  {
    id: 19,
    name: "Challenge: Minimal",
    description: "Elegance is saying the most with the least.",
    states: ["A", "B", "C", "D", "E", "F", "G", "H"],
    availableRules: [
      rule("NOT_TOGETHER", "Can't coexist"),
      rule("REQUIRES", "A needs B"),
      rule("AT_MOST_K", "At most 8 of these", { fixedK: 8 }),
      rule("EXACTLY_K", "All of these", { fixedSet: ["A", "B", "C", "D", "E", "F", "G", "H"], fixedK: 8 }),
    ],
    goal: { allInevitable: true },
    par: 1,
  },
  {
    id: 20,
    name: "Challenge: Impossible",
    description: "The final puzzle. Good luck.",
    states: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    availableRules: [
      rule("NOT_TOGETHER", "Can't coexist"),
      rule("REQUIRES", "A needs B"),
      rule("AT_MOST_K", "At most 5 of these", { fixedK: 5 }),
      rule("EXACTLY_K", "Exactly 5 of these", { fixedK: 5 }),
    ],
    goal: { inevitableCount: 5, impossibleCount: 3, possibleCount: 2 },
    par: 7,
  },
];
