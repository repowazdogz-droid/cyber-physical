/**
 * Adaptive Scheduler Tests
 * 
 * Tests for repair priority scoring and scheduling.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { computeRepairPriority, scheduleRepairs, adjustForBudget } from '../AdaptiveScheduler';
import { CandidateResult } from '../../../orchestrator/v0/types';
import { Program } from '../../../dsl/v0/types';
import { VerifierResult } from '../../../verifier/v0/types';
import { CostBreakdown } from '../../../contracts/types/Trace';
import { VerifierWhyCode } from '../../../contracts/enums/VerifierCodes';
import { FrameMode } from '../../../contracts/enums/FrameModes';

function createTestCandidate(
  tier: number,
  cost: number,
  whyCode?: string,
  ok: boolean = false
): CandidateResult {
  const program: Program = {
    program_id: 'test-program',
    dsl_grammar_version: '1.0.0',
    declared_frame: FrameMode.RELATIVE,
    dsl_source: '(seq (recolor grid mask 0 1))',
    ast: { type: 'Seq', steps: [] }
  };

  const verifierResult: VerifierResult = {
    ok,
    highest_tier_passed: tier,
    why_failed: whyCode,
    failure_details: {
      diff_size: (4 - tier) * 100
    }
  };

  const costBreakdown: CostBreakdown = {
    n_nodes: 10,
    n_ops: 2,
    n_params: 1,
    n_literals: 2,
    runtime_steps: 5,
    abs_coord_refs: 0,
    color_binding_literals: 0,
    total_cost: cost
  };

  return {
    program,
    exec_result: { ok: true, outputs: {}, metrics: { runtime_steps: 5, cells_processed: 0, objs_selected: 0 }, trace: [] },
    verifier_result: verifierResult,
    cost_breakdown: costBreakdown,
    trace_id: 'test-trace'
  };
}

describe('Repair Priority Scoring', () => {
  it('should prioritize higher tier candidates', () => {
    const candidate1 = createTestCandidate(1, 100);
    const candidate2 = createTestCandidate(2, 100);

    const priority1 = computeRepairPriority(candidate1);
    const priority2 = computeRepairPriority(candidate2);

    expect(priority2).toBeGreaterThan(priority1);
  });

  it('should penalize higher cost candidates', () => {
    const candidate1 = createTestCandidate(2, 50);
    const candidate2 = createTestCandidate(2, 200);

    const priority1 = computeRepairPriority(candidate1);
    const priority2 = computeRepairPriority(candidate2);

    expect(priority1).toBeGreaterThan(priority2);
  });

  it('should heavily penalize generalization failures', () => {
    const candidate1 = createTestCandidate(2, 100, VerifierWhyCode.EXAMPLE_MISMATCH);
    const candidate2 = createTestCandidate(2, 100, VerifierWhyCode.INVARIANCE_FAILED_PALETTE);

    const priority1 = computeRepairPriority(candidate1);
    const priority2 = computeRepairPriority(candidate2);

    expect(priority1).toBeGreaterThan(priority2);
  });

  it('should heavily penalize exec errors', () => {
    const candidate1 = createTestCandidate(2, 100, VerifierWhyCode.EXAMPLE_MISMATCH);
    const candidate2 = createTestCandidate(2, 100, VerifierWhyCode.EXEC_ERROR);

    const priority1 = computeRepairPriority(candidate1);
    const priority2 = computeRepairPriority(candidate2);

    expect(priority1).toBeGreaterThan(priority2);
  });
});

describe('Repair Scheduling', () => {
  it('should schedule top K candidates by priority', () => {
    const failures = [
      createTestCandidate(1, 200), // Lower priority
      createTestCandidate(2, 100), // Higher priority
      createTestCandidate(2, 150), // Medium priority
      createTestCandidate(0, 50)   // Lowest priority
    ];

    const schedule = scheduleRepairs(failures, {
      max_total_iterations: 6,
      max_per_candidate: 3,
      top_k: 3
    });

    expect(schedule.scheduled.length).toBe(3);
    expect(schedule.scheduled[0].priority_score).toBeGreaterThanOrEqual(schedule.scheduled[1].priority_score);
    expect(schedule.scheduled[1].priority_score).toBeGreaterThanOrEqual(schedule.scheduled[2].priority_score);
  });

  it('should respect max_per_candidate limit', () => {
    const failures = [
      createTestCandidate(2, 100)
    ];

    const schedule = scheduleRepairs(failures, {
      max_total_iterations: 10,
      max_per_candidate: 3
    });

    expect(schedule.scheduled[0].max_repairs).toBeLessThanOrEqual(3);
  });

  it('should respect total iterations limit', () => {
    const failures = [
      createTestCandidate(2, 100),
      createTestCandidate(2, 150),
      createTestCandidate(2, 200)
    ];

    const schedule = scheduleRepairs(failures, {
      max_total_iterations: 5,
      max_per_candidate: 3,
      top_k: 3
    });

    expect(schedule.total_iterations).toBeLessThanOrEqual(5);
  });
});

describe('Budget Guardrails', () => {
  it('should reduce iterations when cost threshold exceeded', () => {
    const schedule = scheduleRepairs([
      createTestCandidate(2, 100)
    ], {
      max_total_iterations: 6,
      max_per_candidate: 3
    });

    const adjusted = adjustForBudget(schedule, {
      cost_threshold_usd: 0.5,
      current_cost_usd: 1.0,
      current_latency_ms: 100
    });

    expect(adjusted.scheduled[0].max_repairs).toBeLessThan(schedule.scheduled[0].max_repairs);
  });

  it('should reduce iterations when latency threshold exceeded', () => {
    const schedule = scheduleRepairs([
      createTestCandidate(2, 100)
    ], {
      max_total_iterations: 6,
      max_per_candidate: 3
    });

    const adjusted = adjustForBudget(schedule, {
      latency_threshold_ms: 50,
      current_cost_usd: 0.1,
      current_latency_ms: 100
    });

    expect(adjusted.scheduled[0].max_repairs).toBeLessThan(schedule.scheduled[0].max_repairs);
  });
});























