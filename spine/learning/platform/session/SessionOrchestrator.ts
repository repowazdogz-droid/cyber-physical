/**
 * Session Orchestrator
 * 
 * Orchestrates Dialogue (69) + Assessment (70) + Skill Graph (72) into a single
 * deterministic session pipeline.
 * 
 * Version: 0.1
 */

import {
  LearningSessionRequest,
  LearningSessionOutput,
  SessionTrace,
  SkillGraphDelta
} from "./SessionTypes";
import { hashString } from "./hash";
import {
  createDialogueState,
  planNextTurn
} from "../dialogue/TurnPlanner";
import { DialogueState } from "../dialogue/DialogTypes";
import {
  generateAssessment
} from "../assessment/AssessmentGenerator";
import { AssessmentOutput } from "../assessment/AssessmentTypes";
import {
  applyObservations,
  SkillGraphUpdateResult
} from "../SkillGraphUpdater";
import {
  createEmptySkillGraph,
  CognitiveSkillGraph
} from "../SkillGraphTypes";
import {
  AssessmentType
} from "../assessment/AssessmentTypes";
import { ContextFlags } from "../dialogue/DialogTypes";
import { applyStyleToTutorTurn } from "../style/StyleEnforcer";

/**
 * Creates initial session state (dialogue state).
 */
export function createSessionState(
  request: LearningSessionRequest
): DialogueState {
  const contextFlags: ContextFlags = {
    isTeacherPresent: request.contextFlags?.isTeacherPresent,
    isHighStakesAssessment: request.contextFlags?.isHighStakes
  };
  
  return createDialogueState(
    request.sessionId,
    request.learner,
    request.mode,
    request.goal.topic,
    request.goal.objective,
    contextFlags
  );
}

/**
 * Generates deterministic hash of session request inputs.
 */
function hashSessionInputs(request: LearningSessionRequest): string {
  const input = JSON.stringify({
    sessionId: request.sessionId,
    learnerId: request.learner.learnerId,
    ageBand: request.learner.ageBand,
    goal: request.goal,
    mode: request.mode,
    utterance: request.utterance || "",
    requestedAssessment: request.requestedAssessment || null,
    contextFlags: request.contextFlags || {}
  });
  
  return hashString(input);
}

/**
 * Runs a learning session turn.
 * 
 * Pipeline order:
 * 1. Plan next turn (Dialogue 69)
 * 2. Collect observations from turn plan
 * 3. Apply observations to skill graph (72)
 * 4. Generate assessment if requested and allowed (70)
 * 
 * Returns complete session output with trace.
 */
export function runLearningSession(
  request: LearningSessionRequest,
  previousSkillGraph?: CognitiveSkillGraph,
  previousDialogueState?: DialogueState
): LearningSessionOutput {
  // Use previous dialogue state or create new one
  const dialogueState = previousDialogueState || createSessionState(request);
  
  // Use previous skill graph or create empty one
  const skillGraph = previousSkillGraph || createEmptySkillGraph(request.learner.learnerId);
  
  // Step 1: Plan next turn (Dialogue 69)
  const turnResult = planNextTurn(dialogueState, request.utterance);
  
  // Step 1.5: Apply style enforcement (age/ND adaptation)
  const styledPlan = request.responseStyleHint
    ? applyStyleToTutorTurn(turnResult.plan, request.responseStyleHint)
    : turnResult.plan;
  
  // Update turn result with styled plan
  const styledTurnResult = {
    ...turnResult,
    plan: styledPlan
  };
  
  // Collect observations from turn plan
  const observations = styledTurnResult.observations;
  
  // Step 2: Apply observations to skill graph (72)
  // Only update if we have observations and dialogue didn't refuse
  let skillGraphDelta: SkillGraphDelta;
  if (observations.length > 0 && !styledPlan.shouldRefuse) {
    const skillUpdateResult: SkillGraphUpdateResult = applyObservations(
      request.learner,
      skillGraph,
      observations
    );
    
    skillGraphDelta = {
      updates: skillUpdateResult.audit,
      newGraph: skillUpdateResult.graph
    };
  } else {
    // No updates if refused or no observations
    skillGraphDelta = {
      updates: [],
      newGraph: skillGraph
    };
  }
  
  // Step 3: Generate assessment if requested and allowed (70)
  let assessment: AssessmentOutput | undefined;
  if (request.requestedAssessment && !styledPlan.shouldRefuse) {
    const assessmentRequest = {
      learnerId: request.learner.learnerId,
      ageBand: request.learner.ageBand,
      subject: request.goal.subject,
      topic: request.goal.topic,
      objective: request.goal.objective,
      assessmentType: request.requestedAssessment as AssessmentType,
      contextFlags: {
        isTeacherPresent: request.contextFlags?.isTeacherPresent,
        isHighStakesAssessment: request.contextFlags?.isHighStakes,
        aiAllowed: false // Default to false, can be made configurable
      }
    };
    
    const generatedAssessment = generateAssessment(assessmentRequest);
    
    // Only include assessment if it wasn't refused
    if (!generatedAssessment.shouldRefuse) {
      assessment = generatedAssessment;
    }
  }
  
  // Build session trace
  const inputsHash = hashSessionInputs(request);
  const refusals: string[] = [];
  
  if (styledPlan.shouldRefuse && styledPlan.refusalReason) {
    refusals.push(styledPlan.refusalReason);
  }
  
  if (assessment?.shouldRefuse && assessment.refusalReason) {
    refusals.push(assessment.refusalReason);
  }
  
  const notes: string[] = [];
  if (styledPlan.uncertaintyNotes && styledPlan.uncertaintyNotes.length > 0) {
    notes.push(`Uncertainties: ${styledPlan.uncertaintyNotes.join(", ")}`);
  }
  
  if (skillGraphDelta.updates.length > 0) {
    notes.push(`Skill updates: ${skillGraphDelta.updates.length} skills updated`);
  }
  
  const sessionTrace: SessionTrace = {
    timestampIso: request.timestampIso || new Date().toISOString(),
    inputsHash,
    contractsVersion: "0.1",
    sessionId: request.sessionId,
    learnerId: request.learner.learnerId,
    refusals,
    notes,
    turnCount: styledTurnResult.newState.turnCount,
    assessmentGenerated: assessment !== undefined,
    skillUpdatesCount: skillGraphDelta.updates.length
  };
  
  return {
    tutorTurn: styledPlan,
    assessment,
    observations,
    skillGraphDelta,
    sessionTrace,
    dialogueState: styledTurnResult.newState
  };
}

