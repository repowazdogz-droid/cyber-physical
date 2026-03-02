/**
 * Pre-verified demonstrations only.
 * 
 * All outputs are frozen. No runtime inference. No user mutation.
 */

export interface DemoOutput {
  claims: string[];
  evidence: string[];
  unknowns: string[];
}

export interface Demo {
  id: string;
  label: string;
  input: string;
  output: DemoOutput;
}

export const DEMOS: Demo[] = [
  {
    id: "robotics-abstract",
    label: "Robotics abstract → claim decomposition",
    input: "Example robotics abstract text (pre-verified input)...",
    output: {
      claims: [
        "Claim 1: [Pre-verified claim from abstract]",
        "Claim 2: [Pre-verified claim from abstract]"
      ],
      evidence: [
        "Evidence 1: [Pre-verified evidence]",
        "Evidence 2: [Pre-verified evidence]"
      ],
      unknowns: [
        "Unknown 1: [Pre-verified unknown]",
        "Unknown 2: [Pre-verified unknown]"
      ]
    }
  },
  {
    id: "medical-figure",
    label: "Medical figure → evidence boundary analysis",
    input: "Example medical figure description (pre-verified input)...",
    output: {
      claims: [
        "Claim 1: [Pre-verified claim]"
      ],
      evidence: [
        "Evidence 1: [Pre-verified evidence]"
      ],
      unknowns: [
        "Unknown 1: [Pre-verified unknown]"
      ]
    }
  },
  {
    id: "public-chart",
    label: "Public chart → overreach detection",
    input: "Example public chart description (pre-verified input)...",
    output: {
      claims: [
        "Claim 1: [Pre-verified claim]"
      ],
      evidence: [
        "Evidence 1: [Pre-verified evidence]"
      ],
      unknowns: [
        "Unknown 1: [Pre-verified unknown]"
      ]
    }
  }
];





































