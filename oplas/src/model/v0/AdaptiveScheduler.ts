/**
 * Adaptive Refinement Scheduler
 * 
 * Bounded, cost-aware repair scheduling based on improvement potential.
 * 
 * Version: 1.0.0
 */

import { CandidateResult } from '../../orchestrator/v0/types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';

/**
 * Repair priority score weights.
 */
export const REPAIR_PRIORITY_WEIGHTS = {
  highest_tier_reached: 100,
  diff_size_penalty: -0.05,
  cost_penalty: -0.2,
  generalization_fail_penalty: -30,
  exec_error_severe_penalty: -50
};

/**
 * Computes repair priority score R for a candidate.
 */
export function computeRepairPriority(
  candidate: CandidateResult,
  diffSize?: number
): number {
  const tier = candidate.verifier_result.highest_tier_passed;
  const cost = candidate.cost_breakdown.total_cost;
  const whyCode = candidate.verifier_result.why_failed || '';
  
  // Check if generalization failure
  const isGeneralizationFail = 
    whyCode === VerifierWhyCode.INVARIANCE_FAILED_PALETTE ||
    whyCode === VerifierWhyCode.INVARIANCE_FAILED_TRANSLATION ||
    whyCode === VerifierWhyCode.COORDINATE_HACK_DETECTED;

  // Check if severe exec error
  const isExecErrorSevere = 
    whyCode === VerifierWhyCode.EXEC_ERROR ||
    whyCode === VerifierWhyCode.RUNTIME_ERROR;

  // Compute diff size (if not provided, estimate from failure details)
  const estimatedDiffSize = diffSize || estimateDiffSize(candidate);

  const R =
    REPAIR_PRIORITY_WEIGHTS.highest_tier_reached * tier +
    REPAIR_PRIORITY_WEIGHTS.diff_size_penalty * estimatedDiffSize +
    REPAIR_PRIORITY_WEIGHTS.cost_penalty * cost +
    (isGeneralizationFail ? REPAIR_PRIORITY_WEIGHTS.generalization_fail_penalty : 0) +
    (isExecErrorSevere ? REPAIR_PRIORITY_WEIGHTS.exec_error_severe_penalty : 0);

  return R;
}

/**
 * Estimates diff size from candidate result.
 */
function estimateDiffSize(candidate: CandidateResult): number {
  // Try to extract from failure_details
  const details = candidate.verifier_result.failure_details;
  if (details?.diff_size !== undefined) {
    return details.diff_size as number;
  }

  // Estimate from tier (lower tier = larger diff typically)
  const tier = candidate.verifier_result.highest_tier_passed;
  return (4 - tier) * 100; // Rough estimate
}

/**
 * Schedules repair candidates with adaptive prioritization.
 */
export interface RepairSchedule {
  /** Scheduled candidates with priority scores */
  scheduled: Array<{
    candidate: CandidateResult;
    priority_score: number;
    max_repairs: number;
  }>;
  /** Total iterations allocated */
  total_iterations: number;
}

/**
 * Schedules repair candidates.
 */
export function scheduleRepairs(
  failures: CandidateResult[],
  options: {
    max_total_iterations?: number;
    max_per_candidate?: number;
    top_k?: number;
    writeback_target?: boolean;
  } = {}
): RepairSchedule {
  const maxTotalIterations = options.max_total_iterations || 6;
  const maxPerCandidate = options.max_per_candidate || 3;
  const topK = options.top_k || 3;
  const writebackTarget = options.writeback_target || false;

  // Compute priority scores
  const scored = failures.map(candidate => ({
    candidate,
    priority_score: computeRepairPriority(candidate)
  }));

  // Sort by priority (descending)
  scored.sort((a, b) => b.priority_score - a.priority_score);

  // Take top K
  const topCandidates = scored.slice(0, topK);

  // Allocate iterations
  const scheduled: RepairSchedule['scheduled'] = [];
  let remainingIterations = maxTotalIterations;

  for (const item of topCandidates) {
    if (remainingIterations <= 0) {
      break;
    }

    const allocated = Math.min(maxPerCandidate, remainingIterations);
    scheduled.push({
      candidate: item.candidate,
      priority_score: item.priority_score,
      max_repairs: allocated
    });

    remainingIterations -= allocated;
  }

  return {
    scheduled,
    total_iterations: maxTotalIterations - remainingIterations
  };
}

/**
 * Budget guardrails.
 */
export interface BudgetGuardrails {
  /** Cost threshold USD */
  cost_threshold_usd?: number;
  /** Latency threshold ms */
  latency_threshold_ms?: number;
  /** Current cost USD */
  current_cost_usd: number;
  /** Current latency ms */
  current_latency_ms: number;
}

/**
 * Adjusts repair iterations based on budget guardrails.
 */
export function adjustForBudget(
  schedule: RepairSchedule,
  guardrails: BudgetGuardrails
): RepairSchedule {
  let adjustedSchedule = { ...schedule };

  // Reduce iterations if cost threshold exceeded
  if (guardrails.cost_threshold_usd && guardrails.current_cost_usd > guardrails.cost_threshold_usd) {
    const reductionFactor = guardrails.cost_threshold_usd / guardrails.current_cost_usd;
    adjustedSchedule.scheduled = adjustedSchedule.scheduled.map(item => ({
      ...item,
      max_repairs: Math.max(1, Math.floor(item.max_repairs * reductionFactor))
    }));
    adjustedSchedule.total_iterations = adjustedSchedule.scheduled.reduce(
      (sum, item) => sum + item.max_repairs,
      0
    );
  }

  // Reduce iterations if latency threshold exceeded
  if (guardrails.latency_threshold_ms && guardrails.current_latency_ms > guardrails.latency_threshold_ms) {
    const reductionFactor = guardrails.latency_threshold_ms / guardrails.current_latency_ms;
    adjustedSchedule.scheduled = adjustedSchedule.scheduled.map(item => ({
      ...item,
      max_repairs: Math.max(1, Math.floor(item.max_repairs * reductionFactor))
    }));
    adjustedSchedule.total_iterations = adjustedSchedule.scheduled.reduce(
      (sum, item) => sum + item.max_repairs,
      0
    );
  }

  return adjustedSchedule;
}























