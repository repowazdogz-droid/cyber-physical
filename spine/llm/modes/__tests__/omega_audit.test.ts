// spine/llm/modes/__tests__/omega_audit.test.ts

import { describe, it, expect } from "vitest";
import { auditOmegaOutput } from "../OmegaAudit";

describe("Omega audit", () => {
  it("flags decisions in v37", () => {
    const r = auditOmegaOutput("v37", "You should do X. The best option is Y.");
    expect(r.ok).toBe(false);
    expect(r.violations.length).toBeGreaterThan(0);
    expect(r.violations).toContain("DECISION_MADE");
    expect(r.violations).toContain("ADVICE_GIVEN");
  });

  it("does not block output in G for refusal-like text (still flags autonomy)", () => {
    const r = auditOmegaOutput("G", "I will take care of it.");
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("AUTONOMY_SIGNAL");
  });

  it("flags goal inference in B mode", () => {
    const r = auditOmegaOutput("B", "Your goal is to complete this task.");
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("GOAL_INFERRED");
  });

  it("flags convergence in V mode", () => {
    const r = auditOmegaOutput("V", "This is the best option. Ship it!");
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("CONVERGENCE");
  });

  it("flags judgment language in R mode", () => {
    const r = auditOmegaOutput("R", "That was a bad decision.");
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("JUDGMENT_LANGUAGE");
  });

  it("flags persuasion in v37 mode", () => {
    const r = auditOmegaOutput("v37", "Trust me, this is definitely the right choice.");
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("PERSUASION");
  });

  it("flags mode bleed", () => {
    const r = auditOmegaOutput("v37", "This is similar to what OMEGA-V would do.");
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("MODE_BLEED");
  });

  it("returns ok for clean output", () => {
    const r = auditOmegaOutput("v37", "Here are some observations about the kernel run.");
    expect(r.ok).toBe(true);
    expect(r.violations.length).toBe(0);
  });

  it("filters violations based on mode-specific allowed set", () => {
    // G mode only flags AUTONOMY_SIGNAL and MODE_BLEED
    const r = auditOmegaOutput("G", "You should do this. I will handle it.");
    expect(r.ok).toBe(false);
    // Should contain AUTONOMY_SIGNAL but not DECISION_MADE (G doesn't care about decisions)
    expect(r.violations).toContain("AUTONOMY_SIGNAL");
    expect(r.violations).not.toContain("DECISION_MADE");
  });
});




































