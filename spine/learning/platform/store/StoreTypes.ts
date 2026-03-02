/**
 * Store Types
 * 
 * Defines types for the Learning Store with privacy/visibility filters.
 * Per Contracts 68, 71: age-appropriate visibility and bounded storage.
 * 
 * Version: 0.1
 */

import { LearnerProfile } from "../LearnerTypes";
import { TutorTurnPlan, DialogueTurn } from "../dialogue/DialogTypes";
import { AssessmentOutput } from "../assessment/AssessmentTypes";
import { LearningSessionObservation } from "../LearnerTypes";
import { SessionTrace } from "../session/SessionTypes";
import { CognitiveSkillGraph } from "../SkillGraphTypes";
import { KernelRunRecord } from "../../../kernels/surfaces/learning/KernelSurfaceTypes";
import { OrchestratorRunRecord } from "./OrchestratorRunTypes";

/**
 * Viewer roles for visibility filtering.
 * 
 * TODO: Future migration to /spine/contracts/VisibilityContracts.ts
 * - ViewerRole → ViewerRole enum from contracts
 * - VisibilityPolicy → VisibilityRuleContract (add contractVersion, align structure)
 */
export type ViewerRole = "Learner" | "Parent" | "Teacher" | "Institution";

/**
 * Visibility policy derived from learner profile and Contract 71.
 */
export interface VisibilityPolicy {
  learnerId: string;
  isMinor: boolean;
  parentCanView: boolean;
  teacherCanView: boolean;
  institutionCanView: boolean;
  learnerCanView: boolean; // Always true
  hideInternalMechanics: boolean; // Hide guardrail/refusal internals
}

/**
 * Self-check status (user-chosen, not a score).
 */
export type SelfCheckStatus = "Ready" | "NotYet" | "Unsure";

/**
 * Stored session record with bounded fields.
 * Per Contract 71: bounded storage, no infinite transcripts.
 */
export interface StoredSessionRecord {
  sessionId: string;
  learnerId: string;
  goal: {
    subject: string;
    topic: string;
    objective: string;
  };
  tutorTurns: DialogueTurn[]; // Bounded, max 50
  observations: LearningSessionObservation[]; // Bounded, max 200
  assessmentOutputs?: AssessmentOutput[]; // Optional, bounded
  sessionTrace: SessionTrace; // Always stored
  createdAtIso: string; // Caller-provided only
  sessionSummary?: string[]; // Optional: 2-4 bullet summary for teacher/parent visibility
  selfChecks?: Array<{ // Optional: self-check history (not scores)
    timestamp: string;
    status: SelfCheckStatus;
    context?: string; // Optional: what step/checkpoint this was for
  }>;
}

/**
 * Teacher nudge (bounded to 10 per learner).
 */
export interface TeacherNudge {
  text: string;
  timestampIso: string;
  teacherId: string;
}

/**
 * Stored learner state.
 */
export interface StoredLearnerState {
  learnerProfile: LearnerProfile;
  skillGraph: CognitiveSkillGraph;
  lastSessionId?: string;
  version: "0.1";
  pausedByTeacher?: boolean; // Pause flag set by teacher
  teacherNudges?: TeacherNudge[]; // Bounded to 10
  linkedTeacherId?: string; // Teacher ID if linked via invite code
  kernelRuns?: KernelRunRecord[]; // Bounded to 50 per learner
  orchestratorRuns?: OrchestratorRunRecord[]; // Bounded to 20 per learner
}

/**
 * Filtered session record (after visibility filtering).
 */
export interface FilteredSessionRecord {
  sessionId: string;
  learnerId: string;
  goal: {
    subject: string;
    topic: string;
    objective: string;
  };
  tutorTurns: DialogueTurn[]; // May be filtered
  observations: LearningSessionObservation[]; // May be filtered
  assessmentOutputs?: AssessmentOutput[]; // May be filtered
  sessionTrace: SessionTrace; // May be filtered
  createdAtIso: string;
  visibilityNote?: string; // Optional note about what was filtered
  sessionSummary?: string[]; // Allowed for teachers/parents
  selfChecks?: Array<{ // Allowed for teachers/parents
    timestamp: string;
    status: SelfCheckStatus;
    context?: string;
  }>;
}

/**
 * Filtered learner state (after visibility filtering).
 */
export interface FilteredLearnerState {
  learnerProfile: Partial<LearnerProfile>; // May be redacted
  skillGraph: Partial<CognitiveSkillGraph>; // May be redacted
  lastSessionId?: string;
  version: "0.1";
  visibilityNote?: string; // Optional note about what was filtered
  pausedByTeacher?: boolean; // Visible to teachers/parents for minors, or adults if opted-in
  teacherNudges?: TeacherNudge[]; // Visible to teachers/parents for minors, or adults if opted-in
  linkedTeacherId?: string; // Visible if access granted
  kernelRuns?: KernelRunRecord[]; // Visible if access granted
  orchestratorRuns?: OrchestratorRunRecord[]; // Visible if access granted (same rules as kernelRuns)
}

