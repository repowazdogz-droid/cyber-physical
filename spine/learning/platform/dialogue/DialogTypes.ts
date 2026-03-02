/**
 * Dialogue Types
 * 
 * Defines types for the Socratic Dialogue Protocol per Contract 69.
 * Aligned with Contracts 68, 71, and 72.
 * 
 * Version: 0.1
 */

import { AgeBand, LearnerProfile, LearningSessionObservation } from "../LearnerTypes";

/**
 * Tutor modes per Contract 69.
 */
export enum TutorMode {
  Socratic = "Socratic",
  Coach = "Coach",
  Examiner = "Examiner",
  Explainer = "Explainer"
}

/**
 * Scaffold ladder steps per Contract 69.
 * Defines the progression of scaffolding from goal clarification to solution revelation.
 */
export enum ScaffoldStep {
  ClarifyGoal = "ClarifyGoal",
  ElicitPriorKnowledge = "ElicitPriorKnowledge",
  AskForAttempt = "AskForAttempt",
  AskForReasoning = "AskForReasoning",
  OfferHint = "OfferHint",
  OfferCounterexampleOrTest = "OfferCounterexampleOrTest",
  RevealMinimalSolution = "RevealMinimalSolution",
  ReflectAndGeneralize = "ReflectAndGeneralize"
}

/**
 * Refusal reasons for when the tutor must refuse to proceed.
 * Per Contract 69 refusal gates.
 */
export enum RefusalReason {
  SafetyViolation = "SafetyViolation",
  AgeBandRestriction = "AgeBandRestriction",
  UncertaintyTooHigh = "UncertaintyTooHigh",
  MissingRequiredInformation = "MissingRequiredInformation",
  HighStakesCheatingAttempt = "HighStakesCheatingAttempt",
  AutonomyExceeded = "AutonomyExceeded"
}

/**
 * Context flags for dialogue state.
 * Used for teacher presence and assessment context.
 */
export interface ContextFlags {
  isTeacherPresent?: boolean;
  isHighStakesAssessment?: boolean;
}

/**
 * A single turn in the dialogue history.
 * Bounded to prevent unbounded memory growth.
 */
export interface DialogueTurn {
  turnNumber: number;
  learnerUtterance?: string;
  tutorMessage: string;
  tutorQuestions: string[];
  scaffoldStep: ScaffoldStep;
  timestamp: string; // ISO 8601 format
  observations?: LearningSessionObservation[];
}

/**
 * Dialogue state tracking the current conversation context.
 * Per Contract 69 turn structure and state management.
 */
export interface DialogueState {
  sessionId: string;
  learnerProfile: LearnerProfile;
  mode: TutorMode;
  topic: string;
  goal: string;
  
  // Scaffold tracking
  currentStep: ScaffoldStep;
  hasMadeAttempt: boolean;
  hasRequestedSolution: boolean;
  hintsOffered: number;
  counterexamplesOffered: number;
  
  // Uncertainty and missing info
  uncertainties: string[];
  missingInfo: string[];
  
  // Bounded history (last 20 turns)
  history: DialogueTurn[];
  turnCount: number;
  
  // Context flags
  contextFlags: ContextFlags;
  
  // Session metadata
  startedAt: string; // ISO 8601 format
  lastUpdated: string; // ISO 8601 format
}

/**
 * Tutor action types that can be taken in a turn.
 */
export type TutorActionType =
  | "ask_clarifying"
  | "offer_hint"
  | "request_justification"
  | "offer_counterexample"
  | "request_attempt"
  | "reveal_solution"
  | "reflect_and_generalize"
  | "escalate_to_human";

/**
 * A tutor action with optional payload.
 */
export interface TutorAction {
  type: TutorActionType;
  payload?: any;
}

/**
 * Tutor turn plan output per Contract 69.
 * Defines what the tutor will do in the next turn.
 */
export interface TutorTurnPlan {
  mode: TutorMode;
  message: string; // The actual tutor output
  questions: string[]; // Separate list for UI
  actions: TutorAction[];
  shouldRefuse: boolean;
  refusalReason?: RefusalReason;
  escalationPath?: string;
  uncertaintyNotes?: string[];
  nextSuggestedLearnerAction: string; // Short guidance for learner
  scaffoldStep: ScaffoldStep;
  observations: LearningSessionObservation[]; // Observations generated from this turn
}

/**
 * Result of planning the next turn.
 * Includes the plan, updated state, and observations.
 */
export interface TurnPlanningResult {
  plan: TutorTurnPlan;
  newState: DialogueState;
  observations: LearningSessionObservation[];
}








































