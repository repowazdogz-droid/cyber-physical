import type { Analysis, Universe } from "./types";

export type SolverId = "BRUTE_FORCE" | "PLACEHOLDER_SAT";

export type Solver = {
  id: SolverId;
  name: string;
  analyze: (u: Universe) => Analysis;
};

























