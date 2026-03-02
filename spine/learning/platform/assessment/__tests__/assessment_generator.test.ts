/**
 * Assessment Generator Tests
 * 
 * Tests for determinism, age band gating, prohibited metrics enforcement,
 * and output schema validity per Contract 70.
 * 
 * Version: 0.1
 */

import { describe, it, expect } from "vitest";
import {
  generateAssessment
} from "../AssessmentGenerator";
import {
  AssessmentType,
  AssessmentRequest,
  AssessmentContextFlags,
  containsProhibitedMetrics,
  PROHIBITED_METRICS
} from "../AssessmentTypes";
import { AgeBand } from "../../LearnerTypes";

/**
 * Helper to create a test assessment request
 */
function createTestRequest(
  assessmentType: AssessmentType = AssessmentType.CritiqueAIAnswer,
  ageBand: AgeBand = AgeBand.ADULT,
  contextFlags?: AssessmentContextFlags
): AssessmentRequest {
  return {
    learnerId: "test-learner-1",
    ageBand,
    subject: "mathematics",
    topic: "fractions",
    objective: "understand how to add fractions",
    assessmentType,
    contextFlags
  };
}

describe("AssessmentGenerator", () => {
  describe("Determinism", () => {
    it("should produce identical outputs for identical inputs", () => {
      const request1 = createTestRequest();
      const request2 = createTestRequest();
      
      const output1 = generateAssessment(request1);
      const output2 = generateAssessment(request2);
      
      expect(output1.assessmentId).toBe(output2.assessmentId);
      expect(output1.prompt).toBe(output2.prompt);
      expect(output1.requiredArtifacts).toEqual(output2.requiredArtifacts);
      expect(output1.integrityChecks).toEqual(output2.integrityChecks);
    });
    
    it("should produce same result when called multiple times", () => {
      const request = createTestRequest();
      
      const output1 = generateAssessment(request);
      const output2 = generateAssessment(request);
      
      expect(output1.assessmentId).toBe(output2.assessmentId);
      expect(output1.prompt).toBe(output2.prompt);
    });
  });
  
  describe("Age Band Gating", () => {
    it("should block high stakes assessment for ages 6-9 without teacher", () => {
      const request = createTestRequest(
        AssessmentType.OralReasoning,
        AgeBand.SIX_TO_NINE,
        {
          isHighStakesAssessment: true,
          isTeacherPresent: false
        }
      );
      
      const output = generateAssessment(request);
      
      expect(output.shouldRefuse).toBe(true);
      expect(output.refusalReason).toBe("HighStakesAssessmentNotAllowed");
    });
    
    it("should allow high stakes assessment for ages 6-9 with teacher", () => {
      const request = createTestRequest(
        AssessmentType.OralReasoning,
        AgeBand.SIX_TO_NINE,
        {
          isHighStakesAssessment: true,
          isTeacherPresent: true
        }
      );
      
      const output = generateAssessment(request);
      
      expect(output.shouldRefuse).toBe(false);
    });
    
    it("should block high stakes assessment for ages 10-12 without teacher", () => {
      const request = createTestRequest(
        AssessmentType.OralReasoning,
        AgeBand.TEN_TO_TWELVE,
        {
          isHighStakesAssessment: true,
          isTeacherPresent: false
        }
      );
      
      const output = generateAssessment(request);
      
      expect(output.shouldRefuse).toBe(true);
      expect(output.refusalReason).toBe("HighStakesAssessmentNotAllowed");
    });
    
    it("should allow regular assessment for ages 6-9 without high stakes flag", () => {
      const request = createTestRequest(
        AssessmentType.TeachBack,
        AgeBand.SIX_TO_NINE,
        {
          isTeacherPresent: false
        }
      );
      
      const output = generateAssessment(request);
      
      expect(output.shouldRefuse).toBe(false);
    });
  });
  
  describe("Prohibited Metrics Enforcement", () => {
    it("should not contain prohibited metrics in prompt", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      // Use the same word-boundary-aware checker as the generator
      expect(containsProhibitedMetrics(output.prompt)).toBe(false);
    });
    
    it("should not contain prohibited metrics in rubric", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      const rubricText = JSON.stringify(output.rubric);
      
      // Use the same word-boundary-aware checker as the generator
      expect(containsProhibitedMetrics(rubricText)).toBe(false);
    });
    
    it("should not contain prohibited metrics in integrity checks", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      const checksText = output.integrityChecks.join(" ");
      
      // Use the same word-boundary-aware checker as the generator
      expect(containsProhibitedMetrics(checksText)).toBe(false);
    });
    
    it("should not contain prohibited metrics in AI usage policy", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      PROHIBITED_METRICS.forEach(metric => {
        expect(output.aiUsagePolicy.toLowerCase()).not.toContain(metric.toLowerCase());
      });
    });
    
    it("should detect prohibited metrics in text", () => {
      expect(containsProhibitedMetrics("This has a speed metric")).toBe(true);
      expect(containsProhibitedMetrics("This has a score")).toBe(true);
      expect(containsProhibitedMetrics("This has a rank")).toBe(true);
      expect(containsProhibitedMetrics("This is fine")).toBe(false);
    });
  });
  
  describe("Output Schema Validity", () => {
    it("should include all required fields", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      expect(output.assessmentId).toBeDefined();
      expect(output.type).toBeDefined();
      expect(output.prompt).toBeDefined();
      expect(output.requiredArtifacts).toBeDefined();
      expect(output.rubric).toBeDefined();
      expect(output.integrityChecks).toBeDefined();
      expect(output.aiUsagePolicy).toBeDefined();
      expect(output.shouldRefuse).toBeDefined();
      expect(output.ageBand).toBeDefined();
      expect(output.subject).toBeDefined();
      expect(output.topic).toBeDefined();
      expect(output.objective).toBeDefined();
    });
    
    it("should have assessmentId as deterministic hash", () => {
      const request1 = createTestRequest();
      const request2 = createTestRequest();
      
      const output1 = generateAssessment(request1);
      const output2 = generateAssessment(request2);
      
      expect(output1.assessmentId).toBe(output2.assessmentId);
      expect(output1.assessmentId.length).toBeGreaterThan(0);
    });
    
    it("should have all rubric dimensions", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      expect(output.rubric.dimensions.length).toBe(6);
      expect(output.rubric.overallGuidance).toBeDefined();
    });
    
    it("should have required artifacts array", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      expect(Array.isArray(output.requiredArtifacts)).toBe(true);
      expect(output.requiredArtifacts.length).toBeGreaterThan(0);
    });
    
    it("should have integrity checks array", () => {
      const request = createTestRequest();
      const output = generateAssessment(request);
      
      expect(Array.isArray(output.integrityChecks)).toBe(true);
      expect(output.integrityChecks.length).toBeGreaterThan(0);
    });
  });
  
  describe("Assessment Type Variations", () => {
    it("should generate different prompts for different types", () => {
      const types = [
        AssessmentType.CritiqueAIAnswer,
        AssessmentType.OralReasoning,
        AssessmentType.IterationLog,
        AssessmentType.Synthesis,
        AssessmentType.TeachBack
      ];
      
      const prompts = types.map(type => {
        const request = createTestRequest(type);
        const output = generateAssessment(request);
        return output.prompt;
      });
      
      // All prompts should be different
      const uniquePrompts = new Set(prompts);
      expect(uniquePrompts.size).toBe(prompts.length);
    });
    
    it("should generate different required artifacts for different types", () => {
      const request1 = createTestRequest(AssessmentType.CritiqueAIAnswer);
      const request2 = createTestRequest(AssessmentType.IterationLog);
      
      const output1 = generateAssessment(request1);
      const output2 = generateAssessment(request2);
      
      expect(output1.requiredArtifacts).not.toEqual(output2.requiredArtifacts);
    });
  });
  
  describe("Age Band Prompt Adaptation", () => {
    it("should use simpler language for younger learners", () => {
      const requestYoung = createTestRequest(AssessmentType.TeachBack, AgeBand.SIX_TO_NINE);
      const requestAdult = createTestRequest(AssessmentType.TeachBack, AgeBand.ADULT);
      
      const outputYoung = generateAssessment(requestYoung);
      const outputAdult = generateAssessment(requestAdult);
      
      // Younger learner prompt should be shorter and simpler
      expect(outputYoung.prompt.length).toBeLessThan(outputAdult.prompt.length);
    });
  });
  
  describe("AI Usage Policy", () => {
    it("should generate different policies based on aiAllowed flag", () => {
      const requestAllowed = createTestRequest(AssessmentType.CritiqueAIAnswer, AgeBand.ADULT, {
        aiAllowed: true
      });
      const requestNotAllowed = createTestRequest(AssessmentType.CritiqueAIAnswer, AgeBand.ADULT, {
        aiAllowed: false
      });
      
      const outputAllowed = generateAssessment(requestAllowed);
      const outputNotAllowed = generateAssessment(requestNotAllowed);
      
      expect(outputAllowed.aiUsagePolicy).not.toBe(outputNotAllowed.aiUsagePolicy);
      expect(outputAllowed.aiUsagePolicy).toContain("allowed");
      expect(outputNotAllowed.aiUsagePolicy).toContain("not allowed");
    });
  });
});




