/**
 * Assessment Generator Example
 * 
 * Simple usage example demonstrating the Assessment Redesign Engine.
 * 
 * Version: 0.1
 */

import {
  generateAssessment
} from "../AssessmentGenerator";
import {
  AssessmentType,
  AssessmentRequest
} from "../AssessmentTypes";
import { AgeBand } from "../../LearnerTypes";

/**
 * Example: Generate a critique assessment
 */
export function runCritiqueExample() {
  const request: AssessmentRequest = {
    learnerId: "learner-123",
    ageBand: AgeBand.ADULT,
    subject: "mathematics",
    topic: "fractions",
    objective: "understand how to add fractions with different denominators",
    assessmentType: AssessmentType.CritiqueAIAnswer,
    contextFlags: {
      aiAllowed: false
    }
  };
  
  const output = generateAssessment(request);
  
  console.log("=== Assessment Output ===");
  console.log(`Assessment ID: ${output.assessmentId}`);
  console.log(`Type: ${output.type}`);
  console.log(`\nPrompt:\n${output.prompt}`);
  console.log(`\nRequired Artifacts:`);
  output.requiredArtifacts.forEach((artifact, i) => {
    console.log(`  ${i + 1}. ${artifact}`);
  });
  console.log(`\nIntegrity Checks:`);
  output.integrityChecks.forEach((check, i) => {
    console.log(`  ${i + 1}. ${check}`);
  });
  console.log(`\nAI Usage Policy:\n${output.aiUsagePolicy}`);
  console.log(`\nRubric Dimensions: ${output.rubric.dimensions.length}`);
  console.log(`Overall Guidance: ${output.rubric.overallGuidance}`);
}

/**
 * Example: Generate a teach-back assessment for younger learner
 */
export function runTeachBackExample() {
  const request: AssessmentRequest = {
    learnerId: "learner-456",
    ageBand: AgeBand.TEN_TO_TWELVE,
    subject: "science",
    topic: "photosynthesis",
    objective: "explain how plants make food",
    assessmentType: AssessmentType.TeachBack,
    contextFlags: {
      isTeacherPresent: true
    }
  };
  
  const output = generateAssessment(request);
  
  console.log("=== Teach-Back Assessment (Ages 10-12) ===");
  console.log(`Assessment ID: ${output.assessmentId}`);
  console.log(`Type: ${output.type}`);
  console.log(`\nPrompt:\n${output.prompt}`);
  console.log(`\nShould Refuse: ${output.shouldRefuse}`);
}

/**
 * Example: High stakes assessment blocked for minor
 */
export function runBlockedExample() {
  const request: AssessmentRequest = {
    learnerId: "learner-789",
    ageBand: AgeBand.SIX_TO_NINE,
    subject: "mathematics",
    topic: "addition",
    objective: "test understanding of addition",
    assessmentType: AssessmentType.OralReasoning,
    contextFlags: {
      isHighStakesAssessment: true,
      isTeacherPresent: false
    }
  };
  
  const output = generateAssessment(request);
  
  console.log("=== Blocked Assessment Example ===");
  console.log(`Assessment ID: ${output.assessmentId}`);
  console.log(`Should Refuse: ${output.shouldRefuse}`);
  console.log(`Refusal Reason: ${output.refusalReason}`);
}

// Uncomment to run:
// runCritiqueExample();
// runTeachBackExample();
// runBlockedExample();








































