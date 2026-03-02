/**
 * Rubric Builder
 * 
 * Deterministic rubric generation per Contract 70.
 * No numeric scores: uses bands (Emerging, Developing, Strong).
 * 
 * Version: 0.1
 */

import {
  RubricDimension,
  RubricDimensionDefinition,
  AssessmentRubric,
  AssessmentType
} from "./AssessmentTypes";

/**
 * Builds rubric dimension definitions per Contract 70.
 * Deterministic: same inputs produce same outputs.
 */
function buildDimensionDefinition(
  dimension: RubricDimension
): RubricDimensionDefinition {
  switch (dimension) {
    case RubricDimension.Clarity:
      return {
        dimension: RubricDimension.Clarity,
        description: "How clearly the learner expresses ideas and communicates reasoning",
        strongIndicators: [
          "Clear articulation of reasoning steps",
          "Logical flow of explanation",
          "Appropriate use of examples",
          "Easy to follow and understand"
        ],
        developingIndicators: [
          "Mostly clear with some gaps",
          "Reasonable flow with occasional jumps",
          "Some examples provided",
          "Generally understandable"
        ],
        emergingIndicators: [
          "Unclear or confusing expression",
          "Jumps in reasoning without explanation",
          "Few or no examples",
          "Difficult to follow"
        ],
        commonFailureModes: [
          "Assuming reader knows background not stated",
          "Using jargon without explanation",
          "Skipping logical steps"
        ]
      };
      
    case RubricDimension.EvidenceUse:
      return {
        dimension: RubricDimension.EvidenceUse,
        description: "How well the learner uses evidence to support claims",
        strongIndicators: [
          "Appropriate evidence selection",
          "Critical evaluation of evidence quality",
          "Proper distinction between evidence and opinion",
          "Multiple sources when appropriate"
        ],
        developingIndicators: [
          "Some evidence provided",
          "Basic evaluation of sources",
          "Mostly distinguishes evidence from opinion",
          "Limited source variety"
        ],
        emergingIndicators: [
          "Little or no evidence",
          "No evaluation of source quality",
          "Confuses opinion with evidence",
          "Single source or no sources"
        ],
        commonFailureModes: [
          "Using evidence without evaluating it",
          "Treating all sources as equally reliable",
          "Using opinion as if it were evidence"
        ]
      };
      
    case RubricDimension.UncertaintyHandling:
      return {
        dimension: RubricDimension.UncertaintyHandling,
        description: "How well the learner acknowledges and handles uncertainty",
        strongIndicators: [
          "Explicit acknowledgment of uncertainty",
          "Appropriate confidence calibration",
          "Honest admission when information is unknown",
          "Distinguishes facts from assumptions"
        ],
        developingIndicators: [
          "Some acknowledgment of uncertainty",
          "Basic confidence calibration",
          "Occasionally admits unknowns",
          "Some distinction between facts and assumptions"
        ],
        emergingIndicators: [
          "No acknowledgment of uncertainty",
          "Overconfident or underconfident",
          "Never admits unknowns",
          "No distinction between facts and assumptions"
        ],
        commonFailureModes: [
          "Pretending certainty when uncertain",
          "Hiding uncertainty to appear knowledgeable",
          "Treating assumptions as facts"
        ]
      };
      
    case RubricDimension.RevisionQuality:
      return {
        dimension: RubricDimension.RevisionQuality,
        description: "How well the learner revises based on new information or feedback",
        strongIndicators: [
          "Willingness to revise when evidence changes",
          "Quality of revision reasoning",
          "Improvement over iterations",
          "Positive response to feedback"
        ],
        developingIndicators: [
          "Some willingness to revise",
          "Basic revision reasoning",
          "Some improvement over iterations",
          "Generally accepts feedback"
        ],
        emergingIndicators: [
          "Resistance to revision",
          "No clear revision reasoning",
          "Little improvement over iterations",
          "Defensive response to feedback"
        ],
        commonFailureModes: [
          "Refusing to revise even when wrong",
          "Revising without explaining why",
          "Treating revision as failure"
        ]
      };
      
    case RubricDimension.TradeoffAwareness:
      return {
        dimension: RubricDimension.TradeoffAwareness,
        description: "How well the learner identifies and weighs trade-offs",
        strongIndicators: [
          "Identification of relevant trade-offs",
          "Appropriate weighing of alternatives",
          "Clear explanation of decision rationale",
          "Acknowledgment of costs and benefits"
        ],
        developingIndicators: [
          "Some trade-offs identified",
          "Basic weighing of alternatives",
          "Some explanation of decisions",
          "Partial acknowledgment of costs and benefits"
        ],
        emergingIndicators: [
          "No trade-offs identified",
          "No weighing of alternatives",
          "No explanation of decisions",
          "Ignores costs and benefits"
        ],
        commonFailureModes: [
          "Pretending there are no trade-offs",
          "Only considering benefits, not costs",
          "Making decisions without rationale"
        ]
      };
      
    case RubricDimension.VerificationHabits:
      return {
        dimension: RubricDimension.VerificationHabits,
        description: "How well the learner verifies claims and evaluates sources",
        strongIndicators: [
          "Regular verification of claims",
          "Critical source evaluation",
          "Cross-checking information",
          "Skeptical but not cynical"
        ],
        developingIndicators: [
          "Some verification of claims",
          "Basic source evaluation",
          "Occasional cross-checking",
          "Developing skepticism"
        ],
        emergingIndicators: [
          "No verification of claims",
          "No source evaluation",
          "No cross-checking",
          "Accepts information uncritically"
        ],
        commonFailureModes: [
          "Trusting sources without evaluation",
          "Not verifying surprising claims",
          "Accepting information at face value"
        ]
      };
  }
}

/**
 * Builds complete rubric for an assessment type.
 * All dimensions are included, but weighting may vary by type.
 */
export function buildRubric(assessmentType: AssessmentType): AssessmentRubric {
  // All dimensions are required per Contract 70
  const dimensions: RubricDimensionDefinition[] = [
    buildDimensionDefinition(RubricDimension.Clarity),
    buildDimensionDefinition(RubricDimension.EvidenceUse),
    buildDimensionDefinition(RubricDimension.UncertaintyHandling),
    buildDimensionDefinition(RubricDimension.RevisionQuality),
    buildDimensionDefinition(RubricDimension.TradeoffAwareness),
    buildDimensionDefinition(RubricDimension.VerificationHabits)
  ];
  
  // Overall guidance varies by assessment type
  let overallGuidance = "";
  
  switch (assessmentType) {
    case AssessmentType.CritiqueAIAnswer:
      overallGuidance = "Focus on the quality of critique: how well the learner identifies strengths and weaknesses, evaluates reasoning, and provides constructive feedback. Process matters more than agreement with the critique.";
      break;
      
    case AssessmentType.OralReasoning:
      overallGuidance = "Focus on how well the learner articulates their thinking process. The ability to explain reasoning clearly and respond to questions is more important than getting the 'right' answer.";
      break;
      
    case AssessmentType.IterationLog:
      overallGuidance = "Focus on the revision process: how the learner's thinking evolved, what triggered revisions, and how they improved over iterations. Multiple revisions are valued positively.";
      break;
      
    case AssessmentType.Synthesis:
      overallGuidance = "Focus on how well the learner integrates multiple sources or concepts, makes connections, and creates coherent understanding. Synthesis quality matters more than completeness.";
      break;
      
    case AssessmentType.TeachBack:
      overallGuidance = "Focus on how clearly the learner explains concepts, uses examples, and adapts explanations. Teaching quality indicates understanding depth.";
      break;
  }
  
  return {
    dimensions,
    overallGuidance
  };
}








































