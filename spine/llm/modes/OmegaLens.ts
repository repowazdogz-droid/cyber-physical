// spine/llm/modes/OmegaLens.ts

import type { OmegaMode } from "./OmegaModes";
import type { OmegaViolation } from "./OmegaAudit";

export interface OmegaLens {
  systemPreamble: string;
  allowedSections: string[];
  forbiddenBehaviors: string[];
  violations: OmegaViolation[];
}

