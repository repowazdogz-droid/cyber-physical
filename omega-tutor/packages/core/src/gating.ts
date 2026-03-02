/**
 * Evidence gating: EMERGING → ACTIVE only after N observations
 * with contextual variation (different surface_form_family) and match_strength >= threshold.
 */
import type { MisconceptionState } from "@omega-tutor/db";

export interface ObservationRecord {
  id: string;
  surfaceFormFamily: string;
  matchStrength: number;
  conceptId: string;
  grammarLabel: string;
}

export interface GatingConfig {
  minObservations: number;
  matchStrengthThreshold: number;
}

const DEFAULT_CONFIG: GatingConfig = {
  minObservations: 3,
  matchStrengthThreshold: 0.7,
};

/**
 * Whether the given observations justify promoting from EMERGING to ACTIVE.
 * Requires at least minObservations observations, each from a different surface_form_family,
 * each with match_strength >= threshold.
 */
export function canPromoteToActive(
  observations: ObservationRecord[],
  config: Partial<GatingConfig> = {}
): boolean {
  const { minObservations, matchStrengthThreshold } = { ...DEFAULT_CONFIG, ...config };
  const meetsStrength = observations.filter((o) => o.matchStrength >= matchStrengthThreshold);
  const families = new Set(meetsStrength.map((o) => o.surfaceFormFamily));
  return families.size >= minObservations && meetsStrength.length >= minObservations;
}

/**
 * Next state for a misconception entry after adding an observation.
 * EMERGING stays until gating is met; then ACTIVE.
 */
export function nextStateAfterObservation(
  currentState: MisconceptionState,
  observations: ObservationRecord[],
  config: Partial<GatingConfig> = {}
): MisconceptionState {
  if (currentState !== "EMERGING") return currentState;
  return canPromoteToActive(observations, config) ? "ACTIVE" : "EMERGING";
}
