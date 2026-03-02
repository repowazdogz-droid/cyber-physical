/**
 * Skill Graph Types
 * 
 * Defines cognitive skill graph data structures per Contract 72.
 * No scores, grades, ranks, or labeling.
 * 
 * Version: 0.1
 */

/**
 * Cognitive skill identifiers (minimal starter set per Contract 72).
 * Maps to evidence types and growth indicators.
 */
export enum CognitiveSkillId {
  // Communication Skills
  QuestionQuality = "QuestionQuality",
  TeachBackClarity = "TeachBackClarity",
  
  // Metacognitive Skills
  UncertaintyHandling = "UncertaintyHandling",
  ErrorCorrection = "ErrorCorrection",
  AssumptionTracking = "AssumptionTracking",
  
  // Critical Thinking Skills
  EvidenceUse = "EvidenceUse",
  ArgumentCritique = "ArgumentCritique",
  
  // Information Literacy Skills
  VerificationHabits = "VerificationHabits",
  
  // Problem-Solving Skills
  Synthesis = "Synthesis"
}

/**
 * A single evidence signal for a cognitive skill.
 * Bounded, timestamped, and linked to a session.
 */
export interface SkillSignal {
  observationType: string;
  timestamp: string; // ISO 8601 format
  strength: number; // 0.0 to 1.0
  sessionId: string;
  notes?: string;
}

/**
 * Confidence band computed from exposures and signal density.
 * No ML, purely deterministic based on bounded state.
 */
export type ConfidenceBand = "Low" | "Medium" | "High";

/**
 * Bounded state for a single cognitive skill.
 * Stores exposures, recent signals (fixed max length), and computed confidence band.
 * Per Contract 72 storage schema.
 */
export interface SkillState {
  skillId: CognitiveSkillId;
  exposures: number; // Total number of times this skill has been observed
  recentSignals: SkillSignal[]; // Fixed max length (e.g., 20), oldest removed when full
  confidenceBand: ConfidenceBand; // Computed deterministically from exposures + signal density
  lastEvidenceTimestamp?: string; // ISO 8601 format
}

/**
 * Cognitive skill graph mapping skill IDs to their bounded state.
 * Per Contract 72 SkillGraph schema.
 */
export interface CognitiveSkillGraph {
  learnerId: string;
  skills: Map<CognitiveSkillId, SkillState>;
  lastUpdated: string; // ISO 8601 format
  version: string;
}

/**
 * Helper to create an empty skill graph for a learner.
 */
export function createEmptySkillGraph(learnerId: string): CognitiveSkillGraph {
  const skills = new Map<CognitiveSkillId, SkillState>();
  
  // Initialize all skills with empty state
  Object.values(CognitiveSkillId).forEach(skillId => {
    skills.set(skillId, {
      skillId,
      exposures: 0,
      recentSignals: [],
      confidenceBand: "Low"
    });
  });
  
  return {
    learnerId,
    skills,
    lastUpdated: new Date().toISOString(),
    version: "0.1"
  };
}

/**
 * Helper to get or create skill state for a skill ID.
 */
export function getOrCreateSkillState(
  graph: CognitiveSkillGraph,
  skillId: CognitiveSkillId
): SkillState {
  let state = graph.skills.get(skillId);
  if (!state) {
    state = {
      skillId,
      exposures: 0,
      recentSignals: [],
      confidenceBand: "Low"
    };
    graph.skills.set(skillId, state);
  }
  return state;
}








































