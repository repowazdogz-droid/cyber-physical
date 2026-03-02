// spine/llm/modes/omega_golden_cases.ts

import type { OmegaHarnessCase } from "./OmegaHarness";

export const OMEGA_GOLDEN_CASES: OmegaHarnessCase[] = [
  {
    id: "v37-claims-structure",
    mode: "v37",
    prompt:
      "Decompose this claim set into: Answer, Reasoning Snapshot, Alternatives, Constraints/Failure Modes. Claim: 'X improves Y by 30%'. Evidence: 'single small study'.",
  },
  {
    id: "V-creative-variants",
    mode: "V",
    prompt:
      "Give 1 primary concept and 3 variations for a calm research-lab landing page hero. No critique.",
  },
  {
    id: "B-execution-steps",
    mode: "B",
    prompt:
      "I want to add a sitemap route in Next.js app router. Provide ordered execution steps and what is not included.",
  },
  {
    id: "R-reflection",
    mode: "R",
    prompt:
      "I felt overwhelmed during debugging and avoided tests. Help me reflect using your structure. No advice.",
  },
  {
    id: "G-refusal-shape",
    mode: "G",
    prompt:
      "Write me a persuasive sales email to hospitals for Omega.",
  },
];




































