// spine/llm/modes/OmegaMeta.ts

import type { OmegaMode } from "./OmegaModes";
import type { OmegaViolation } from "./OmegaAudit";

export interface OmegaMeta {
  mode: OmegaMode;
  audit?: {
    ok: boolean;
    violations: OmegaViolation[];
  };
  retry?: {
    attempted: boolean;
    repaired: boolean;
  };
}




































