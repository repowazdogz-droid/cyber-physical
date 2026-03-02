import { describe, it, expect } from "vitest";
import { disputeGate, isConfidenceCappedByDispute } from "./dispute";

describe("dispute", () => {
  it("allows dispute when none exists for entry/session", () => {
    const gate = disputeGate(0);
    expect(gate.canDispute).toBe(true);
    expect(gate.alreadyDisputed).toBe(false);
  });

  it("blocks second dispute in same session", () => {
    const gate = disputeGate(1);
    expect(gate.canDispute).toBe(false);
    expect(gate.alreadyDisputed).toBe(true);
  });

  it("caps confidence when dispute rejected", () => {
    expect(isConfidenceCappedByDispute("REJECTED")).toBe(true);
    expect(isConfidenceCappedByDispute("UPHELD")).toBe(false);
    expect(isConfidenceCappedByDispute("PENDING")).toBe(false);
  });
});
