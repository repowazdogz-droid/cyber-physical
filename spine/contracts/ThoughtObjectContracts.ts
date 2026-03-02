/**
 * ThoughtObject Contracts
 * 
 * Interfaces for thought objects in learning boards.
 * ND-first: text length bounds documented.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';

/**
 * ThoughtObjectType: Types of thought objects.
 */
export enum ThoughtObjectType {
  LearnerAttempt = "LearnerAttempt",
  TutorHint = "TutorHint",
  Example = "Example",
  Question = "Question",
  Evidence = "Evidence",
  Uncertainty = "Uncertainty",
  Reflection = "Reflection"
}

/**
 * ThoughtObjectSource: Source of thought object.
 */
export enum ThoughtObjectSource {
  Learner = "learner",
  Tutor = "tutor",
  System = "system"
}

/**
 * ThoughtObjectContract: Thought object in learning board.
 * ND-first: bounded text, no embedded logic.
 */
export interface ThoughtObjectContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Object ID (deterministic hash) */
  id: string;
  /** Object type */
  type: ThoughtObjectType;
  /** Content (string or structured, max 500 chars if string) */
  content: string | ThoughtObjectStructuredContentContract;
  /** Source */
  source: ThoughtObjectSource;
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Confidence level (optional) */
  confidence?: "low" | "medium" | "high" | "unknown";
  /** Related step ID (optional) */
  relatedStepId?: string;
  /** Ephemeral flag (optional, for temporary objects) */
  ephemeral?: boolean;
}

/**
 * ThoughtObjectStructuredContentContract: Structured content for thought objects.
 * Bounded fields, no UI styling concerns.
 */
export interface ThoughtObjectStructuredContentContract {
  /** Title (optional, max 100 chars) */
  title?: string;
  /** Body (required, max 400 chars) */
  body: string;
  /** Items (optional, bounded, max 5 items, each max 100 chars) */
  items?: string[];
}

/**
 * ThoughtObjectVisibilityContract: Visibility rules for thought objects.
 * Schema only, no enforcement logic.
 */
export interface ThoughtObjectVisibilityContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Object ID */
  objectId: string;
  /** Visible to learner (always true) */
  visibleToLearner: boolean;
  /** Visible to parent (depends on age) */
  visibleToParent: boolean;
  /** Visible to teacher (depends on age and opt-in) */
  visibleToTeacher: boolean;
  /** Visible to institution (depends on institution mode) */
  visibleToInstitution: boolean;
  /** Reason for visibility rules (max 100 chars) */
  reason?: string;
}








































