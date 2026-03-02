// spine/llm/modes/__tests__/omega_g_shape.test.ts

import { describe, it, expect } from "vitest";
import { omegaGIsWellFormed, parseOmegaGSections } from "../OmegaGShape";
import { auditOmegaOutput } from "../OmegaAudit";

describe("OMEGA-G shape", () => {
  it("accepts well-formed refusal structure", () => {
    const ok = `
CLEAR REFUSAL: I can't help with that request.
WHY: It could enable harmful misuse.
SAFE ADJACENT HELP: I can help you with a safe alternative approach or high-level guidance.
`;
    expect(omegaGIsWellFormed(ok)).toBe(true);
  });

  it("parses sections correctly", () => {
    const text = `
CLEAR REFUSAL: I cannot assist with this.
WHY: This request violates safety guidelines.
SAFE ADJACENT HELP: I can provide general information about safer alternatives.
`;
    const parsed = parseOmegaGSections(text);
    expect(parsed).not.toBeNull();
    expect(parsed?.refusal).toBe("I cannot assist with this.");
    expect(parsed?.why).toBe("This request violates safety guidelines.");
    expect(parsed?.safeHelp).toBe("I can provide general information about safer alternatives.");
  });

  it("accepts REFUSAL as alternative heading", () => {
    const ok = `
REFUSAL: I cannot help with that.
WHY: It would be unsafe.
SAFE ADJACENT HELP: Here's what I can do instead.
`;
    expect(omegaGIsWellFormed(ok)).toBe(true);
  });

  it("accepts SAFE HELP as alternative heading", () => {
    const ok = `
CLEAR REFUSAL: I cannot assist.
WHY: This violates boundaries.
SAFE HELP: I can offer alternative guidance.
`;
    expect(omegaGIsWellFormed(ok)).toBe(true);
  });

  it("rejects missing headings", () => {
    const bad = `I can't help. Here's why...`;
    expect(omegaGIsWellFormed(bad)).toBe(false);
  });

  it("rejects refusal with multiple sentences", () => {
    const bad = `
CLEAR REFUSAL: I cannot help. This is not allowed.
WHY: It violates safety.
SAFE ADJACENT HELP: I can provide alternatives.
`;
    expect(omegaGIsWellFormed(bad)).toBe(false);
  });

  it("rejects empty sections", () => {
    const bad = `
CLEAR REFUSAL: I cannot help.
WHY: 
SAFE ADJACENT HELP: Alternatives.
`;
    expect(omegaGIsWellFormed(bad)).toBe(false);
  });

  it("audit marks SHAPE_INVALID for mode G", () => {
    const bad = `I can't help.`;
    const audit = auditOmegaOutput("G", bad);
    expect(audit.ok).toBe(false);
    expect(audit.violations).toContain("SHAPE_INVALID");
  });

  it("audit passes for well-formed G output", () => {
    const good = `
CLEAR REFUSAL: I cannot assist with that request.
WHY: It could enable harmful misuse.
SAFE ADJACENT HELP: I can help you with a safe alternative approach.
`;
    const audit = auditOmegaOutput("G", good);
    expect(audit.ok).toBe(true);
    expect(audit.violations).not.toContain("SHAPE_INVALID");
  });

  it("audit does not check shape for non-G modes", () => {
    const text = `I can't help.`;
    const audit = auditOmegaOutput("v37", text);
    // Should not have SHAPE_INVALID violation for non-G modes
    expect(audit.violations).not.toContain("SHAPE_INVALID");
  });
});




































