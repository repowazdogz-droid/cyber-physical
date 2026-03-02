/**
 * Session Types
 * 
 * Defines types for the Learning Session Orchestrator.
 * Integrates Dialogue (69), Assessment (70), and Skill Graph (72).
 * 
 * Version: 0.1
 */

import { LearnerProfile, LearningSessionObservation } from "../LearnerTypes";
import { TutorMode, TutorTurnPlan, DialogueState, ContextFlags } from "../dialogue/DialogTypes";
import { AssessmentType, AssessmentOutput } from "../assessment/AssessmentTypes";
import { CognitiveSkillGraph } from "../SkillGraphTypes";
import { SkillUpdateAuditEntry } from "../SkillGraphUpdater";

/**
 * Learning session request input.
 */
export interface LearningSessionRequest {
  sessionId: string;
  learner: LearnerProfile;
  contextFlags?: {
    isTeacherPresent?: boolean;
    isHighStakes?: boolean;
  };
  goal: {
    subject: string;
    topic: string;
    objective: string;
  };
  mode: TutorMode;
  utterance?: string; // Latest learner text, optional for session start
  requestedAssessment?: AssessmentType | null;
  timestampIso?: string; // Optional timestamp (caller can provide)
  responseStyleHint?: string; // Optional style hint for age/ND adaptation
}

/**
 * Session trace for audit and parent/teacher visibility.
 * Minimal, bounded, deterministic.
 */
export interface SessionTrace {
  timestampIso?: string;
  inputsHash: string; // Deterministic hash of inputs
  contractsVersion: "0.1";
  sessionId: string;
  learnerId: string;
  refusals: string[]; // List of refusal reasons if any
  notes: string[]; // Additional notes about the session
  turnCount: number;
  assessmentGenerated: boolean;
  skillUpdatesCount: number;
}

/**
 * Skill graph delta showing what changed.
 */
export interface SkillGraphDelta {
  updates: SkillUpdateAuditEntry[];
  newGraph: CognitiveSkillGraph;
}

/**
 * Learning session output.
 * Complete result of running a learning session turn.
 */
export interface LearningSessionOutput {
  tutorTurn: TutorTurnPlan;
  assessment?: AssessmentOutput;
  observations: LearningSessionObservation[];
  skillGraphDelta: SkillGraphDelta;
  sessionTrace: SessionTrace;
  dialogueState?: DialogueState; // Updated dialogue state for next turn
}

