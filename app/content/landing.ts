/**
 * CURSOR BLOCK 2 — FINAL LANDING-PAGE COPY (WORD-LOCKED)
 * 
 * This file contains publication-ready copy. Do not paraphrase, embellish, or compress.
 * All components must read from this file only.
 */

/**
 * Omega-RC GPT Store URL (single source of truth)
 * Set to empty string until Omega-RC is published.
 */
export const OMEGA_RC_URL = "";

/**
 * Omega-RC publication status
 * Set to true when Omega-RC is live in GPT Store.
 */
export const OMEGA_RC_LIVE = false;

/**
 * Safe check: Omega-RC is live AND has a valid HTTPS URL
 * Prevents accidental activation with partial/invalid URLs.
 */
export const OMEGA_RC_IS_LIVE =
  Boolean(OMEGA_RC_LIVE) && typeof OMEGA_RC_URL === "string" && OMEGA_RC_URL.startsWith("https://");

// To publish Omega-RC:
// 1) Set OMEGA_RC_URL to the GPT Store URL (https://...)
// 2) Set OMEGA_RC_LIVE = true

export const LANDING_COPY = {
  hero: {
    title: "OMEGA",
    subtitle: "Human-led cognitive infrastructure",
    description: `Clarity, reasoning, and simplification for complex technical domains —
without autonomy, persuasion, or decision substitution.`,
    note: "Human judgment remains sovereign.",
    actions: {
      tryOmegaRc: "Try Omega-RC (GPT Store)",
      contact: "Contact"
    }
  },

  whatItDoes: {
    title: "WHAT OMEGA DOES",
    intro: "OMEGA is a reasoning scaffold, not a generative assistant.",
    supports: [
      "Decompose complex systems, claims, and arguments",
      "Separate evidence, assumptions, and unknowns",
      "Simplify without loss of technical meaning",
      "Maintain epistemic integrity under uncertainty",
      "Translate across disciplines (engineering ↔ clinical ↔ research)",
      "Work in an ND-friendly way without cognitive overload"
    ],
    conclusion: "OMEGA does not produce answers.\nIt provides structure so humans can reason more clearly."
  },

  whatItIsNot: {
    title: "WHAT OMEGA IS NOT",
    intro: "OMEGA is deliberately not:",
    nots: [
      "Autonomous",
      "Agentic",
      "A decision-maker",
      "A replacement for expertise",
      "A persuasion or optimisation engine",
      "A \"do it for me\" system"
    ],
    conclusion: "Human judgment remains in control at all times."
  },

  products: {
    title: "PRODUCTS",
    omegaRc: {
      name: "Omega-RC (Public)",
      subtitle: "Reasoning hygiene for public information.",
      supports: [
        "Evaluate claims in screenshots, charts, headlines, and posts",
        "Surface uncertainty, overreach, and missing evidence",
        "Explain why a claim is weak or strong",
        "Add no conclusions and make no decisions"
      ],
      action: "Open in GPT Store"
    },
    omega: {
      name: "Omega (Private / Full Spine)",
      subtitle: "A personal cognitive infrastructure for deep work.",
      usedFor: [
        "Research reasoning",
        "Systems and architecture thinking",
        "Robotics and simulation conceptualisation",
        "Clinical and engineering translation",
        "Teaching, learning, and simplification",
        "Creative and technical synthesis"
      ],
      access: "Private — by contact only"
    }
  },

  demos: {
    title: "LIVE DEMONSTRATIONS (ZERO-RISK)",
    subtitle: "How Omega behaves — not what it \"can do.\"",
    intro: "All demonstrations are safe by design.",
    examples: [
      "Robotics abstract → claim decomposition",
      "Medical figure → evidence boundary analysis",
      "Public chart → overreach detection"
    ],
    label: "Pre-verified demonstration of Omega's reasoning constraints.",
    sandbox: {
      title: "Optional sandbox (strictly bounded):",
      rules: [
        "Maximum 500 characters",
        "Text only",
        "Output limited to:",
        "Claims",
        "Evidence",
        "Unknowns",
        "No questions",
        "No conclusions",
        "No advice"
      ],
      note: "This demonstration shows structure, not intelligence."
    }
  },

  domainAgnostic: {
    title: "DOMAIN-AGNOSTIC BY DESIGN",
    intro: "OMEGA is domain-agnostic at its core.",
    doesNotEmbed: [
      "Field-specific dogma",
      "Hidden optimisation targets",
      "Institutional bias"
    ],
    provides: [
      "A stable reasoning spine",
      "Explicit uncertainty handling",
      "Evidence–claim alignment",
      "Constraint-aware simplification"
    ],
    note: "Optional domain lenses (terminology and examples only) may be layered later\nwithout changing the core system."
  },

  usedIn: {
    title: "WHERE THIS IS USED",
    intro: "OMEGA is used in serious technical contexts, including:",
    contexts: [
      "Robotics and cybernetics",
      "Simulation and digital twins",
      "XR and spatial computing",
      "Engineering biology",
      "Clinical robotics and health technology",
      "AI safety and alignment research",
      "Systems design and architecture",
      "Interdisciplinary research teams"
    ]
  },

  philosophy: {
    title: "PHILOSOPHY",
    mostAi: [
      "speed",
      "output",
      "persuasion"
    ],
    omega: [
      "judgment quality",
      "clarity",
      "human control"
    ],
    conclusion: "This is intentional."
  },

  about: {
    title: "ABOUT",
    intro: "OMEGA was built to support human reasoning — not replace it.",
    priorities: [
      "Epistemic honesty",
      "Safety without brittleness",
      "ND-friendly interaction",
      "Long-term alignment over short-term performance"
    ]
  },

  contact: {
    title: "CONTACT",
    intro: "For private, research, or institutional use:",
    email: "[contact email]",
    prompt: "Optional message prompt:\n\"What kind of work are you doing?\"",
    note: "No sales language.\nNo obligation."
  },

  footer: "OMEGA is human-led.\nAutonomy stays with you."
};

