/**
 * Scheduler: priority score and caps.
 * - priority = f(severity_weight, confidence_state, time_since_last_probe, downstream_dependency_weight)
 * - UX cap: ratio cap (≤1 probe per 3 substantive interactions) AND hard floor (≥2 minutes between probes)
 */
import type { MisconceptionState } from "@omega-tutor/db";

export interface SchedulerConfig {
  probeRatioCap: number;   // e.g. 0.33 => 1 probe per 3 interactions
  minMinutesBetween: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  probeRatioCap: 0.33,
  minMinutesBetween: 2,
};

export interface PriorityInput {
  severityWeight: number;
  confidenceScore: number;
  state: MisconceptionState;
  minutesSinceLastProbe: number | null;
  downstreamDependencyWeight: number;
}

/**
 * Compute priority score (higher = more urgent).
 * Normalized to a 0..1-like scale for comparison.
 */
export function priorityScore(input: PriorityInput): number {
  const { severityWeight, confidenceScore, state, minutesSinceLastProbe, downstreamDependencyWeight } = input;
  let score = severityWeight * (1 - confidenceScore); // higher when we're less sure
  if (state === "EMERGING") score *= 1.2; // want to triangulate
  if (state === "ACTIVE") score *= 1.5;  // active misconceptions get more probes
  if (minutesSinceLastProbe != null) {
    const decay = Math.min(1, (minutesSinceLastProbe ?? 0) / 60); // more time => slightly higher
    score *= 1 + 0.3 * decay;
  }
  score *= 1 + 0.2 * downstreamDependencyWeight;
  return Math.max(0, score);
}

/**
 * Check ratio cap: substantiveInteractions * probeRatioCap >= probesInSession.
 * So we allow a probe if (probesInSession + 1) <= substantiveInteractions * probeRatioCap.
 * Equivalently: probesInSession < substantiveInteractions * probeRatioCap.
 */
export function ratioCapAllowsProbe(
  substantiveInteractions: number,
  probesInSession: number,
  config: Partial<SchedulerConfig> = {}
): boolean {
  const { probeRatioCap } = { ...DEFAULT_CONFIG, ...config };
  return substantiveInteractions >= 1 && probesInSession < substantiveInteractions * probeRatioCap;
}

/**
 * Check time floor: at least minMinutesBetween since last probe.
 */
export function timeFloorAllowsProbe(
  minutesSinceLastProbe: number | null,
  config: Partial<SchedulerConfig> = {}
): boolean {
  const { minMinutesBetween } = { ...DEFAULT_CONFIG, ...config };
  if (minutesSinceLastProbe == null) return true;
  return minutesSinceLastProbe >= minMinutesBetween;
}

/**
 * Combined: can we schedule a probe now?
 */
export function canScheduleProbe(
  substantiveInteractions: number,
  probesInSession: number,
  minutesSinceLastProbe: number | null,
  config: Partial<SchedulerConfig> = {}
): boolean {
  return (
    ratioCapAllowsProbe(substantiveInteractions, probesInSession, config) &&
    timeFloorAllowsProbe(minutesSinceLastProbe, config)
  );
}
