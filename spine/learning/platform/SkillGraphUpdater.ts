/**
 * Skill Graph Updater
 * 
 * Converts observations from learning sessions into bounded, explainable skill updates.
 * Per Contract 72: evidence-based, deterministic, no labeling or diagnosis.
 * 
 * Version: 0.1
 */

import {
  LearnerProfile,
  LearningSessionObservation,
  AgeBand
} from "./LearnerTypes";
import {
  CognitiveSkillGraph,
  CognitiveSkillId,
  SkillState,
  SkillSignal,
  ConfidenceBand,
  getOrCreateSkillState
} from "./SkillGraphTypes";

/**
 * Maximum number of recent signals to keep per skill.
 * Bounded to prevent unbounded growth per Contract 72.
 */
const MAX_RECENT_SIGNALS = 20;

/**
 * Minimum exposures required for each confidence band.
 */
const CONFIDENCE_THRESHOLDS = {
  Low: 0,
  Medium: 3,
  High: 10
};

/**
 * Minimum signal density (signals per exposure) for higher confidence bands.
 */
const SIGNAL_DENSITY_THRESHOLDS = {
  Low: 0,
  Medium: 0.5, // At least 50% of exposures have signals
  High: 0.7 // At least 70% of exposures have signals
};

/**
 * Mapping from observation types to cognitive skills.
 * Determines which skill(s) an observation provides evidence for.
 */
const OBSERVATION_TO_SKILL_MAP: Record<string, CognitiveSkillId[]> = {
  "AskedClarifyingQuestion": [CognitiveSkillId.QuestionQuality],
  "StatedUncertainty": [CognitiveSkillId.UncertaintyHandling],
  "ProvidedEvidence": [CognitiveSkillId.EvidenceUse],
  "CorrectedSelf": [CognitiveSkillId.ErrorCorrection],
  "CritiquedAIOutput": [CognitiveSkillId.ArgumentCritique],
  "VerifiedClaimWithSource": [CognitiveSkillId.VerificationHabits],
  "SummarizedInOwnWords": [CognitiveSkillId.Synthesis, CognitiveSkillId.TeachBackClarity],
  "IdentifiedAssumption": [CognitiveSkillId.AssumptionTracking],
  "RecognizedTradeOff": [CognitiveSkillId.ArgumentCritique],
  "RevisedBasedOnFeedback": [CognitiveSkillId.ErrorCorrection],
  "ArticulatedReasoning": [CognitiveSkillId.TeachBackClarity],
  "EvaluatedSourceQuality": [CognitiveSkillId.VerificationHabits, CognitiveSkillId.EvidenceUse]
};

/**
 * Audit entry explaining why a skill update occurred.
 * Per Contract 72: updates must be explainable.
 */
export interface SkillUpdateAuditEntry {
  skillId: CognitiveSkillId;
  action: string; // e.g., "Added signal", "Updated confidence band"
  previousState: {
    exposures: number;
    confidenceBand: ConfidenceBand;
    signalCount: number;
  };
  newState: {
    exposures: number;
    confidenceBand: ConfidenceBand;
    signalCount: number;
  };
  reason: string; // Human-readable explanation
}

/**
 * Result of applying observations to a skill graph.
 */
export interface SkillGraphUpdateResult {
  graph: CognitiveSkillGraph;
  audit: SkillUpdateAuditEntry[];
}

/**
 * Computes confidence band deterministically from skill state.
 * No ML, purely rule-based per Contract 72.
 */
function computeConfidenceBand(state: SkillState): ConfidenceBand {
  const exposures = state.exposures;
  const signalCount = state.recentSignals.length;
  
  // Calculate signal density (signals per exposure, capped at 1.0)
  const signalDensity = exposures > 0 ? Math.min(signalCount / exposures, 1.0) : 0;
  
  // Check thresholds
  if (exposures >= CONFIDENCE_THRESHOLDS.High && 
      signalDensity >= SIGNAL_DENSITY_THRESHOLDS.High) {
    return "High";
  }
  
  if (exposures >= CONFIDENCE_THRESHOLDS.Medium && 
      signalDensity >= SIGNAL_DENSITY_THRESHOLDS.Medium) {
    return "Medium";
  }
  
  return "Low";
}

/**
 * Determines which skills an observation provides evidence for.
 * Uses explicit mapping, no inference or guessing.
 */
function getSkillsForObservation(observation: LearningSessionObservation): CognitiveSkillId[] {
  // If skillHint is provided and valid, use it
  if (observation.skillHint) {
    const hintSkill = Object.values(CognitiveSkillId).find(
      skill => skill === observation.skillHint
    );
    if (hintSkill) {
      return [hintSkill];
    }
  }
  
  // Otherwise use observation type mapping
  return OBSERVATION_TO_SKILL_MAP[observation.type] || [];
}

/**
 * Applies age band restrictions to signal persistence.
 * Per Contract 71: minors may have fewer signals persisted.
 */
function shouldPersistSignal(
  observation: LearningSessionObservation,
  profile: LearnerProfile
): boolean {
  // For minors (age bands 6-9, 10-12), persist fewer signals
  if (profile.ageBand === AgeBand.SIX_TO_NINE || 
      profile.ageBand === AgeBand.TEN_TO_TWELVE) {
    // Only persist signals with strength >= 0.5 for younger learners
    return observation.strength >= 0.5;
  }
  
  // For older learners, persist all signals
  return true;
}

/**
 * Applies observations to a skill graph, updating skill states deterministically.
 * Returns updated graph and audit trail explaining all changes.
 * 
 * Per Contract 72:
 * - Evidence-based only (no speculation)
 * - Deterministic (same inputs → same outputs)
 * - Bounded (fixed-size arrays)
 * - Explainable (audit trail)
 * - No labeling or diagnosis
 */
export function applyObservations(
  profile: LearnerProfile,
  graph: CognitiveSkillGraph,
  observations: LearningSessionObservation[]
): SkillGraphUpdateResult {
  // Create a deep copy of the graph to avoid mutating input
  const updatedGraph: CognitiveSkillGraph = {
    learnerId: graph.learnerId,
    skills: new Map(),
    lastUpdated: new Date().toISOString(),
    version: graph.version
  };
  
  // Copy all existing skill states
  graph.skills.forEach((state, skillId) => {
    updatedGraph.skills.set(skillId, {
      ...state,
      recentSignals: [...state.recentSignals]
    });
  });
  
  const audit: SkillUpdateAuditEntry[] = [];
  
  // Process each observation
  for (const observation of observations) {
    // Check if we should persist this signal based on age band
    if (!shouldPersistSignal(observation, profile)) {
      continue;
    }
    
    // Determine which skills this observation provides evidence for
    const affectedSkills = getSkillsForObservation(observation);
    
    for (const skillId of affectedSkills) {
      const state = getOrCreateSkillState(updatedGraph, skillId);
      const previousState = {
        exposures: state.exposures,
        confidenceBand: state.confidenceBand,
        signalCount: state.recentSignals.length
      };
      
      // Create signal from observation
      const signal: SkillSignal = {
        observationType: observation.type,
        timestamp: observation.timestamp,
        strength: observation.strength,
        sessionId: observation.sessionId,
        notes: observation.notes
      };
      
      // Append signal (bounded array)
      state.recentSignals.push(signal);
      
      // Clamp array length to MAX_RECENT_SIGNALS
      if (state.recentSignals.length > MAX_RECENT_SIGNALS) {
        state.recentSignals = state.recentSignals.slice(-MAX_RECENT_SIGNALS);
      }
      
      // Increment exposures
      state.exposures += 1;
      
      // Update last evidence timestamp
      state.lastEvidenceTimestamp = observation.timestamp;
      
      // Recompute confidence band deterministically
      const previousBand = state.confidenceBand;
      state.confidenceBand = computeConfidenceBand(state);
      
      // Create audit entry
      const newState = {
        exposures: state.exposures,
        confidenceBand: state.confidenceBand,
        signalCount: state.recentSignals.length
      };
      
      let action = `Added signal (${observation.type})`;
      let reason = `Observation type "${observation.type}" provides evidence for ${skillId}. `;
      
      if (previousBand !== state.confidenceBand) {
        action += `, Updated confidence band`;
        reason += `Confidence band changed from ${previousBand} to ${state.confidenceBand} `;
        reason += `(exposures: ${state.exposures}, signals: ${state.recentSignals.length}).`;
      } else {
        reason += `Exposures: ${previousState.exposures} → ${state.exposures}, `;
        reason += `signals: ${previousState.signalCount} → ${state.recentSignals.length}. `;
        reason += `Confidence band remains ${state.confidenceBand}.`;
      }
      
      audit.push({
        skillId,
        action,
        previousState,
        newState,
        reason
      });
    }
  }
  
  return {
    graph: updatedGraph,
    audit
  };
}




