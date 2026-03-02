// spine/llm/modes/OmegaAudit.ts
import type { OmegaMode } from "./OmegaModes";
import { OMEGA_LENSES } from "./OmegaLenses";
import { omegaGIsWellFormed } from "./OmegaGShape";

export type OmegaViolation =
  | "DECISION_MADE"
  | "GOAL_INFERRED"
  | "ADVICE_GIVEN"
  | "PERSUASION"
  | "CONVERGENCE"
  | "JUDGMENT_LANGUAGE"
  | "AUTONOMY_SIGNAL"
  | "MODE_BLEED"
  | "SHAPE_INVALID";

export interface OmegaAuditResult {
  ok: boolean;
  violations: OmegaViolation[];
}

/**
 * Observation-only output audit.
 * This must be deterministic, cheap, and conservative.
 * It should never mutate output or trigger retries here (Block A2 does retries).
 */
export function auditOmegaOutput(mode: OmegaMode, text: string): OmegaAuditResult {
  const lens = OMEGA_LENSES[mode];
  const violations: OmegaViolation[] = [];

  const t = (text ?? "").toLowerCase();

  // Helper: word-boundary-ish match for common phrases/words
  const has = (re: RegExp) => re.test(t);

  // 1) Decisions / prescriptions (hard no in v37/B/R/V; allowed only as refusal in G)
  if (has(/\b(i (decide|recommend|suggest|advise)|you should|do this|best option|optimal|the answer is)\b/)) {
    violations.push("DECISION_MADE");
    violations.push("ADVICE_GIVEN");
  }

  // 2) Goal inference / priority setting (B/v37 should not infer)
  if (has(/\b(your goal is|you want to|you need to|priority is|the right move is)\b/)) {
    violations.push("GOAL_INFERRED");
  }

  // 3) Persuasion / pushiness
  if (has(/\b(trust me|you must|definitely|guaranteed|no doubt|obviously)\b/)) {
    violations.push("PERSUASION");
  }

  // 4) Convergence language (OMEGA-V must not converge)
  if (has(/\b(final(ize|ised|ized)|ship it|lock(ed)? in|this is the best|go with option)\b/)) {
    violations.push("CONVERGENCE");
  }

  // 5) Judgmental language (OMEGA-R and OMEGA-V especially)
  if (has(/\b(good|bad|wrong|right|shouldn't|lazy|stupid|brilliant)\b/)) {
    violations.push("JUDGMENT_LANGUAGE");
  }

  // 6) Autonomy signals / pretending agency
  if (has(/\b(i will take care of|i'll handle|i went ahead|i already did|i will now|i decided to)\b/)) {
    violations.push("AUTONOMY_SIGNAL");
  }

  // 7) Mode bleed (mentions of other modes in same output when not requested)
  // conservative: if it name-drops another Omega mode, flag it
  if (has(/\bomega-v\b|\bomega v37\b|\bomega-b\b|\bomega-r\b|\bomega-g\b/)) {
    violations.push("MODE_BLEED");
  }

  // 8) Shape validation for OMEGA-G
  if (mode === "G") {
    if (!omegaGIsWellFormed(text)) {
      violations.push("SHAPE_INVALID");
    }
  }

  // Filter to only violations the lens cares about (mechanical enforcement)
  const allowedSet = new Set(lens.violations ?? []);
  const filtered = violations.filter((v) => allowedSet.has(v));

  return {
    ok: filtered.length === 0,
    violations: filtered,
  };
}

