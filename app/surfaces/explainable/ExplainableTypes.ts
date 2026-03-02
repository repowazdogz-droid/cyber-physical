/**
 * Explainable Types
 * 
 * Types for explainable display models.
 * Bounded, ND-first, deterministic.
 * 
 * Version: 1.0.0
 */

/**
 * ExplainableOutcomeCardModel: Outcome card display model.
 * Bounded: label max 60 chars, subtitle max 120 chars.
 */
export interface ExplainableOutcomeCardModel {
  /** Outcome label (max 60 chars) */
  label: string;
  /** One-line subtitle (max 120 chars) */
  subtitle: string;
  /** Optional confidence level */
  confidence?: "Low" | "Medium" | "High" | "Unknown";
  /** Optional terminal node ID (for orchestrator) */
  terminalNodeId?: string;
}

/**
 * ExplainableClaimChipModel: Claim chip display model.
 * Bounded: text max 80 chars.
 */
export interface ExplainableClaimChipModel {
  /** Claim ID */
  id: string;
  /** Claim text (max 80 chars) */
  text: string;
  /** Severity level */
  severity: "info" | "warn" | "critical";
  /** Count (for aggregated claims) */
  count?: number;
}

/**
 * ExplainableReasoningItemModel: Reasoning highlight item.
 * Bounded: title max 100 chars, sentence max 200 chars.
 */
export interface ExplainableReasoningItemModel {
  /** Item ID */
  id: string;
  /** Short title (max 100 chars) */
  title: string;
  /** One sentence description (max 200 chars) */
  sentence: string;
  /** Item type */
  type: "override" | "disallow" | "decision" | "claim" | "policy";
  /** Priority (for sorting, 0-100) */
  priority: number;
}

/**
 * ExplainablePolicyNoteModel: Policy note display model.
 * Bounded: text max 150 chars.
 */
export interface ExplainablePolicyNoteModel {
  /** Note ID */
  id: string;
  /** Note text (max 150 chars) */
  text: string;
}

/**
 * ExplainableTalkTrackModel: Talk track display model.
 * Bounded: bullets max 6, each max 200 chars.
 */
export interface ExplainableTalkTrackModel {
  /** Talk track bullets (max 6) */
  bullets: string[];
  /** Audience tone */
  audience: "learner" | "teacher" | "demo";
}

/**
 * ExplainableDisplayModel: Complete display model.
 * Bounded: maxClaims=8, maxReasoning=12, maxPolicyNotes=3, maxTalkTrackBullets=6.
 */
export interface ExplainableDisplayModel {
  /** Outcome card */
  outcome: ExplainableOutcomeCardModel;
  /** Claim chips (bounded, max 8) */
  claimChips: ExplainableClaimChipModel[];
  /** Policy notes (bounded, max 3) */
  policyNotes: ExplainablePolicyNoteModel[];
  /** Reasoning items (bounded, max 12) */
  reasoningItems: ExplainableReasoningItemModel[];
  /** Talk track (optional) */
  talkTrack?: ExplainableTalkTrackModel;
}

/**
 * ExplainableModelOptions: Options for building display model.
 */
export interface ExplainableModelOptions {
  /** Calm mode (reduced visual noise) */
  calmMode?: boolean;
  /** Audience type */
  audience?: "learner" | "teacher" | "demo";
  /** Include reasoning highlights */
  includeReasoning?: boolean;
  /** Include talk track */
  includeTalkTrack?: boolean;
}








































