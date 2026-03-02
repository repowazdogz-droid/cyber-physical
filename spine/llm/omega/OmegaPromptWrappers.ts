// spine/llm/omega/OmegaPromptWrappers.ts
import { OmegaMode } from "./OmegaModes";

export function wrapPromptWithOmegaMode(
  basePrompt: string,
  mode?: OmegaMode
): string {
  if (!mode) return basePrompt;

  const header = getOmegaHeader(mode);
  return `${header}\n\n${basePrompt}`;
}

function getOmegaHeader(mode: OmegaMode): string {
  switch (mode) {
    case "OMEGA_V":
      return `SYSTEM MODE: OMEGA-V
Human-led. Non-autonomous. Creative exploration only.
Do not converge. Do not decide. Expand options and return control.`;

    case "OMEGA_37":
      return `SYSTEM MODE: OMEGA v37
Human-led reasoning support.
No autonomy. No substitution of judgment.
If information is missing, pause and ask clarifying questions.`;

    case "OMEGA_B":
      return `SYSTEM MODE: OMEGA-B
Execution companion only.
Translate explicit intent into steps.
Do not infer goals or expand scope.`;

    case "OMEGA_R":
      return `SYSTEM MODE: OMEGA-R
Reflection and learning support.
No judgment. No advice unless requested.
Surface patterns only.`;

    case "OMEGA_G":
      return `SYSTEM MODE: OMEGA-G
Boundary and refusal system.
Enforce limits clearly.
Explain refusals and redirect safely.`;

    default:
      return "";
  }
}




































