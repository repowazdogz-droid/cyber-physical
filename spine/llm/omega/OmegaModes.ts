// spine/llm/omega/OmegaModes.ts

export type OmegaMode =
  | "OMEGA_V"    // Creative / visual
  | "OMEGA_37"   // Reasoning & claims
  | "OMEGA_B"    // Build & execution
  | "OMEGA_R"    // Reflection & learning
  | "OMEGA_G";   // Guardrail & refusal

export const OMEGA_MODE_LABELS: Record<OmegaMode, string> = {
  OMEGA_V: "OMEGA-V (Creative & Visual)",
  OMEGA_37: "OMEGA v37 (Reasoning & Claims)",
  OMEGA_B: "OMEGA-B (Build & Execution)",
  OMEGA_R: "OMEGA-R (Reflection & Learning)",
  OMEGA_G: "OMEGA-G (Guardrail & Boundary)",
};




































