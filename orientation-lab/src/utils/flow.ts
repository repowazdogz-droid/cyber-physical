import type { OrientationState } from "../types/orientation";

export type FlowStep = "capture" | "resolve" | "pack";

export type FlowStatus = {
  step: FlowStep;
  ready: boolean;
  label: string;
  detail: string;
};

function countNonEmpty(list: { [k: string]: any }[], key: string): number {
  return list.reduce((acc, x) => acc + (String(x?.[key] ?? "").trim() ? 1 : 0), 0);
}

export function getFlowStatuses(state: OrientationState): FlowStatus[] {
  const models = state.models?.length ?? 0;
  const assumptions = state.assumptions?.length ?? 0;
  const disagreements = state.disagreements?.length ?? 0;
  const unknowns = state.unknowns?.length ?? 0;

  const discriminators = countNonEmpty(state.disagreements ?? [], "whatWouldChangeMind");
  const ownersUnknowns = countNonEmpty(state.unknowns ?? [], "owner");
  const judgments = state.judgments?.length ?? 0;

  const captureReady = models >= 2 || (models >= 1 && (assumptions + disagreements + unknowns) >= 2);
  const resolveReady = disagreements >= 1 && discriminators >= 1;
  const packReady = (captureReady || resolveReady) && (ownersUnknowns >= 1 || judgments >= 1);

  return [
    {
      step: "capture",
      ready: captureReady,
      label: "1) Capture",
      detail:
        models >= 2
          ? "Good: multiple lenses captured."
          : models === 1
          ? "Add a second lens (even if you disagree)."
          : "Start with 2 lenses: Ops / Safety / Finance / Equity etc.",
    },
    {
      step: "resolve",
      ready: resolveReady,
      label: "2) Discriminate",
      detail:
        disagreements === 0
          ? "Name the disputed point."
          : discriminators === 0
          ? 'Add "what would change our mind".'
          : "Good: dispute + discriminators captured.",
    },
    {
      step: "pack",
      ready: packReady,
      label: "3) Pack",
      detail:
        judgments === 0 && ownersUnknowns === 0
          ? "Add judgment type or assign an owner role."
          : "Ready to print / share.",
    },
  ];
}

export function nextSuggestedStep(state: OrientationState): FlowStep {
  const s = getFlowStatuses(state);
  const firstNotReady = s.find((x) => !x.ready);
  return firstNotReady?.step ?? "pack";
}

