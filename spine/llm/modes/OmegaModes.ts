// spine/llm/modes/OmegaModes.ts

export type OmegaMode =
  | "v37"   // reasoning & claims
  | "V"     // creative & visual
  | "B"     // build & execution
  | "R"     // reflection & learning
  | "G";    // guardrail & refusal

export const OMEGA_MODES: Record<OmegaMode, {
  label: string;
  description: string;
}> = {
  v37: { label: "Reasoning", description: "Claims & reasoning support" },
  V:   { label: "Creative",  description: "Exploration & variation" },
  B:   { label: "Build",     description: "Execution scaffolding" },
  R:   { label: "Reflect",   description: "Learning & reflection" },
  G:   { label: "Guardrail", description: "Boundary & refusal" },
};




































