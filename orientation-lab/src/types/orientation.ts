export type Id = string;

export type JudgmentType =
  | "definition"
  | "measurement"
  | "threshold"
  | "tradeoff"
  | "authority"
  | "timing"
  | "values";

export type Model = {
  id: Id;
  name: string; // e.g. "Ops view", "Safety view", "Finance view"
  claim: string; // what this model says is happening
  scope: string; // what it covers / doesn't
};

export type Assumption = {
  id: Id;
  text: string; // explicit statement
  status: "given" | "contested" | "unknown";
  owner?: string; // optional: who can validate it (a role, not a person)
};

export type Disagreement = {
  id: Id;
  topic: string; // what people disagree about
  parties?: string; // roles/teams, not individuals
  whatWouldChangeMind?: string; // what evidence/condition would resolve it
};

export type Unknown = {
  id: Id;
  question: string; // what we don't know yet
  impact: "low" | "medium" | "high";
  horizon?: "hours" | "days" | "weeks" | "months" | "unknown"; // when it may become knowable
  owner?: string; // who can reduce it (role/team)
};

export type OrientationState = {
  title: string;
  context: string; // brief, neutral
  models: Model[];
  assumptions: Assumption[];
  disagreements: Disagreement[];
  unknowns: Unknown[];
  judgments: JudgmentType[];
  updatedAt: number;
};

