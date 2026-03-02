/**
 * Apply Policy Pack
 * 
 * Pure function that applies a policy pack to a kernel run.
 * Does not mutate the input; returns a new object.
 * 
 * Version: 1.0.0
 */

import { KernelRunContract } from '../contracts/KernelContracts';
import { PolicyPack, PolicyPackApplicationResult } from './PolicyPackTypes';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';

/**
 * Applies a policy pack to a kernel run.
 * Pure function: does not mutate input.
 */
export function applyPolicyPack(
  run: KernelRunContract,
  pack: PolicyPack
): PolicyPackApplicationResult {
  const policyNotes: string[] = [];
  const appliedOverrides: string[] = [];
  const disallowedOutcomes: string[] = [];
  
  // Check disallow rules (priority-ordered)
  const sortedDisallows = [...pack.disallows].sort((a, b) => b.priority - a.priority);
  for (const disallow of sortedDisallows) {
    if (run.decision.outcome === disallow.outcome) {
      disallowedOutcomes.push(disallow.outcome);
      policyNotes.push(truncate(disallow.reason, 150));
      
      // If disallowed, override decision to REFUSE_TO_DECIDE
      return {
        contractVersion: CONTRACT_VERSION,
        run: {
          ...run,
          decision: {
            ...run.decision,
            outcome: "REFUSE_TO_DECIDE",
            rationale: `Disallowed by policy: ${disallow.reason}`,
            confidence: "High"
          }
        },
        policyNotes: policyNotes.slice(0, 3), // Max 3
        appliedOverrides: [],
        disallowedOutcomes: disallowedOutcomes.slice(0, 5) // Max 5
      };
    }
  }
  
  // Check override rules (priority-ordered)
  const sortedOverrides = [...pack.overrides].sort((a, b) => b.priority - a.priority);
  for (const override of sortedOverrides) {
    // Simple condition check: if override condition matches input signals
    const conditionMet = checkOverrideCondition(run.input, override.condition);
    
    if (conditionMet) {
      appliedOverrides.push(override.overrideId);
      policyNotes.push(truncate(override.reason, 150));
      
      // Apply override: modify decision outcome
      return {
        contractVersion: CONTRACT_VERSION,
        run: {
          ...run,
          decision: {
            ...run.decision,
            outcome: override.forcedOutcome,
            rationale: `${run.decision.rationale} (Overridden: ${override.reason})`,
            overridesApplied: [...(run.decision.overridesApplied || []), override.overrideId].slice(0, 5) // Max 5
          }
        },
        policyNotes: policyNotes.slice(0, 3), // Max 3
        appliedOverrides: appliedOverrides.slice(0, 5), // Max 5
        disallowedOutcomes: []
      };
    }
  }
  
  // No overrides or disallows applied
  return {
    contractVersion: CONTRACT_VERSION,
    run: { ...run }, // New object (no mutation)
    policyNotes: [],
    appliedOverrides: [],
    disallowedOutcomes: []
  };
}

/**
 * Checks if override condition is met.
 * Simple string matching for condition field.
 */
function checkOverrideCondition(
  input: KernelRunContract['input'],
  condition: string
): boolean {
  // Simple condition checking: look for condition string in signals
  const signalsStr = JSON.stringify(input.signals).toLowerCase();
  const conditionLower = condition.toLowerCase();
  
  // Check if condition mentions any signal keys or values
  for (const key in input.signals) {
    if (conditionLower.includes(key.toLowerCase())) {
      return true;
    }
    const value = String(input.signals[key]).toLowerCase();
    if (conditionLower.includes(value)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Truncates text to max length.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  return text.substring(0, maxLen - 3) + '...';
}








































