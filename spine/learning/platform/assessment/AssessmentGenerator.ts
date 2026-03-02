/**
 * Assessment Generator
 * 
 * Generates assessments deterministically per Contract 70.
 * Applies age band restrictions and anti-cheating constraints.
 * 
 * Version: 0.1
 */

import {
  AssessmentRequest,
  AssessmentOutput,
  AssessmentType,
  AssessmentContextFlags,
  containsProhibitedMetrics
} from "./AssessmentTypes";
import { AgeBand } from "../LearnerTypes";
import { buildRubric } from "./RubricBuilder";

/**
 * Simple deterministic hash function.
 * Generates a consistent hash from input string.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}

/**
 * Generates a deterministic assessment ID from request inputs.
 */
function generateAssessmentId(request: AssessmentRequest): string {
  const input = JSON.stringify({
    learnerId: request.learnerId,
    ageBand: request.ageBand,
    subject: request.subject,
    topic: request.topic,
    objective: request.objective,
    assessmentType: request.assessmentType
  });
  
  return simpleHash(input);
}

/**
 * Checks age band restrictions per Contract 71.
 * Returns refusal reason if blocked, null otherwise.
 */
function checkAgeBandRestrictions(
  request: AssessmentRequest
): string | null {
  const ageBand = request.ageBand;
  const contextFlags = request.contextFlags || {};
  
  // Ages 6-9 and 10-12: restrictions apply
  if (ageBand === AgeBand.SIX_TO_NINE || ageBand === AgeBand.TEN_TO_TWELVE) {
    // High stakes assessment blocked for minors without teacher
    if (contextFlags.isHighStakesAssessment && !contextFlags.isTeacherPresent) {
      return "HighStakesAssessmentNotAllowed";
    }
    
    // OralReasoning that mimics exams requires teacher presence
    if (request.assessmentType === AssessmentType.OralReasoning &&
        !contextFlags.isTeacherPresent &&
        contextFlags.isHighStakesAssessment) {
      return "AgeBandRestriction";
    }
  }
  
  return null;
}

/**
 * Generates assessment prompt based on type and age band.
 */
function generatePrompt(
  request: AssessmentRequest,
  assessmentType: AssessmentType
): string {
  const { topic, objective, ageBand } = request;
  const isYoung = ageBand === AgeBand.SIX_TO_NINE || ageBand === AgeBand.TEN_TO_TWELVE;
  
  // Adjust language and complexity for younger learners
  const complexity = isYoung ? "simple and concrete" : "detailed";
  
  switch (assessmentType) {
    case AssessmentType.CritiqueAIAnswer:
      return isYoung
        ? `I'll give you an answer about ${topic}. Your job is to tell me what you think about it. Is it good? What's missing? What do you like?`
        : `Here's an AI-generated answer about ${topic}: [AI answer will be provided]. Your task is to critique this answer. Evaluate its strengths and weaknesses, assess the reasoning, and provide constructive feedback. Focus on the quality of the argument, not just whether you agree.`;
        
    case AssessmentType.OralReasoning:
      return isYoung
        ? `Let's talk about ${topic}. I want to hear how you think about it. Explain your ideas out loud.`
        : `Explain your reasoning process for ${objective} related to ${topic}. Walk through your thinking step by step, and be prepared to answer questions about your reasoning. The process matters more than getting a "right" answer.`;
        
    case AssessmentType.IterationLog:
      return isYoung
        ? `Show me how you worked on ${topic}. Tell me what you tried first, what changed, and why.`
        : `Document your thinking process for ${objective} related to ${topic}. Show your iterations: what you tried first, what changed, why you revised, and how your understanding improved. Multiple revisions are valued positively.`;
        
    case AssessmentType.Synthesis:
      return isYoung
        ? `I'll give you some ideas about ${topic}. Your job is to put them together and explain what they mean.`
        : `Synthesize information from multiple sources about ${topic} to address ${objective}. Show how you integrate different perspectives, make connections, and create coherent understanding. Quality of synthesis matters more than completeness.`;
        
    case AssessmentType.TeachBack:
      return isYoung
        ? `Explain ${topic} to me like you're teaching it. Use your own words and examples.`
        : `Teach back the concept of ${topic} as it relates to ${objective}. Explain it clearly, use examples, and adapt your explanation. Your teaching quality indicates your understanding depth.`;
  }
}

/**
 * Generates required artifacts based on assessment type.
 */
function generateRequiredArtifacts(assessmentType: AssessmentType): string[] {
  switch (assessmentType) {
    case AssessmentType.CritiqueAIAnswer:
      return [
        "Critique of the AI answer",
        "Identification of strengths and weaknesses",
        "Evaluation of reasoning quality",
        "Source list (if evidence used)"
      ];
      
    case AssessmentType.OralReasoning:
      return [
        "Verbal reasoning explanation",
        "Response to follow-up questions",
        "Uncertainty notes (where applicable)",
        "Revision log (if reasoning changed)"
      ];
      
    case AssessmentType.IterationLog:
      return [
        "Complete iteration history",
        "Revision log with reasoning",
        "Evidence of improvement over iterations",
        "Reflection on what changed and why"
      ];
      
    case AssessmentType.Synthesis:
      return [
        "Synthesis of multiple sources",
        "Source list with evaluation",
        "Connection map or outline",
        "Uncertainty notes (where applicable)"
      ];
      
    case AssessmentType.TeachBack:
      return [
        "Teaching explanation",
        "Examples used",
        "Response to questions",
        "Revision log (if explanation improved)"
      ];
  }
}

/**
 * Generates integrity checks based on assessment type.
 */
function generateIntegrityChecks(assessmentType: AssessmentType): string[] {
  const baseChecks = [
    "Explain your reasoning process",
    "Show your work and thinking steps",
    "Identify any uncertainties or assumptions"
  ];
  
  switch (assessmentType) {
    case AssessmentType.CritiqueAIAnswer:
      return [
        ...baseChecks,
        "Explain why you trust or don't trust the AI answer",
        "Provide evidence for your critique",
        "Show how you evaluated the reasoning"
      ];
      
    case AssessmentType.OralReasoning:
      return [
        ...baseChecks,
        "Answer follow-up questions about your reasoning",
        "Explain how you arrived at your conclusions",
        "Acknowledge any uncertainties"
      ];
      
    case AssessmentType.IterationLog:
      return [
        ...baseChecks,
        "Show complete revision history",
        "Explain what triggered each revision",
        "Demonstrate improvement over iterations"
      ];
      
    case AssessmentType.Synthesis:
      return [
        ...baseChecks,
        "Explain why you trust each source",
        "Show how you integrated different perspectives",
        "Identify any conflicting information"
      ];
      
    case AssessmentType.TeachBack:
      return [
        ...baseChecks,
        "Answer questions about your explanation",
        "Show how you adapted your teaching",
        "Demonstrate understanding through examples"
      ];
  }
}

/**
 * Generates AI usage policy based on context flags.
 */
function generateAIUsagePolicy(
  contextFlags?: AssessmentContextFlags
): string {
  const aiAllowed = contextFlags?.aiAllowed ?? false;
  
  if (aiAllowed) {
    return `AI tools are allowed for this assessment. However, you must:
- Document how you used AI tools
- Explain your reasoning process, not just the final answer
- Show your work and thinking steps
- Verify any information provided by AI
- Cite AI-generated content appropriately
- Demonstrate your own understanding through explanation`;
  } else {
    return `AI tools are not allowed for this assessment. You must:
- Work independently
- Show your own reasoning process
- Demonstrate your understanding through explanation
- Not use AI to generate answers or reasoning
- Use your own words and thinking`;
  }
}

/**
 * Generates assessment output deterministically.
 * Per Contract 70: no scores, grades, ranks, or speed metrics.
 */
export function generateAssessment(
  request: AssessmentRequest
): AssessmentOutput {
  // Check for prohibited metrics in human-facing content fields only (not structural keys)
  // Scan only: subject, topic, objective (user-provided content)
  // Skip: assessmentType, learnerId, ageBand (structural identifiers)
  const fieldsToScan: string[] = [
    request.subject ?? "",
    request.topic ?? "",
    request.objective ?? ""
  ].filter(Boolean);

  const combined = fieldsToScan.join("\n");
  if (containsProhibitedMetrics(combined)) {
    throw new Error("Assessment request contains prohibited metrics");
  }
  
  // Check age band restrictions
  const refusalReason = checkAgeBandRestrictions(request);
  if (refusalReason) {
    return {
      assessmentId: generateAssessmentId(request),
      type: request.assessmentType,
      prompt: "",
      requiredArtifacts: [],
      rubric: buildRubric(request.assessmentType),
      integrityChecks: [],
      aiUsagePolicy: "",
      shouldRefuse: true,
      refusalReason,
      ageBand: request.ageBand,
      subject: request.subject,
      topic: request.topic,
      objective: request.objective
    };
  }
  
  // Generate prompt
  const prompt = generatePrompt(request, request.assessmentType);
  
  // Verify prompt doesn't contain prohibited metrics
  if (containsProhibitedMetrics(prompt)) {
    throw new Error("Generated prompt contains prohibited metrics");
  }
  
  // Build rubric
  const rubric = buildRubric(request.assessmentType);
  
  // Verify rubric doesn't contain prohibited metrics
  const rubricText = JSON.stringify(rubric);
  if (containsProhibitedMetrics(rubricText)) {
    throw new Error("Generated rubric contains prohibited metrics");
  }
  
  // Generate required artifacts
  const requiredArtifacts = generateRequiredArtifacts(request.assessmentType);
  
  // Generate integrity checks
  const integrityChecks = generateIntegrityChecks(request.assessmentType);
  
  // Generate AI usage policy
  const aiUsagePolicy = generateAIUsagePolicy(request.contextFlags);
  
  return {
    assessmentId: generateAssessmentId(request),
    type: request.assessmentType,
    prompt,
    requiredArtifacts,
    rubric,
    integrityChecks,
    aiUsagePolicy,
    shouldRefuse: false,
    ageBand: request.ageBand,
    subject: request.subject,
    topic: request.topic,
    objective: request.objective
  };
}

