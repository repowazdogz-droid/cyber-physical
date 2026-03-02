/**
 * Assessment Types
 * 
 * Defines assessment types, rubrics, and schemas per Contract 70.
 * No scores, grades, ranks, or speed metrics.
 * 
 * Version: 0.1
 */

import { AgeBand } from "../LearnerTypes";

/**
 * Assessment types per Contract 70.
 */
export enum AssessmentType {
  CritiqueAIAnswer = "CritiqueAIAnswer",
  OralReasoning = "OralReasoning",
  IterationLog = "IterationLog",
  Synthesis = "Synthesis",
  TeachBack = "TeachBack"
}

/**
 * Rubric dimensions per Contract 70.
 * All dimensions are required for each assessment.
 */
export enum RubricDimension {
  Clarity = "Clarity",
  EvidenceUse = "EvidenceUse",
  UncertaintyHandling = "UncertaintyHandling",
  RevisionQuality = "RevisionQuality",
  TradeoffAwareness = "TradeoffAwareness",
  VerificationHabits = "VerificationHabits"
}

/**
 * Performance bands (no numeric scores).
 * Per Contract 70: no scores, grades, or ranks.
 */
export enum PerformanceBand {
  Emerging = "Emerging",
  Developing = "Developing",
  Strong = "Strong"
}

/**
 * Context flags for assessment generation.
 * Similar to dialogue context flags.
 */
export interface AssessmentContextFlags {
  isTeacherPresent?: boolean;
  isHighStakesAssessment?: boolean;
  aiAllowed?: boolean; // Whether AI tools are allowed
}

/**
 * Assessment request input.
 */
export interface AssessmentRequest {
  learnerId: string;
  ageBand: AgeBand;
  subject: string;
  topic: string;
  objective: string;
  assessmentType: AssessmentType;
  contextFlags?: AssessmentContextFlags;
}

/**
 * Rubric dimension definition.
 * Describes what good looks like and common failure modes.
 */
export interface RubricDimensionDefinition {
  dimension: RubricDimension;
  description: string;
  strongIndicators: string[]; // What "Strong" looks like
  developingIndicators: string[]; // What "Developing" looks like
  emergingIndicators: string[]; // What "Emerging" looks like
  commonFailureModes: string[]; // What to watch out for
}

/**
 * Complete rubric with all dimensions.
 */
export interface AssessmentRubric {
  dimensions: RubricDimensionDefinition[];
  overallGuidance: string; // How to use the rubric
}

/**
 * Assessment output per Contract 70.
 */
export interface AssessmentOutput {
  assessmentId: string; // Deterministic hash from inputs
  type: AssessmentType;
  prompt: string;
  requiredArtifacts: string[]; // e.g., "Revision log", "Source list"
  rubric: AssessmentRubric;
  integrityChecks: string[]; // e.g., "Explain why you trust this source"
  aiUsagePolicy: string; // Clear and explicit
  shouldRefuse: boolean;
  refusalReason?: string;
  ageBand: AgeBand;
  subject: string;
  topic: string;
  objective: string;
}

/**
 * Prohibited metrics list (explicit).
 * Per Contract 70: these metrics must never appear in assessments.
 */
export const PROHIBITED_METRICS = [
  "speed",
  "time to completion",
  "response time",
  "time limit",
  "deadline",
  "volume",
  "word count",
  "response length",
  "amount of content",
  "streak",
  "consecutive correct",
  "completion percentage",
  "completion rate",
  "percent complete",
  "rank",
  "ranking",
  "leaderboard",
  "comparison to others",
  "relative performance",
  "score",
  "grade",
  "points",
  "numeric score",
  "percentage score",
  "iq",
  "intelligence quotient"
] as const;

/**
 * Checks if a string contains any prohibited metrics.
 * Uses word boundary matching to avoid false positives (e.g., "critique" matching "iq").
 */
export function containsProhibitedMetrics(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_METRICS.some(metric => {
    const metricLower = metric.toLowerCase();
    // Use word boundary regex to match whole words/phrases only
    // For multi-word phrases, match as phrase; for single words, use word boundaries
    if (metricLower.includes(' ')) {
      // Multi-word phrase: match as phrase
      return lower.includes(metricLower);
    } else {
      // Single word: use word boundary regex to avoid substring matches
      const regex = new RegExp(`\\b${metricLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lower);
    }
  });
}




