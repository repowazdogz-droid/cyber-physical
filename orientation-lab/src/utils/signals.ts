import type { OrientationState } from "../types/orientation";

export type SignalLevel = "note" | "attention";

export type SignalItem = {
  id: string;
  level: SignalLevel;
  title: string;
  detail: string;
};

export type OrientationSignals = {
  counts: {
    models: number;
    assumptions: number;
    disagreements: number;
    unknowns: number;
    judgments: number;
  };
  items: SignalItem[];
};

function safeStr(x: unknown): string {
  return typeof x === "string" ? x : "";
}

function isBlank(x: unknown): boolean {
  return safeStr(x).trim().length === 0;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function buildSignals(state: OrientationState): OrientationSignals {
  const models = state.models ?? [];
  const assumptions = state.assumptions ?? [];
  const disagreements = state.disagreements ?? [];
  const unknowns = state.unknowns ?? [];
  const judgments = state.judgments ?? [];

  const items: SignalItem[] = [];

  // ===== Empty / thin structure =====
  if (models.length === 0) {
    items.push({
      id: "no-models",
      level: "attention",
      title: "No models captured",
      detail: "Rooms tend to drift into argument without at least 2 named perspectives.",
    });
  } else if (models.length === 1) {
    items.push({
      id: "one-model",
      level: "note",
      title: "Only one model captured",
      detail: "Consider capturing the next most plausible competing view (even if you disagree with it).",
    });
  }

  // ===== Model completeness =====
  const modelBlanks = models.filter(
    (m) => isBlank((m as any).name) || isBlank((m as any).claim) || isBlank((m as any).scope)
  );
  if (modelBlanks.length > 0) {
    items.push({
      id: "model-blanks",
      level: "note",
      title: "Some model fields are blank",
      detail: `${modelBlanks.length} model(s) missing name/claim/scope. Blank scopes cause hidden disagreement later.`,
    });
  }

  // ===== Assumption ownership & status =====
  const contested = assumptions.filter((a) => (a as any).status === "contested");
  if (contested.length > 0) {
    items.push({
      id: "contested-assumptions",
      level: "attention",
      title: "Contested assumptions present",
      detail: `${contested.length} assumption(s) marked contested. The room may be fighting about premises, not actions.`,
    });
  }

  const assumptionNoOwner = assumptions.filter(
    (a) => !("owner" in (a as any)) || isBlank((a as any).owner)
  );
  if (assumptionNoOwner.length > 0) {
    items.push({
      id: "assumption-no-owner",
      level: "attention",
      title: "Assumptions without an owner",
      detail: `${assumptionNoOwner.length} assumption(s) have no owner. If nobody can validate it, it stays arguable forever.`,
    });
  }

  // ===== Disagreement discriminators =====
  const disagreementNoChangeMind = disagreements.filter(
    (d) => !("whatWouldChangeMind" in (d as any)) || isBlank((d as any).whatWouldChangeMind)
  );
  if (disagreementNoChangeMind.length > 0) {
    items.push({
      id: "disagreement-no-discriminator",
      level: "attention",
      title: "Disagreements without a discriminator",
      detail: `${disagreementNoChangeMind.length} disagreement(s) missing "what would change minds". These tend to loop.`,
    });
  }

  const disagreementThin = disagreements.filter(
    (d) => isBlank((d as any).topic) || isBlank((d as any).parties)
  );
  if (disagreementThin.length > 0) {
    items.push({
      id: "disagreement-thin",
      level: "note",
      title: "Some disagreements are underspecified",
      detail: `${disagreementThin.length} disagreement(s) missing topic/parties. This makes ownership unclear.`,
    });
  }

  // ===== Unknown impact + ownership =====
  const highImpactUnknowns = unknowns.filter((u) => (u as any).impact === "high");
  if (highImpactUnknowns.length > 0) {
    items.push({
      id: "high-impact-unknowns",
      level: "attention",
      title: "High-impact unknowns captured",
      detail: `${highImpactUnknowns.length} unknown(s) marked high impact. These are often the real decision constraint.`,
    });
  }

  const unknownNoOwner = unknowns.filter(
    (u) => !("owner" in (u as any)) || isBlank((u as any).owner)
  );
  if (unknownNoOwner.length > 0) {
    items.push({
      id: "unknown-no-owner",
      level: "note",
      title: "Unknowns without an owner",
      detail: `${unknownNoOwner.length} unknown(s) have no owner. Unowned unknowns stay invisible.`,
    });
  }

  const unknownThin = unknowns.filter((u) => isBlank((u as any).question));
  if (unknownThin.length > 0) {
    items.push({
      id: "unknown-thin",
      level: "note",
      title: "Some unknowns are underspecified",
      detail: `${unknownThin.length} unknown(s) missing the question. Make it a concrete question, not a vibe.`,
    });
  }

  // ===== Judgment mix =====
  const jt = uniq(judgments);
  if (jt.length === 0) {
    items.push({
      id: "no-judgments",
      level: "note",
      title: "Judgment type not declared",
      detail: "If the room can't name what kind of judgment is required, it can't settle the disagreement.",
    });
  } else if (jt.length >= 4) {
    items.push({
      id: "many-judgments",
      level: "note",
      title: "Multiple judgment types in play",
      detail:
        "When definition/measurement/authority/values/timing are mixed, people talk past each other. Naming the mix reduces conflict.",
    });
  }

  // ===== Minimal sanity: duplicated near-empty rows =====
  const emptyAssumptions = assumptions.filter((a) => isBlank((a as any).text));
  if (emptyAssumptions.length > 0) {
    items.push({
      id: "assumption-empty",
      level: "note",
      title: "Empty assumption rows exist",
      detail: `${emptyAssumptions.length} assumption(s) are blank. Remove or fill to reduce noise.`,
    });
  }

  return {
    counts: {
      models: models.length,
      assumptions: assumptions.length,
      disagreements: disagreements.length,
      unknowns: unknowns.length,
      judgments: jt.length,
    },
    items,
  };
}

export function getSignals(state: OrientationState): SignalItem[] {
  return buildSignals(state).items;
}

