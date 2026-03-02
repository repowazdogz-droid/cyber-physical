/**
 * Scaffold Ladder
 * 
 * Defines scaffold ladder steps and transition rules per Contract 69.
 * Enforces "no answer dumping" policy through structured progression.
 * 
 * Version: 0.1
 */

import { ScaffoldStep, DialogueState } from "./DialogTypes";

/**
 * Scaffold ladder step definitions with progression rules.
 * Per Contract 69 scaffold ladder principle.
 */
export interface ScaffoldStepDefinition {
  step: ScaffoldStep;
  canAdvanceTo: ScaffoldStep[];
  canRevealSolution: boolean;
  requiresAttempt: boolean;
  requiresHintOrCounterexample: boolean;
}

/**
 * Scaffold ladder configuration.
 * Defines valid transitions and constraints.
 */
const SCAFFOLD_LADDER: Map<ScaffoldStep, ScaffoldStepDefinition> = new Map([
  [ScaffoldStep.ClarifyGoal, {
    step: ScaffoldStep.ClarifyGoal,
    canAdvanceTo: [ScaffoldStep.ElicitPriorKnowledge],
    canRevealSolution: false,
    requiresAttempt: false,
    requiresHintOrCounterexample: false
  }],
  [ScaffoldStep.ElicitPriorKnowledge, {
    step: ScaffoldStep.ElicitPriorKnowledge,
    canAdvanceTo: [ScaffoldStep.AskForAttempt, ScaffoldStep.ClarifyGoal],
    canRevealSolution: false,
    requiresAttempt: false,
    requiresHintOrCounterexample: false
  }],
  [ScaffoldStep.AskForAttempt, {
    step: ScaffoldStep.AskForAttempt,
    canAdvanceTo: [ScaffoldStep.AskForReasoning, ScaffoldStep.OfferHint, ScaffoldStep.ElicitPriorKnowledge],
    canRevealSolution: false,
    requiresAttempt: false,
    requiresHintOrCounterexample: false
  }],
  [ScaffoldStep.AskForReasoning, {
    step: ScaffoldStep.AskForReasoning,
    canAdvanceTo: [ScaffoldStep.OfferHint, ScaffoldStep.OfferCounterexampleOrTest, ScaffoldStep.AskForAttempt],
    canRevealSolution: false,
    requiresAttempt: true,
    requiresHintOrCounterexample: false
  }],
  [ScaffoldStep.OfferHint, {
    step: ScaffoldStep.OfferHint,
    canAdvanceTo: [ScaffoldStep.AskForReasoning, ScaffoldStep.OfferCounterexampleOrTest, ScaffoldStep.RevealMinimalSolution],
    canRevealSolution: false,
    requiresAttempt: true,
    requiresHintOrCounterexample: false
  }],
  [ScaffoldStep.OfferCounterexampleOrTest, {
    step: ScaffoldStep.OfferCounterexampleOrTest,
    canAdvanceTo: [ScaffoldStep.AskForReasoning, ScaffoldStep.OfferHint, ScaffoldStep.RevealMinimalSolution],
    canRevealSolution: false,
    requiresAttempt: true,
    requiresHintOrCounterexample: false
  }],
  [ScaffoldStep.RevealMinimalSolution, {
    step: ScaffoldStep.RevealMinimalSolution,
    canAdvanceTo: [ScaffoldStep.ReflectAndGeneralize],
    canRevealSolution: true,
    requiresAttempt: true,
    requiresHintOrCounterexample: true
  }],
  [ScaffoldStep.ReflectAndGeneralize, {
    step: ScaffoldStep.ReflectAndGeneralize,
    canAdvanceTo: [],
    canRevealSolution: true,
    requiresAttempt: true,
    requiresHintOrCounterexample: false
  }]
]);

/**
 * Checks if a transition from current step to next step is valid.
 */
export function canTransitionTo(
  currentStep: ScaffoldStep,
  nextStep: ScaffoldStep
): boolean {
  const current = SCAFFOLD_LADDER.get(currentStep);
  if (!current) return false;
  
  return current.canAdvanceTo.includes(nextStep);
}

/**
 * Checks if solution can be revealed at the current step.
 * Per Contract 69: solution can only be revealed if:
 * 1. Learner has made an attempt, AND
 * 2. Either:
 *    - System has offered hint/counterexample at least once, OR
 *    - Learner explicitly requested solution AND system has tried hint/counterexample
 */
export function canRevealSolution(
  state: DialogueState
): boolean {
  const current = SCAFFOLD_LADDER.get(state.currentStep);
  if (!current) return false;
  
  // Must have made an attempt
  if (!state.hasMadeAttempt) return false;
  
  // Must have offered hint or counterexample at least once
  if (state.hintsOffered === 0 && state.counterexamplesOffered === 0) {
    return false;
  }
  
  // Check if we can transition to RevealMinimalSolution from current step
  if (canTransitionTo(state.currentStep, ScaffoldStep.RevealMinimalSolution)) {
    return true;
  }
  
  // Or if we're already at a step that allows solution revelation
  if (current.canRevealSolution) {
    return true;
  }
  
  return false;
}

/**
 * Determines the next scaffold step based on current state and learner response.
 * Enforces ladder rules: never skip more than one rung.
 */
export function determineNextStep(
  state: DialogueState,
  learnerResponse: string
): ScaffoldStep {
  const current = SCAFFOLD_LADDER.get(state.currentStep);
  if (!current) return state.currentStep;
  
  // Analyze learner response to determine next step
  const responseLower = learnerResponse.toLowerCase();
  
  // If learner explicitly requests solution
  if (responseLower.includes("solution") || 
      responseLower.includes("answer") || 
      responseLower.includes("tell me") ||
      responseLower.includes("can you tell")) {
    state.hasRequestedSolution = true;
    
    // Can only reveal if conditions are met
    if (canRevealSolution(state)) {
      return ScaffoldStep.RevealMinimalSolution;
    }
    // Otherwise, offer hint or counterexample if not already done
    if (state.hintsOffered === 0) {
      return ScaffoldStep.OfferHint;
    }
    if (state.counterexamplesOffered === 0) {
      return ScaffoldStep.OfferCounterexampleOrTest;
    }
  }
  
  // If learner makes an attempt (provides reasoning or answer)
  if (responseLower.length > 20 && 
      (responseLower.includes("because") || 
       responseLower.includes("think") || 
       responseLower.includes("reason") ||
       responseLower.includes("try"))) {
    state.hasMadeAttempt = true;
    
    // Progress to reasoning or hint based on current step
    if (state.currentStep === ScaffoldStep.AskForAttempt) {
      return ScaffoldStep.AskForReasoning;
    }
    if (state.currentStep === ScaffoldStep.AskForReasoning) {
      // Offer hint if not done, otherwise counterexample
      if (state.hintsOffered === 0) {
        return ScaffoldStep.OfferHint;
      }
      return ScaffoldStep.OfferCounterexampleOrTest;
    }
  }
  
  // If learner asks clarifying question, stay at current step or go back
  if (responseLower.includes("?") || 
      (responseLower.includes("what") && responseLower.includes("?")) || 
      (responseLower.includes("how") && responseLower.includes("?")) ||
      (responseLower.includes("why") && responseLower.includes("?"))) {
    // Stay at current step to address clarification
    return state.currentStep;
  }
  
  // If at ClarifyGoal and learner provides a substantive response about their goal
  if (state.currentStep === ScaffoldStep.ClarifyGoal && 
      responseLower.length > 15 &&
      (responseLower.includes("want") || 
       responseLower.includes("learn") || 
       responseLower.includes("understand") ||
       responseLower.includes("goal"))) {
    // Advance to next step
    if (current.canAdvanceTo.length > 0) {
      return current.canAdvanceTo[0];
    }
  }
  
  // If learner provides a substantive response (not just a question), advance
  if (responseLower.length > 10 && !responseLower.includes("?")) {
    // Default progression: advance one step if possible
    if (current.canAdvanceTo.length > 0) {
      const nextStep = current.canAdvanceTo[0];
      if (canTransitionTo(state.currentStep, nextStep)) {
        return nextStep;
      }
    }
  }
  
  // Stay at current step if no valid transition
  return state.currentStep;
}

/**
 * Gets scaffold step definition.
 */
export function getScaffoldStepDefinition(step: ScaffoldStep): ScaffoldStepDefinition | undefined {
  return SCAFFOLD_LADDER.get(step);
}




