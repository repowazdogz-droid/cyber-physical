// spine/llm/modes/OmegaGShape.ts
export type OmegaGSections = {
  refusal: string;
  why: string;
  safeHelp: string;
};

const REFUSAL_RE = /^\s*(CLEAR REFUSAL|REFUSAL)\s*:\s*(.+)$/im;
const WHY_RE = /^\s*(WHY)\s*:\s*(.+)$/im;
const SAFE_RE = /^\s*(SAFE ADJACENT HELP|SAFE HELP|ALTERNATIVE)\s*:\s*(.+)$/im;

export function parseOmegaGSections(text: string): OmegaGSections | null {
  const refusal = text.match(REFUSAL_RE)?.[2]?.trim();
  const why = text.match(WHY_RE)?.[2]?.trim();
  const safeHelp = text.match(SAFE_RE)?.[2]?.trim();
  if (!refusal || !why || !safeHelp) return null;
  return { refusal, why, safeHelp };
}

export function omegaGIsWellFormed(text: string): boolean {
  const parsed = parseOmegaGSections(text);
  if (!parsed) return false;

  // Refusal must be one sentence (simple heuristic)
  const refusalSentences = parsed.refusal.split(/[.!?]+/).filter(Boolean);
  if (refusalSentences.length !== 1) return false;

  // Keep it non-empty and not huge
  if (parsed.why.length < 4 || parsed.safeHelp.length < 4) return false;

  return true;
}




































