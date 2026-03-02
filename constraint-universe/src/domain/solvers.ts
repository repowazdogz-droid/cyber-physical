import type { Solver } from "./solver";
import { analyzeUniverseBrute } from "./engine";
import { analyzeUniverseSat } from "./solverSat";

export const SOLVERS: Solver[] = [
  { id: "BRUTE_FORCE", name: "Brute force (2^N)", analyze: analyzeUniverseBrute },
  { id: "PLACEHOLDER_SAT", name: "SAT (logic-solver)", analyze: analyzeUniverseSat }
];

