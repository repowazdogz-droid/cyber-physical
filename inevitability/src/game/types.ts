export type Goal = {
  inevitable?: string[];
  /** When true, inevitable set must equal goal.inevitable (e.g. Level 6 "exactly A and B") */
  inevitableExact?: boolean;
  impossible?: string[];
  possible?: string[];
  /** Level 10: win when allowedWorldCount > 0 after having been 0 */
  resolveParadox?: boolean;
  /** Level 11, 14, 20: exact counts */
  inevitableCount?: number;
  impossibleCount?: number;
  possibleCount?: number;
  /** Level 14: exactly N inevitable, M impossible, rest possible */
  possibleRest?: boolean;
  /** Level 19: all states inevitable */
  allInevitable?: boolean;
};

export type RuleTemplate =
  | { type: "NOT_TOGETHER"; label: string; fixedA?: string; fixedB?: string }
  | { type: "REQUIRES"; label: string; fixedA?: string; fixedB?: string }
  | { type: "AT_MOST_K"; label: string; fixedSet?: string[]; fixedK?: number }
  | { type: "EXACTLY_K"; label: string; fixedSet?: string[]; fixedK?: number };

export type Level = {
  id: number;
  name: string;
  description: string;
  states: string[];
  availableRules: RuleTemplate[];
  goal: Goal;
  par: number;
  hint?: string;
};

export type ConstraintKind = "NOT_TOGETHER" | "REQUIRES" | "AT_MOST_K_OF_SET" | "EXACTLY_K_OF_SET";

export type PlacedRule = {
  id: string;
  type: ConstraintKind;
  a?: string;
  b?: string;
  set?: string[];
  k?: number;
  label: string;
};

export type GameState = {
  screen: "title" | "select" | "game" | "complete";
  currentLevel: number;
  completedLevels: Map<number, { stars: number; rulesUsed: number }>;
  placedRules: PlacedRule[];
  levelCompletePayload?: { stars: number; rulesUsed: number };
};
