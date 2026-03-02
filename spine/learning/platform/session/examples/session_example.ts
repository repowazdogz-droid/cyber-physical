/**
 * Session Orchestrator Example
 * 
 * Simple usage example demonstrating the Learning Session Orchestrator.
 * 
 * Version: 0.1
 */

import {
  runLearningSession
} from "../SessionOrchestrator";
import {
  LearningSessionRequest
} from "../SessionTypes";
import { TutorMode } from "../../dialogue/DialogTypes";
import { AssessmentType } from "../../assessment/AssessmentTypes";
import { AgeBand } from "../../LearnerTypes";

/**
 * Example: Simple learning session
 */
export function runSimpleSessionExample() {
  const request: LearningSessionRequest = {
    sessionId: "example-session-1",
    learner: {
      learnerId: "learner-123",
      ageBand: AgeBand.ADULT,
      safety: {
        minor: false,
        institutionMode: false
      }
    },
    goal: {
      subject: "mathematics",
      topic: "fractions",
      objective: "understand how to add fractions with different denominators"
    },
    mode: TutorMode.Socratic,
    utterance: "I want to learn how to add 1/2 + 1/3"
  };
  
  const output = runLearningSession(request);
  
  console.log("=== Learning Session Output ===");
  console.log(`Session ID: ${output.sessionTrace.sessionId}`);
  console.log(`Turn Count: ${output.sessionTrace.turnCount}`);
  console.log(`\nTutor Turn:`);
  console.log(`  Message: ${output.tutorTurn.message}`);
  console.log(`  Questions: ${output.tutorTurn.questions.join(", ")}`);
  console.log(`  Scaffold Step: ${output.tutorTurn.scaffoldStep}`);
  console.log(`\nObservations: ${output.observations.length}`);
  output.observations.forEach((obs, i) => {
    console.log(`  ${i + 1}. ${obs.type}`);
  });
  console.log(`\nSkill Updates: ${output.skillGraphDelta.updates.length}`);
  console.log(`Assessment Generated: ${output.sessionTrace.assessmentGenerated}`);
  console.log(`Refusals: ${output.sessionTrace.refusals.length}`);
}

/**
 * Example: Session with assessment request
 */
export function runSessionWithAssessmentExample() {
  const request: LearningSessionRequest = {
    sessionId: "example-session-2",
    learner: {
      learnerId: "learner-456",
      ageBand: AgeBand.ADULT,
      safety: {
        minor: false,
        institutionMode: false
      }
    },
    goal: {
      subject: "mathematics",
      topic: "fractions",
      objective: "understand how to add fractions"
    },
    mode: TutorMode.Socratic,
    utterance: "I think I need to find a common denominator",
    requestedAssessment: AssessmentType.TeachBack
  };
  
  const output = runLearningSession(request);
  
  console.log("=== Session with Assessment ===");
  console.log(`Tutor Turn: ${output.tutorTurn.message}`);
  if (output.assessment) {
    console.log(`\nAssessment:`);
    console.log(`  Type: ${output.assessment.type}`);
    console.log(`  Prompt: ${output.assessment.prompt.substring(0, 100)}...`);
    console.log(`  Required Artifacts: ${output.assessment.requiredArtifacts.length}`);
  }
  console.log(`\nSkill Updates: ${output.skillGraphDelta.updates.length}`);
}

/**
 * Example: Multi-turn session
 */
export function runMultiTurnSessionExample() {
  let request: LearningSessionRequest = {
    sessionId: "example-session-3",
    learner: {
      learnerId: "learner-789",
      ageBand: AgeBand.ADULT,
      safety: {
        minor: false,
        institutionMode: false
      }
    },
    goal: {
      subject: "mathematics",
      topic: "fractions",
      objective: "understand how to add fractions"
    },
    mode: TutorMode.Socratic
  };
  
  // Turn 1: Initial turn
  let output = runLearningSession(request);
  console.log("=== Turn 1 ===");
  console.log(`Tutor: ${output.tutorTurn.message}`);
  
  // Turn 2: Learner responds
  request.utterance = "I want to learn how to add 1/2 + 1/3";
  output = runLearningSession(request, output.skillGraphDelta.newGraph, output.dialogueState);
  console.log("\n=== Turn 2 ===");
  console.log(`Learner: ${request.utterance}`);
  console.log(`Tutor: ${output.tutorTurn.message}`);
  console.log(`Observations: ${output.observations.length}`);
  console.log(`Skill Updates: ${output.skillGraphDelta.updates.length}`);
  
  // Turn 3: Learner makes attempt
  request.utterance = "I think I need to find a common denominator, like 6";
  output = runLearningSession(request, output.skillGraphDelta.newGraph, output.dialogueState);
  console.log("\n=== Turn 3 ===");
  console.log(`Learner: ${request.utterance}`);
  console.log(`Tutor: ${output.tutorTurn.message}`);
  console.log(`Observations: ${output.observations.length}`);
  console.log(`Skill Updates: ${output.skillGraphDelta.updates.length}`);
  
  console.log("\n=== Session Summary ===");
  console.log(`Total Turns: ${output.sessionTrace.turnCount}`);
  console.log(`Total Skill Updates: ${output.sessionTrace.skillUpdatesCount}`);
}

// Uncomment to run:
// runSimpleSessionExample();
// runSessionWithAssessmentExample();
// runMultiTurnSessionExample();








































