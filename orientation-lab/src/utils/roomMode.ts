import type { OrientationState } from "../types/orientation";
import { buildSignals } from "./signals";

export type RoomStep = "capture" | "discriminate" | "own";

export type RoomPrompt = {
  step: RoomStep;
  title: string;
  body: string;
};

export const ROOM_STEPS: { id: RoomStep; label: string }[] = [
  { id: "capture", label: "Capture" },
  { id: "discriminate", label: "Discriminate" },
  { id: "own", label: "Own" },
];

export function getRoomPrompts(state: OrientationState): RoomPrompt[] {
  const sig = buildSignals(state);
  const hasDisagreements = (state.disagreements ?? []).length > 0;
  const hasUnknowns = (state.unknowns ?? []).length > 0;

  const prompts: RoomPrompt[] = [
    {
      step: "capture",
      title: "What models are in the room?",
      body: "Name 2–3 perspectives that explain what's happening. Keep them descriptive (not a plan).",
    },
    {
      step: "capture",
      title: "What is being assumed?",
      body: "Turn implied beliefs into explicit statements. Mark contested vs unknown.",
    },
    {
      step: "capture",
      title: "Where do people genuinely disagree?",
      body: "Write the disagreement as a question. Avoid blame language.",
    },
    {
      step: "discriminate",
      title: "What would change minds?",
      body: "For each disagreement: what evidence, observation, or test would actually shift the room?",
    },
    {
      step: "discriminate",
      title: "Which unknowns matter most?",
      body: "Pick 1–2 unknowns with high impact and near horizon. Make them concrete.",
    },
    {
      step: "discriminate",
      title: "Where is the boundary?",
      body: "State what this session will NOT do (no forecasting, no optimisation, no assigning blame).",
    },
    {
      step: "own",
      title: "Who owns validation?",
      body: "For key assumptions/unknowns: assign an owner as a role (not a person).",
    },
    {
      step: "own",
      title: "What judgment types are required?",
      body: "Are we making a definition call, a threshold call, a tradeoff call, an authority call, or a timing call?",
    },
    {
      step: "own",
      title: "What must be decided outside this room?",
      body: "Name the decisions that require governance, policy, or values beyond today's evidence.",
    },
  ];

  // Light adaptation: if no disagreements, steer to models/unknowns; if no unknowns, steer to discriminators.
  if (!hasDisagreements) {
    prompts.unshift({
      step: "capture",
      title: "If we had to disagree, where would it be?",
      body: "Sometimes rooms converge too early. Name the most plausible disagreement you'd want surfaced.",
    });
  }
  if (!hasUnknowns) {
    prompts.push({
      step: "discriminate",
      title: "What is currently unknown that could break the plan?",
      body: "Name one assumption that, if false, would force reorientation.",
    });
  }

  // If signals show discriminator gaps, nudge earlier.
  const discriminatorSignal = sig.items.find((x) => x.title.toLowerCase().includes("discriminator"));
  if (discriminatorSignal) {
    prompts.unshift({
      step: "discriminate",
      title: "Discriminators first",
      body: "Before debating solutions: write what evidence would separate the competing stories.",
    });
  }

  return prompts;
}

export function filterPromptsByStep(all: RoomPrompt[], step: RoomStep): RoomPrompt[] {
  return all.filter((p) => p.step === step);
}

