import { RoomKey } from '@/app/state/types';

export interface RoomConfig {
  label: string;
  description: string;
  accentColor: string;
  placeholder: string;
  rule: string;
}

export const roomConfig: Record<RoomKey, RoomConfig> = {
  claim: {
    label: "What it claims",
    description: "Rewrite the claim in plain language. No evaluation.",
    accentColor: "#737373",
    placeholder: "What is being asserted?",
    rule: "No judgment. No hedging.",
  },
  assumptions: {
    label: 'What this assumes',
    description: 'Hidden premises that must be true for the claim to hold.',
    accentColor: '#60a5fa', // blue-400
    placeholder: 'What must be true for this to hold?',
    rule: 'No evidence or conclusions here. Just name what must already be true.',
  },
  evidence: {
    label: "What's actually shown",
    description: 'What is directly shown or sourced.',
    accentColor: '#4ade80', // green-400
    placeholder: 'Add something directly shown or sourced.',
    rule: 'Describe only what is directly shown or sourced. No interpretation.',
  },
  missing: {
    label: "What's missing / unclear",
    description: "What information would materially affect understanding?",
    accentColor: "#737373",
    placeholder: "What context is missing?",
    rule: "List gaps and unknowns only.",
  },
  framings: {
    label: "Other framings",
    description: "Other reasonable ways to read the same material.",
    accentColor: "#737373",
    placeholder: "Alternative framings…",
    rule: "No contradiction required.",
  },
  causal: {
    label: "What's implied to cause what",
    description: 'What affects what.',
    accentColor: '#a78bfa', // purple-400
    placeholder: 'What affects what?',
    rule: 'Write relationships, not stories. "X leads to Y."',
  },
  constraints: {
    label: "What's missing or limited",
    description: 'Limits, boundaries, and failure modes.',
    accentColor: '#f87171', // red-400
    placeholder: 'What is not allowed or out of bounds?',
    rule: "What limits this claim? What can't be known here?",
  },
  tradeoffs: {
    label: 'Other ways to see this',
    description: 'Alternatives and their costs.',
    accentColor: '#fbbf24', // yellow-400
    placeholder: 'What are plausible alternatives?',
    rule: 'Other reasonable ways to interpret this — without choosing.',
  },
  whatWouldChangeAnalysis: {
    label: 'What would materially change this analysis',
    description: 'Types of information that would affect interpretation. Does not recommend actions or next steps.',
    accentColor: '#737373',
    placeholder: 'Add information type...',
    rule: 'Categories of evidence, clarifying distinctions, boundary conditions, missing contextual information, or dependency disclosures.',
  },
};

