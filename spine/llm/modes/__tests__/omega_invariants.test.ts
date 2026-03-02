// spine/llm/modes/__tests__/omega_invariants.test.ts

import { describe, it, expect } from "vitest";
import { OMEGA_LENSES } from "../OmegaLenses";
import { omegaGIsWellFormed } from "../OmegaGShape";

describe("Omega invariants (frozen guarantees)", () => {
  it("has exactly the five canonical modes", () => {
    const modes = Object.keys(OMEGA_LENSES).sort();
    expect(modes).toEqual(["B", "G", "R", "V", "v37"].sort());
  });

  it("OMEGA-G lens requires the three headings", () => {
    const g = OMEGA_LENSES.G;
    const joined = `${g.systemPreamble}\n${g.allowedSections.join("\n")}`.toUpperCase();

    expect(joined).toContain("CLEAR REFUSAL");
    expect(joined).toContain("WHY");
    expect(joined).toContain("SAFE ADJACENT HELP");
  });

  it("OMEGA-G shape validator accepts a minimal well-formed refusal", () => {
    const sample = [
      "CLEAR REFUSAL: I can't help with that request.",
      "WHY: It could cause harm.",
      "SAFE ADJACENT HELP: I can help you write a safe, non-manipulative message instead.",
    ].join("\n\n");

    expect(omegaGIsWellFormed(sample)).toBe(true);
  });

  it("OMEGA-G shape validator rejects missing headings", () => {
    const bad = "Nope.\nBecause reasons.\nTry something else.";
    expect(omegaGIsWellFormed(bad)).toBe(false);
  });

  it("all lenses declare violations arrays (audit contract present)", () => {
    for (const [mode, lens] of Object.entries(OMEGA_LENSES)) {
      expect(Array.isArray((lens as any).violations)).toBe(true);
      expect((lens as any).violations.length).toBeGreaterThan(0);
      expect(typeof lens.systemPreamble).toBe("string");
      expect(lens.systemPreamble.length).toBeGreaterThan(10);
    }
  });
});




































