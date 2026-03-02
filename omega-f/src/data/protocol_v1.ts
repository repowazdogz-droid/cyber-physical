export const PROTOCOL_V1 = {
  version: "1.0",
  scope:
    "This protocol specifies how OMEGA-F produces structural governability determinations. It defines terms, required diagnostics, and output discipline. It does not provide recommendations, certification, or policy prescription.",
  definitions: [
    {
      term: "Governability",
      def:
        "The structural capacity to observe, halt, and own consequences in proportion to impact velocity under non-nominal conditions.",
    },
    {
      term: "Accountability topology",
      def:
        "The arrangement of information, authority, and consequence across roles and functions. Fragmentation increases failure probability.",
    },
    {
      term: "Harm-to-halt ratio",
      def:
        "Comparison between harm latency and the combined latency to detect, decide, and execute a halt or reversal.",
    },
  ],
  blades: [
    { id: "F-A", desc: "Accountability topology (information–power–consequence alignment)" },
    { id: "F-L", desc: "Latency & reversal audit (harm-to-halt; rollback feasibility)" },
    { id: "F-G", desc: "Governance integrity (control vs theater; triggerability)" },
    { id: "F-P", desc: "Drift signals (language patterns that thin responsibility)" },
  ],
  procedure: [
    "Define the system boundary and operating context (what is in scope; what is out).",
    "Run all blades (F-A, F-L, F-G, F-P) against the system boundary.",
    "Separate claims into OBSERVED, INFERRED, and UNKNOWN. Unknowns must state required evidence.",
    "Identify irreversibility points: where correction arrives after consequential human impact.",
    "Issue a determination as a structural condition (governable / not governable as structured).",
    "Publish limits, boundary conditions for reassessment, and distribution/record rules.",
  ],
  revisions: [
    { version: "1.0", date: "05 Jan 2026", note: "Initial publication." },
  ],
} as const;

