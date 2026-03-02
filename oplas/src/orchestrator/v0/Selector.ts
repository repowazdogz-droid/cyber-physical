/**
 * Selector
 * 
 * Deterministic selection logic for candidate programs.
 * 
 * Version: 1.0.0
 */

import { CandidateResult } from './types';
import { CostBreakdown } from '../../contracts/types/Trace';

/**
 * Selection result.
 */
export interface SelectionResult {
  /** Winner candidate result (if any) */
  winner?: CandidateResult;
  /** Closest-to-pass candidate (if no winner) */
  closest?: {
    program_id: string;
    highest_tier: number;
    cost_breakdown: CostBreakdown;
  };
  /** Eligible candidates */
  eligible: CandidateResult[];
}

/**
 * Selects winner from candidate results.
 * 
 * Selection logic:
 * - eligible = candidates that pass tiers 0-2
 * - winner = argmin C(program) over eligible
 * - if no eligible -> return closest-to-pass (highest tier + lowest diff)
 * 
 * Tie-break (deterministic):
 * - lower N_literals, then lower N_params, then lexicographic program_id
 */
export function selectWinner(candidates: CandidateResult[]): SelectionResult {
  // Filter eligible candidates (pass tiers 0-2)
  const eligible = candidates.filter(c => c.verifier_result.ok && c.verifier_result.highest_tier_passed >= 2);

  if (eligible.length > 0) {
    // Sort by cost, then tie-break
    eligible.sort((a, b) => {
      const costA = a.cost_breakdown.total_cost;
      const costB = b.cost_breakdown.total_cost;

      if (costA !== costB) {
        return costA - costB;
      }

      // Tie-break: lower N_literals
      const litA = a.cost_breakdown.n_literals;
      const litB = b.cost_breakdown.n_literals;
      if (litA !== litB) {
        return litA - litB;
      }

      // Tie-break: lower N_params
      const paramA = a.cost_breakdown.n_params;
      const paramB = b.cost_breakdown.n_params;
      if (paramA !== paramB) {
        return paramA - paramB;
      }

      // Tie-break: lexicographic program_id
      return a.program.program_id.localeCompare(b.program.program_id);
    });

    return {
      winner: eligible[0],
      eligible
    };
  }

  // No eligible candidates - find closest-to-pass
  // Sort by: highest tier (desc), then lowest cost
  const sorted = [...candidates].sort((a, b) => {
    const tierA = a.verifier_result.highest_tier_passed;
    const tierB = b.verifier_result.highest_tier_passed;

    if (tierA !== tierB) {
      return tierB - tierA; // Higher tier first
    }

    // Same tier - lower cost first
    return a.cost_breakdown.total_cost - b.cost_breakdown.total_cost;
  });

  const closest = sorted[0];
  return {
    closest: {
      program_id: closest.program.program_id,
      highest_tier: closest.verifier_result.highest_tier_passed,
      cost_breakdown: closest.cost_breakdown
    },
    eligible: []
  };
}























