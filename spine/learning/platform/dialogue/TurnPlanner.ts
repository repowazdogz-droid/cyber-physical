/**
 * Turn Planner
 * 
 * Core tutor brain that produces next-turn prompts and actions deterministically.
 * Per Contract 69: Socratic Dialogue Protocol.
 * 
 * Version: 0.1
 */

import {
  DialogueState,
  TutorTurnPlan,
  TutorMode,
  ScaffoldStep,
  RefusalReason,
  TutorAction,
  TurnPlanningResult,
  ContextFlags
} from "./DialogTypes";
import { AgeBand, LearningSessionObservation } from "../LearnerTypes";
import {
  canRevealSolution,
  determineNextStep,
  getScaffoldStepDefinition
} from "./ScaffoldLadder";

/**
 * Maximum number of turns to keep in history.
 * Bounded to prevent unbounded memory growth.
 */
const MAX_HISTORY_TURNS = 20;

/**
 * Creates initial dialogue state for a new session.
 */
export function createDialogueState(
  sessionId: string,
  learnerProfile: any,
  mode: TutorMode,
  topic: string,
  goal: string,
  contextFlags: ContextFlags = {}
): DialogueState {
  return {
    sessionId,
    learnerProfile,
    mode,
    topic,
    goal,
    currentStep: ScaffoldStep.ClarifyGoal,
    hasMadeAttempt: false,
    hasRequestedSolution: false,
    hintsOffered: 0,
    counterexamplesOffered: 0,
    uncertainties: [],
    missingInfo: [],
    history: [],
    turnCount: 0,
    contextFlags,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Checks age band restrictions per Contract 71.
 * Returns refusal reason if restrictions violated, null otherwise.
 */
function checkAgeBandRestrictions(
  state: DialogueState
): RefusalReason | null {
  const ageBand = state.learnerProfile.ageBand;
  const isMinor = state.learnerProfile.safety.minor;
  
  // Ages 6-9 and 10-12: only Socratic and Coach allowed
  if ((ageBand === AgeBand.SIX_TO_NINE || ageBand === AgeBand.TEN_TO_TWELVE) &&
      state.mode === TutorMode.Examiner &&
      !state.contextFlags.isTeacherPresent) {
    return RefusalReason.AgeBandRestriction;
  }
  
  // High stakes assessment check
  if (state.contextFlags.isHighStakesAssessment && isMinor) {
    // Block high stakes assessments for minors without teacher
    if (!state.contextFlags.isTeacherPresent) {
      return RefusalReason.HighStakesCheatingAttempt;
    }
  }
  
  return null;
}

/**
 * Generates observations from learner utterance.
 * Maps learner behavior to observation types per Contract 72.
 */
function generateObservationsFromUtterance(
  utterance: string,
  sessionId: string
): LearningSessionObservation[] {
  const observations: LearningSessionObservation[] = [];
  const lower = utterance.toLowerCase();
  const timestamp = new Date().toISOString();
  
  // Check for clarifying questions
  if (lower.includes("?") || 
      (lower.includes("what") || lower.includes("how") || lower.includes("why")) &&
      lower.length < 100) {
    observations.push({
      type: "AskedClarifyingQuestion",
      timestamp,
      strength: 0.8,
      sessionId
    });
  }
  
  // Check for uncertainty statements
  if (lower.includes("not sure") || 
      lower.includes("uncertain") || 
      lower.includes("don't know") ||
      lower.includes("unsure")) {
    observations.push({
      type: "StatedUncertainty",
      timestamp,
      strength: 0.9,
      sessionId
    });
  }
  
  // Check for evidence provision
  if (lower.includes("because") || 
      lower.includes("evidence") || 
      lower.includes("source") ||
      lower.includes("according to")) {
    observations.push({
      type: "ProvidedEvidence",
      timestamp,
      strength: 0.8,
      sessionId
    });
  }
  
  // Check for self-correction
  if (lower.includes("actually") || 
      lower.includes("correction") || 
      lower.includes("i meant") ||
      lower.includes("i think i was wrong")) {
    observations.push({
      type: "CorrectedSelf",
      timestamp,
      strength: 0.7,
      sessionId
    });
  }
  
  // Check for AI critique
  if (lower.includes("disagree") || 
      lower.includes("that's not right") || 
      lower.includes("i think you're wrong")) {
    observations.push({
      type: "CritiquedAIOutput",
      timestamp,
      strength: 0.9,
      sessionId
    });
  }
  
  // Check for verification
  if (lower.includes("verify") || 
      lower.includes("check") || 
      lower.includes("source") ||
      lower.includes("where did you get")) {
    observations.push({
      type: "VerifiedClaimWithSource",
      timestamp,
      strength: 0.8,
      sessionId
    });
  }
  
  // Check for summarization
  if (lower.includes("so") && lower.includes("means") ||
      lower.includes("in other words") ||
      lower.includes("to summarize")) {
    observations.push({
      type: "SummarizedInOwnWords",
      timestamp,
      strength: 0.7,
      sessionId
    });
  }
  
  return observations;
}

/**
 * Generates tutor message based on scaffold step and mode.
 * Per Contract 69: questions-first by default.
 */
function generateTutorMessage(
  state: DialogueState,
  nextStep: ScaffoldStep,
  learnerUtterance?: string
): { message: string; questions: string[]; actions: TutorAction[] } {
  const stepDef = getScaffoldStepDefinition(nextStep);
  const questions: string[] = [];
  const actions: TutorAction[] = [];
  let message = "";
  
  switch (nextStep) {
    case ScaffoldStep.ClarifyGoal:
      message = `Let's start by making sure I understand your goal. `;
      questions.push("What are you trying to learn or figure out?");
      message += questions[0];
      actions.push({ type: "ask_clarifying" });
      break;
      
    case ScaffoldStep.ElicitPriorKnowledge:
      message = `Before we dive in, I'd like to understand what you already know. `;
      questions.push("What do you already know about this topic?");
      message += questions[0];
      actions.push({ type: "ask_clarifying" });
      break;
      
    case ScaffoldStep.AskForAttempt:
      message = `Let's see what you think. `;
      questions.push(`Can you try to ${state.goal.toLowerCase()}?`);
      message += questions[0];
      actions.push({ type: "request_attempt" });
      break;
      
    case ScaffoldStep.AskForReasoning:
      message = `I'd like to understand your thinking. `;
      questions.push("Can you explain your reasoning?");
      message += questions[0];
      actions.push({ type: "request_justification" });
      break;
      
    case ScaffoldStep.OfferHint:
      state.hintsOffered += 1;
      message = `Here's a hint to guide your thinking: `;
      // Generate hint based on topic (simplified for now)
      const hint = `Consider what you know about ${state.topic}. What connections can you make?`;
      message += hint;
      questions.push("How does this hint help you think about the problem?");
      actions.push({ type: "offer_hint", payload: { hint } });
      break;
      
    case ScaffoldStep.OfferCounterexampleOrTest:
      state.counterexamplesOffered += 1;
      message = `Let's test your thinking with a different scenario. `;
      const counterexample = `What if we changed one aspect of this problem? How would that affect your answer?`;
      message += counterexample;
      questions.push("How does this test case change your thinking?");
      actions.push({ type: "offer_counterexample", payload: { counterexample } });
      break;
      
    case ScaffoldStep.RevealMinimalSolution:
      if (!canRevealSolution(state)) {
        // Should not reach here, but safety check
        message = `I'd like to see your thinking first. `;
        questions.push("Can you try to work through this step by step?");
        actions.push({ type: "request_attempt" });
      } else {
        message = `Based on your attempts and reasoning, here's a minimal solution: `;
        // Generate minimal solution (simplified)
        const solution = `The key insight is to ${state.goal.toLowerCase()} by considering ${state.topic}.`;
        message += solution;
        questions.push("Does this solution make sense to you?");
        actions.push({ type: "reveal_solution", payload: { solution } });
      }
      break;
      
    case ScaffoldStep.ReflectAndGeneralize:
      message = `Let's reflect on what we've learned. `;
      questions.push("What patterns or principles can you take away from this?");
      message += questions[0];
      actions.push({ type: "reflect_and_generalize" });
      break;
  }
  
  // Add uncertainty markers if there are uncertainties
  if (state.uncertainties.length > 0) {
    message += ` (Note: I'm uncertain about ${state.uncertainties.join(", ")})`;
  }
  
  return { message, questions, actions };
}

/**
 * Plans the next tutor turn based on current state and learner utterance.
 * Per Contract 69: deterministic, bounded, no answer dumping.
 */
export function planNextTurn(
  state: DialogueState,
  learnerUtterance?: string
): TurnPlanningResult {
  // Create updated state copy
  const newState: DialogueState = {
    ...state,
    lastUpdated: new Date().toISOString()
  };
  
  // Check age band restrictions
  const refusalReason = checkAgeBandRestrictions(newState);
  if (refusalReason) {
    const plan: TutorTurnPlan = {
      mode: newState.mode,
      message: `I need to stop here. This request violates safety boundaries for your age group.`,
      questions: [],
      actions: [{ type: "escalate_to_human" }],
      shouldRefuse: true,
      refusalReason,
      escalationPath: newState.learnerProfile.safety.minor 
        ? "parent_notification" 
        : "human_review",
      uncertaintyNotes: [],
      nextSuggestedLearnerAction: "Please consult with a teacher or parent.",
      scaffoldStep: newState.currentStep,
      observations: []
    };
    
    return {
      plan,
      newState,
      observations: []
    };
  }
  
  // Generate observations from learner utterance
  const observations: LearningSessionObservation[] = learnerUtterance
    ? generateObservationsFromUtterance(learnerUtterance, newState.sessionId)
    : [];
  
  // Determine next scaffold step
  const nextStep = learnerUtterance
    ? determineNextStep(newState, learnerUtterance)
    : newState.currentStep;
  
  newState.currentStep = nextStep;
  
  // Generate tutor message, questions, and actions
  const { message, questions, actions } = generateTutorMessage(
    newState,
    nextStep,
    learnerUtterance
  );
  
  // Create turn for history
  const turn = {
    turnNumber: newState.turnCount + 1,
    learnerUtterance,
    tutorMessage: message,
    tutorQuestions: questions,
    scaffoldStep: nextStep,
    timestamp: new Date().toISOString(),
    observations
  };
  
  // Add to history (bounded)
  newState.history.push(turn);
  if (newState.history.length > MAX_HISTORY_TURNS) {
    newState.history = newState.history.slice(-MAX_HISTORY_TURNS);
  }
  newState.turnCount += 1;
  
  // Create plan
  const plan: TutorTurnPlan = {
    mode: newState.mode,
    message,
    questions,
    actions,
    shouldRefuse: false,
    uncertaintyNotes: newState.uncertainties.length > 0 ? [...newState.uncertainties] : undefined,
    nextSuggestedLearnerAction: learnerUtterance 
      ? "Continue thinking about this question."
      : "Share your thoughts or ask a question.",
    scaffoldStep: nextStep,
    observations
  };
  
  return {
    plan,
    newState,
    observations
  };
}








































