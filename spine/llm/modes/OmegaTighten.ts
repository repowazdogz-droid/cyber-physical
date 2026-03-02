// spine/llm/modes/OmegaTighten.ts
import type { OmegaMode } from "./OmegaModes";
import type { OmegaViolation } from "./OmegaAudit";

export function buildTightenInstruction(mode: OmegaMode, violations: OmegaViolation[]): string {
  const v = violations.join(", ");

  // Keep this short + mechanical. No extra prose.
  return [
    "OMEGA LENS REPAIR PASS (ONE RETRY ONLY).",
    `Mode: ${mode}.`,
    `Violations detected: ${v}.`,
    "Repair rules:",
    "- Remove any decisions, prescriptions, persuasion, or implied autonomy.",
    "- Do not infer goals or priorities.",
    "- Keep only the allowed structure for this mode.",
    "- No additional sections beyond the mode structure.",
    "Return the repaired output only.",
  ].join("\n");
}




































