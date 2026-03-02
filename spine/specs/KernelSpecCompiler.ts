/**
 * Kernel Spec Compiler
 * 
 * Compiles a KernelSpec into a runnable kernel function.
 * Deterministic, no side effects.
 * 
 * Version: 1.0.0
 */

import {
  KernelSpec,
  OutcomeMapping,
  Condition,
  PolicySpec,
  OverrideSpec,
  DisallowSpec
} from './SpecTypes';
import { KernelInput, KernelDecision } from '../kernels/core/KernelTypes';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';

/**
 * Compiled kernel function.
 */
export type CompiledKernelFunction = (input: KernelInput) => KernelDecision;

/**
 * Evaluates a condition against signal values.
 */
function evaluateCondition(condition: Condition, signals: Record<string, number | string | boolean>): boolean {
  const signalValue = signals[condition.signalKey];

  if (signalValue === undefined || signalValue === null) {
    return false; // Missing signal = condition fails
  }

  switch (condition.operator) {
    case 'eq':
      return signalValue === condition.value;
    case 'ne':
      return signalValue !== condition.value;
    case 'gt':
      return typeof signalValue === 'number' && typeof condition.value === 'number' && signalValue > condition.value;
    case 'gte':
      return typeof signalValue === 'number' && typeof condition.value === 'number' && signalValue >= condition.value;
    case 'lt':
      return typeof signalValue === 'number' && typeof condition.value === 'number' && signalValue < condition.value;
    case 'lte':
      return typeof signalValue === 'number' && typeof condition.value === 'number' && signalValue <= condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(signalValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(signalValue);
    default:
      return false;
  }
}

/**
 * Evaluates all conditions (AND logic).
 */
function evaluateConditions(conditions: Condition[], signals: Record<string, number | string | boolean>): boolean {
  return conditions.every(condition => evaluateCondition(condition, signals));
}

/**
 * Finds matching outcome from mappings.
 */
function findMatchingOutcome(
  outcomes: OutcomeMapping[],
  signals: Record<string, number | string | boolean>
): OutcomeMapping | null {
  // Check outcomes in order (first match wins)
  for (const outcome of outcomes) {
    if (evaluateConditions(outcome.conditions, signals)) {
      return outcome;
    }
  }
  return null;
}

/**
 * Checks if an override applies.
 */
function findMatchingOverride(
  overrides: OverrideSpec[],
  signals: Record<string, number | string | boolean>
): OverrideSpec | null {
  for (const override of overrides) {
    if (evaluateConditions(override.conditions, signals)) {
      return override;
    }
  }
  return null;
}

/**
 * Checks if an outcome is disallowed.
 */
function isOutcomeDisallowed(
  disallows: DisallowSpec[],
  outcomeId: string,
  signals: Record<string, number | string | boolean>
): boolean {
  for (const disallow of disallows) {
    if (disallow.disallowedOutcome === outcomeId && evaluateConditions(disallow.conditions, signals)) {
      return true;
    }
  }
  return false;
}

/**
 * Compiles a kernel spec into a runnable kernel function.
 */
export function compileKernelSpec(spec: KernelSpec): CompiledKernelFunction {
  return (input: KernelInput): KernelDecision => {
    const signals = input.signals || {};

    // Step 1: Check overrides first (highest priority)
    if (spec.overrides && spec.overrides.length > 0) {
      const override = findMatchingOverride(spec.overrides, signals);
      if (override) {
        // Find the forced outcome mapping
        const forcedOutcome = spec.outcomes.find(o => o.outcomeId === override.forcedOutcome);
        if (forcedOutcome) {
          return {
            outcome: forcedOutcome.outcomeId,
            confidence: forcedOutcome.confidence,
            rationale: `${override.reason || 'Override applied'}: ${forcedOutcome.rationale}`,
            assumptions: [],
            uncertainties: [],
            overridesApplied: [override.overrideId]
          };
        }
      }
    }

    // Step 2: Find matching outcome
    const matchingOutcome = findMatchingOutcome(spec.outcomes, signals);
    if (!matchingOutcome) {
      // No match found - return unknown outcome
      return {
        outcome: 'UNKNOWN',
        confidence: 'Unknown',
        rationale: 'No matching outcome found for given signals',
        assumptions: [],
        uncertainties: []
      };
    }

    // Step 3: Check if outcome is disallowed
    if (spec.disallows && spec.disallows.length > 0) {
      if (isOutcomeDisallowed(spec.disallows, matchingOutcome.outcomeId, signals)) {
        // Outcome is disallowed - return unknown
        return {
          outcome: 'UNKNOWN',
          confidence: 'Unknown',
          rationale: `Outcome ${matchingOutcome.outcomeId} is disallowed for current conditions`,
          assumptions: [],
          uncertainties: []
        };
      }
    }

    // Step 4: Return decision
    return {
      outcome: matchingOutcome.outcomeId,
      confidence: matchingOutcome.confidence,
      rationale: matchingOutcome.rationale,
      assumptions: [],
      uncertainties: []
    };
  };
}

/**
 * Generates a spec hash for stable ID generation.
 */
export function hashSpec(spec: KernelSpec): string {
  const crypto = require('crypto');
  const specString = JSON.stringify(spec, Object.keys(spec).sort());
  return crypto.createHash('sha256').update(specString).digest('hex').substring(0, 16);
}




