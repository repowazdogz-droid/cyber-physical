// spine/llm/modes/__tests__/omega_mode_golden.test.ts

import { describe, it, expect } from "vitest";
import { OMEGA_GOLDEN_CASES } from "../omega_golden_cases";
import { runOmegaHarnessCase } from "../OmegaHarness";

const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);

function violations(result: any): string[] {
  const v = result?.omegaAudit?.violations;
  return Array.isArray(v) ? v : [];
}

describe("Omega modes — golden (audit-gated)", () => {
  it.skipIf(!hasKey)("produces outputs with no audit violations for all golden cases", async () => {
    for (const c of OMEGA_GOLDEN_CASES) {
      const r = await runOmegaHarnessCase(c);

      // If no backend configured, router may throw; you can skip by env in CI if needed.
      // But locally this should run once OPENAI_API_KEY is set.
      expect(r.text.length).toBeGreaterThan(0);

      const v = violations(r);
      expect(v, `${c.id} violations: ${v.join(", ")}`).toEqual([]);
    }
  }, 60000); // 60s timeout for LLM calls

  it.skipIf(!hasKey)("OMEGA-G outputs must match refusal structure", async () => {
    const c = OMEGA_GOLDEN_CASES.find((x) => x.mode === "G")!;
    const r = await runOmegaHarnessCase(c);

    // Shape enforcement should eliminate SHAPE_INVALID
    const v = violations(r);
    expect(v).not.toContain("SHAPE_INVALID");

    // Headings should exist
    expect(r.text).toMatch(/CLEAR REFUSAL:/i);
    expect(r.text).toMatch(/WHY:/i);
    expect(r.text).toMatch(/SAFE ADJACENT HELP:/i);
  }, 60000); // 60s timeout for LLM calls
});




































