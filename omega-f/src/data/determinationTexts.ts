export type DetTextSection = {
  heading: string;
  // Keep content as an array of paragraphs for HTML + Plain reuse.
  paras: string[];
  // Optional bullets for sections like Basis, Limits, Boundary Conditions
  bullets?: string[];
};

export type DeterminationText = {
  // This should match the registry ID, e.g. "2026-01"
  id: string;

  // Page title h1 (often the system name)
  systemTitle: string;

  // Short determination statement (appears under "Determination")
  determination: string[];

  // Main sections
  sections: DetTextSection[];

  // Footer metadata
  docId: string; // e.g. "OMEGA-F-2026-01"
};

export const DETERMINATION_TEXTS: Record<string, DeterminationText> = {
  "2026-01": {
    id: "2026-01",
    systemTitle: "Fine-tuned frontier model with API access",
    determination: [
      "The system, as currently structured, is not governable.",
      "This determination reflects a structural condition. It does not assert intent, competence, or compliance status. It evaluates whether the system can observe, halt, and own consequences in proportion to its capacity for impact.",
    ],
    sections: [
      {
        heading: "Basis",
        paras: [],
        bullets: [
          "Information about downstream harm is primarily observable after deployment, through indirect signals, delayed reporting, or external actors.",
          "Authority to halt or materially constrain system behavior is distributed across multiple organizational functions and cannot be exercised unilaterally within harm-relevant timeframes.",
          "Fine-tuning and downstream integration introduce behavioral variation that is not fully inspectable prior to exposure.",
          "Reversal mechanisms rely on post-hoc intervention after human or institutional impact has already occurred.",
          "The parties bearing the cost of system failure are structurally separated from those authorizing deployment and configuration.",
        ],
      },
      {
        heading: "Limits",
        paras: [
          "This determination does not assess model capability, intent, alignment properties, or compliance with any specific regulatory regime. It does not evaluate individual deployments, fine-tunes, or usage contexts beyond their contribution to structural governability.",
          "No claims are made regarding likelihood of harm. This assessment addresses whether harm, if it occurs, can be detected, halted, and owned before compounding.",
        ],
      },
      {
        heading: "Boundary Conditions",
        paras: ["Changes that could materially affect this determination include:"],
        bullets: [
          "Demonstrated ability to detect downstream harm prior to user or institutional impact.",
          "Consolidation of halt authority with a single accountable role or function, exercisable without secondary approval.",
          "Verified reversal mechanisms capable of preventing persistence of harm after detection.",
          "Structural alignment between deployment authority and consequence-bearing parties.",
        ],
      },
      {
        heading: "Definition",
        paras: [
          "Governability, as used by OMEGA-F, refers to the structural capacity to observe, halt, and own consequences in proportion to impact velocity.",
          "A system is governable if information, authority, and consequence can be rapidly aligned under non-nominal conditions. A system is not governable if this alignment cannot be achieved before harm compounds.",
        ],
      },
      {
        heading: "Methodology",
        paras: [
          "This determination applies the OMEGA-F Assessment Protocol v1.0, evaluating accountability topology, latency to halt, reversal feasibility, and governance integrity under failure conditions.",
        ],
      },
      {
        heading: "Distribution",
        paras: [
          "This determination is recorded in the OMEGA-F public archive. Operators or affected parties may submit technical corrections or structural updates for review. Submissions are appended to the record.",
        ],
      },
    ],
    docId: "OMEGA-F-2026-01",
  },
};








