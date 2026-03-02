export type StateId = string;

export type Constraint =
  | { id: string; kind: "NOT_TOGETHER"; a: StateId; b: StateId }
  | { id: string; kind: "REQUIRES"; a: StateId; b: StateId }
  | { id: string; kind: "NEXT_REQUIRES"; a: StateId; b: StateId }
  | { id: string; kind: "PERSIST"; s: StateId }
  | { id: string; kind: "AT_MOST_K_OF_SET"; set: StateId[]; k: number }
  | { id: string; kind: "EXACTLY_K_OF_SET"; set: StateId[]; k: number };

export type Universe = {
  states: StateId[];
  constraints: Constraint[];
  horizon?: number; // T >= 0, default 0 (static)
};

export type Status = "POSSIBLE" | "IMPOSSIBLE" | "INEVITABLE";

export type Analysis = {
  possible: Set<StateId>;
  impossible: Set<StateId>;
  inevitable: Set<StateId>;
  witnessWorld: Set<StateId> | null;
  reasons?: Map<StateId, Reason>;
  perf?: { worlds: number; ms: number };
  tension?: Array<{ id: string; label: string; delta: number }>;
  fixes?: { options: Array<{ constraintIds: string[]; pretty: string[] }> };
  witnesses?: Map<StateId, Set<StateId>>;
  trajectory?: Array<Set<StateId>>; // worlds at t=0..T for a witness model
  temporalNote?: string;           // e.g. "temporal: SAT-only verification"
};

export type Reason =
  | { kind: "REQUIRES_CHAIN"; chain: StateId[] }           // e.g. A -> B -> C
  | { kind: "SET_RULE"; rule: string }                    // textual anchor
  | { kind: "UNSAT_CORES"; goal: "INEVITABLE" | "IMPOSSIBLE"; state: StateId; cores: Array<{ constraintIds: string[]; pretty: string[] }> }
  | { kind: "UNKNOWN" };

export type UniverseId = "A" | "B";

export type ConstraintFrame = {
  t: number;
  constraints: Constraint[];
  label?: string;
};

