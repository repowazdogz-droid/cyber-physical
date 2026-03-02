/**
 * LLM Contracts
 * 
 * Type definitions for LLM-assisted feature outputs.
 * All outputs are bounded and validated.
 * 
 * Version: 1.0.0
 */

import { KernelSpec } from '../specs/SpecTypes';

/**
 * Draft KernelSpec result.
 */
export interface DraftKernelSpecResult {
  ok: boolean;
  spec?: KernelSpec;
  errors: string[];
  warnings: string[];
}

/**
 * Bounded explanation (bullet points).
 */
export interface BoundedExplanation {
  bullets: string[];
}

/**
 * Bounded questions.
 */
export interface BoundedQuestions {
  questions: string[];
}

/**
 * Validates and bounds a DraftKernelSpecResult.
 */
export function validateDraftKernelSpec(spec: any): DraftKernelSpecResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== 'object') {
    return { ok: false, errors: ['Invalid spec: must be an object'], warnings: [] };
  }

  // Basic required fields
  if (!spec.version || typeof spec.version !== 'string') {
    errors.push('Missing or invalid version');
  }
  if (!spec.kernelId || typeof spec.kernelId !== 'string') {
    errors.push('Missing or invalid kernelId');
  }
  if (!spec.adapterId || typeof spec.adapterId !== 'string') {
    errors.push('Missing or invalid adapterId');
  }
  if (!spec.name || typeof spec.name !== 'string') {
    errors.push('Missing or invalid name');
  } else if (spec.name.length > 200) {
    warnings.push('Name exceeds 200 chars, will be truncated');
    spec.name = spec.name.substring(0, 200);
  }
  if (!spec.description || typeof spec.description !== 'string') {
    errors.push('Missing or invalid description');
  } else if (spec.description.length > 500) {
    warnings.push('Description exceeds 500 chars, will be truncated');
    spec.description = spec.description.substring(0, 500);
  }
  if (!Array.isArray(spec.outcomes)) {
    errors.push('Missing or invalid outcomes array');
  } else {
    if (spec.outcomes.length > 20) {
      warnings.push('Outcomes array exceeds 20 items, will be truncated');
      spec.outcomes = spec.outcomes.slice(0, 20);
    }
  }

  // Optional arrays
  if (spec.policies && Array.isArray(spec.policies) && spec.policies.length > 20) {
    warnings.push('Policies array exceeds 20 items, will be truncated');
    spec.policies = spec.policies.slice(0, 20);
  }
  if (spec.overrides && Array.isArray(spec.overrides) && spec.overrides.length > 10) {
    warnings.push('Overrides array exceeds 10 items, will be truncated');
    spec.overrides = spec.overrides.slice(0, 10);
  }
  if (spec.disallows && Array.isArray(spec.disallows) && spec.disallows.length > 10) {
    warnings.push('Disallows array exceeds 10 items, will be truncated');
    spec.disallows = spec.disallows.slice(0, 10);
  }

  return {
    ok: errors.length === 0,
    spec: errors.length === 0 ? spec as KernelSpec : undefined,
    errors: errors.slice(0, 10), // Bound errors
    warnings: warnings.slice(0, 20) // Bound warnings
  };
}

/**
 * Validates and bounds a BoundedExplanation.
 */
export function validateBoundedExplanation(bullets: any): BoundedExplanation {
  if (!Array.isArray(bullets)) {
    return { bullets: [] };
  }

  const bounded = bullets
    .slice(0, 8) // Max 8 bullets
    .filter((item: any) => typeof item === 'string')
    .map((item: string) => {
      // Bound each bullet to 200 chars
      if (item.length > 200) {
        return item.substring(0, 197) + '...';
      }
      return item;
    })
    .filter((item: string) => item.length > 0);

  return { bullets: bounded };
}

/**
 * Validates and bounds BoundedQuestions.
 */
export function validateBoundedQuestions(questions: any): BoundedQuestions {
  if (!Array.isArray(questions)) {
    return { questions: [] };
  }

  const bounded = questions
    .slice(0, 5) // Max 5 questions
    .filter((item: any) => typeof item === 'string')
    .map((item: string) => {
      // Bound each question to 120 chars
      if (item.length > 120) {
        return item.substring(0, 117) + '...';
      }
      return item;
    })
    .filter((item: string) => item.length > 0);

  return { questions: bounded };
}







































