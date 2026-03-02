import { ENGINE_CONFIG } from '../config.js';
import type { EngineInput } from './types.js';
import { EngineError } from './types.js';

export function validatePreconditions(input: EngineInput): void {
  const completedPerspectives = input.perspectives.filter(p => p.state === 'completed');
  if (completedPerspectives.length < ENGINE_CONFIG.MIN_LENS_COUNT) {
    throw new EngineError(
      'INSUFFICIENT_INPUT',
      `Need >= ${ENGINE_CONFIG.MIN_LENS_COUNT} completed perspectives, got ${completedPerspectives.length}`
    );
  }

  const scoringClaims = input.claims.filter(c => c.scoring_eligible);
  if (scoringClaims.length === 0) {
    throw new EngineError(
      'INSUFFICIENT_INPUT',
      'Zero scoring-eligible claims across all perspectives'
    );
  }
}
