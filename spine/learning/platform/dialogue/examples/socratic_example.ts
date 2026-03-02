/**
 * Socratic Dialogue Example
 * 
 * Simple usage example demonstrating the Socratic Dialogue Protocol.
 * 
 * Version: 0.1
 */

import {
  createDialogueState,
  planNextTurn
} from "../TurnPlanner";
import { TutorMode, ContextFlags } from "../DialogTypes";
import { AgeBand } from "../../LearnerTypes";

/**
 * Example: Simple Socratic dialogue session
 */
export function runSocraticExample() {
  // Create initial dialogue state
  const state = createDialogueState(
    "example-session-1",
    {
      learnerId: "learner-123",
      ageBand: AgeBand.ADULT,
      safety: {
        minor: false,
        institutionMode: false
      }
    },
    TutorMode.Socratic,
    "fractions",
    "understand how to add fractions with different denominators"
  );
  
  console.log("=== Socratic Dialogue Example ===\n");
  
  // Turn 1: Initial tutor prompt
  let result = planNextTurn(state);
  console.log(`Turn ${result.newState.turnCount}:`);
  console.log(`Tutor: ${result.plan.message}`);
  console.log(`Questions: ${result.plan.questions.join(", ")}`);
  console.log(`Scaffold Step: ${result.plan.scaffoldStep}\n`);
  
  // Turn 2: Learner responds with goal
  result = planNextTurn(result.newState, "I want to learn how to add 1/2 + 1/3");
  console.log(`Turn ${result.newState.turnCount}:`);
  console.log(`Learner: I want to learn how to add 1/2 + 1/3`);
  console.log(`Tutor: ${result.plan.message}`);
  console.log(`Scaffold Step: ${result.plan.scaffoldStep}`);
  console.log(`Observations: ${result.observations.map(o => o.type).join(", ")}\n`);
  
  // Turn 3: Learner makes an attempt
  result = planNextTurn(result.newState, "I think I need to find a common denominator. Let me try 6 because 2 and 3 both go into it.");
  console.log(`Turn ${result.newState.turnCount}:`);
  console.log(`Learner: I think I need to find a common denominator...`);
  console.log(`Tutor: ${result.plan.message}`);
  console.log(`Scaffold Step: ${result.plan.scaffoldStep}`);
  console.log(`Observations: ${result.observations.map(o => o.type).join(", ")}\n`);
  
  // Turn 4: Tutor asks for reasoning
  result = planNextTurn(result.newState, "I converted 1/2 to 3/6 and 1/3 to 2/6, then added to get 5/6");
  console.log(`Turn ${result.newState.turnCount}:`);
  console.log(`Learner: I converted 1/2 to 3/6 and 1/3 to 2/6...`);
  console.log(`Tutor: ${result.plan.message}`);
  console.log(`Scaffold Step: ${result.plan.scaffoldStep}\n`);
  
  console.log("=== Session Summary ===");
  console.log(`Total turns: ${result.newState.turnCount}`);
  console.log(`Final scaffold step: ${result.newState.currentStep}`);
  console.log(`Has made attempt: ${result.newState.hasMadeAttempt}`);
  console.log(`Hints offered: ${result.newState.hintsOffered}`);
  console.log(`History length: ${result.newState.history.length}`);
}

// Uncomment to run:
// runSocraticExample();








































