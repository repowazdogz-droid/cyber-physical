/**
 * Learner Types
 * 
 * Defines core learner profile and observation types for the learning platform.
 * Aligned with Contracts 68, 71, and 72.
 * 
 * Version: 0.1
 */

/**
 * Age band definitions per Contract 71
 */
export enum AgeBand {
  SIX_TO_NINE = "6-9",
  TEN_TO_TWELVE = "10-12",
  THIRTEEN_TO_FIFTEEN = "13-15",
  SIXTEEN_TO_EIGHTEEN = "16-18",
  ADULT = "adult"
}

/**
 * Learner profile containing age band, interests, and constraints.
 * Per Contract 68 LearningSessionRequest schema.
 */
export interface LearnerProfile {
  learnerId: string;
  ageBand: AgeBand;
  interests?: string[];
  constraints?: {
    timeMinutes?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
    accessibilityNotes?: string;
  };
  priorKnowledge?: string;
  safety: {
    minor: boolean;
    institutionMode: boolean;
  };
}

/**
 * Observation types that can be collected from a learning session.
 * Each observation is a concrete, local signal of cognitive skill evidence.
 * Per Contract 72 evidence signals.
 */
export type ObservationType =
  | "AskedClarifyingQuestion"
  | "StatedUncertainty"
  | "ProvidedEvidence"
  | "CorrectedSelf"
  | "CritiquedAIOutput"
  | "VerifiedClaimWithSource"
  | "SummarizedInOwnWords"
  | "IdentifiedAssumption"
  | "RecognizedTradeOff"
  | "RevisedBasedOnFeedback"
  | "ArticulatedReasoning"
  | "EvaluatedSourceQuality";

/**
 * A single observation from a learning session.
 * Represents one concrete evidence signal of cognitive skill application.
 */
export interface LearningSessionObservation {
  type: ObservationType;
  timestamp: string; // ISO 8601 format
  skillHint?: string; // Optional hint about which skill this relates to
  strength: number; // 0.0 to 1.0, bounded
  notes?: string; // Short optional description
  sessionId: string; // Link to originating session
}

/**
 * Array of observations from a learning session.
 */
export type LearningSessionObservations = LearningSessionObservation[];








































