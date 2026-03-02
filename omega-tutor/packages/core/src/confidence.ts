/**
 * Confidence score and decay.
 * - Unrepaired entries: decay with half-life (default 14 days); pause/slow when session touches concept neighborhood.
 * - Repaired_stable: decay slowly; schedule low-frequency verification.
 */
import type { MisconceptionState } from "@omega-tutor/db";

export interface ConfidenceConfig {
  halfLifeDays: number;
}

const DEFAULT_HALF_LIFE_DAYS = 14;

/**
 * Decay factor for elapsed days: 0.5^(days / halfLifeDays).
 */
export function decayFactor(elapsedDays: number, halfLifeDays: number = DEFAULT_HALF_LIFE_DAYS): number {
  if (elapsedDays <= 0) return 1;
  return Math.pow(0.5, elapsedDays / halfLifeDays);
}

/**
 * Apply decay to a confidence score (0..1) given last observed at lastObservedAt and now = now.
 * Decay is paused or slowed when session touches concept neighborhood (caller passes touched = true).
 */
export function decayedConfidence(
  currentScore: number,
  lastObservedAt: Date | null,
  now: Date,
  state: MisconceptionState,
  conceptTouchedInSession: boolean,
  config: Partial<ConfidenceConfig> = {}
): number {
  const halfLifeDays = config.halfLifeDays ?? DEFAULT_HALF_LIFE_DAYS;
  if (conceptTouchedInSession) {
    // Slow or pause decay when concept neighborhood was touched this session
    return Math.min(1, currentScore + 0.02);
  }
  if (state === "REPAIRED_STABLE" || state === "REPAIRED_PROVISIONAL") {
    // Slower decay for repaired
    const slowHalfLife = halfLifeDays * 3;
    const elapsedDays = lastObservedAt ? (now.getTime() - lastObservedAt.getTime()) / (24 * 60 * 60 * 1000) : 0;
    return currentScore * decayFactor(elapsedDays, slowHalfLife);
  }
  const elapsedDays = lastObservedAt ? (now.getTime() - lastObservedAt.getTime()) / (24 * 60 * 60 * 1000) : 0;
  const factor = decayFactor(elapsedDays, halfLifeDays);
  return Math.max(0, Math.min(1, currentScore * factor));
}
