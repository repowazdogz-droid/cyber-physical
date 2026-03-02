export type StateId = string;

export type Constraint =
  | { id: string; kind: "NOT_TOGETHER"; a: StateId; b: StateId }
  | { id: string; kind: "REQUIRES"; a: StateId; b: StateId }
  | { id: string; kind: "AT_MOST_K_OF_SET"; set: StateId[]; k: number }
  | { id: string; kind: "EXACTLY_K_OF_SET"; set: StateId[]; k: number };

export type Universe = {
  states: StateId[];
  constraints: Constraint[];
};

export type Analysis = {
  possible: Set<StateId>;
  impossible: Set<StateId>;
  inevitable: Set<StateId>;
  allowedWorldCount: number;
};
