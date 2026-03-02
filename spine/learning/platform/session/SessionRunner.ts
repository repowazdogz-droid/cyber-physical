/**
 * Session Runner
 * 
 * Helper function to run a session and persist it to the store.
 * Integrates SessionOrchestrator with LearningStore.
 * 
 * Version: 0.1
 */

import {
  LearningSessionRequest,
  LearningSessionOutput
} from "./SessionTypes";
import {
  runLearningSession
} from "./SessionOrchestrator";
import {
  ILearningStore
} from "../store/ILearningStore";
import {
  StoredSessionRecord,
  StoredLearnerState
} from "../store/StoreTypes";
import {
  createEmptySkillGraph
} from "../SkillGraphTypes";
import { DialogueTurn } from "../dialogue/DialogTypes";

/**
 * Runs a learning session and persists it to the store.
 * 
 * Pipeline:
 * 1. Load learner state from store
 * 2. Run session (orchestrator)
 * 3. Update skill graph
 * 4. Append session record to store
 * 5. Persist updated learner state
 * 
 * Returns the session output.
 */
export function runSessionAndPersist(
  request: LearningSessionRequest,
  store: ILearningStore
): LearningSessionOutput {
  // Load learner state
  let learnerState = store.getLearnerState(request.learner.learnerId);
  
  // Create empty state if not found
  if (!learnerState) {
    learnerState = {
      learnerProfile: request.learner,
      skillGraph: createEmptySkillGraph(request.learner.learnerId),
      version: "0.1"
    };
  }
  
  // Get previous dialogue state if available (from last session)
  // For now, we'll create a new dialogue state each time
  // In a full implementation, you might want to persist dialogue state too
  
  // Run session
  const output = runLearningSession(
    request,
    learnerState.skillGraph,
    undefined // Previous dialogue state (could be loaded from store if persisted)
  );
  
  // Update learner state with new skill graph
  learnerState.skillGraph = output.skillGraphDelta.newGraph;
  learnerState.lastSessionId = request.sessionId;
  
  // Build session record
  const tutorTurns: DialogueTurn[] = [];
  
  // Add current turn to history
  if (output.dialogueState?.history) {
    tutorTurns.push(...output.dialogueState.history);
  }
  
  // Add current turn if it exists
  if (output.tutorTurn) {
    tutorTurns.push({
      turnNumber: output.sessionTrace.turnCount,
      learnerUtterance: request.utterance,
      tutorMessage: output.tutorTurn.message,
      tutorQuestions: output.tutorTurn.questions,
      scaffoldStep: output.tutorTurn.scaffoldStep,
      timestamp: output.sessionTrace.timestampIso || new Date().toISOString(),
      observations: output.observations
    });
  }
  
  const sessionRecord: StoredSessionRecord = {
    sessionId: request.sessionId,
    learnerId: request.learner.learnerId,
    goal: request.goal,
    tutorTurns,
    observations: output.observations,
    assessmentOutputs: output.assessment ? [output.assessment] : undefined,
    sessionTrace: output.sessionTrace,
    createdAtIso: request.timestampIso || new Date().toISOString()
  };
  
  // Append session to store
  store.appendSession(sessionRecord);
  
  // Persist updated learner state
  store.saveLearnerState(learnerState);
  
  return output;
}




