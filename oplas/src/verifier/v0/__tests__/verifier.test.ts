/**
 * Verifier v0 Tests
 * 
 * Tests for verifier tiers 0-2.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { verify, extractRefinementInfo } from '../Verifier';
import { VerifierContext } from '../types';
import { VerifierWhyCode } from '../../../contracts/enums/VerifierCodes';
import { Domain } from '../../../contracts/enums/Domains';
import { FrameMode } from '../../../contracts/enums/FrameModes';
import { parseDSL, buildProgram } from '../../../dsl/v0';
import { parseGrid } from '../../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';
import { execute } from '../../../executor/v0/Executor';
import { writeTrace, readTrace } from '../TraceWriter';

function loadProgramFixture(name: string): string {
  const path = join(process.cwd(), 'fixtures', 'programs', `${name}.txt`);
  return readFileSync(path, 'utf8').trim();
}

function loadGridFixture(name: string): any {
  const path = join(process.cwd(), 'fixtures', 'grids', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function createTestRepr(grid: number[][]): any {
  const parseResult = parseGrid({ cells: grid });
  if (!parseResult.ok || !parseResult.repr) {
    throw new Error('Failed to parse grid');
  }
  let repr = canonicalizeGrid(parseResult.repr);
  repr.repr_id = hashCanonical(repr);
  return repr;
}

describe('Verifier v0 - Tier 0', () => {
  it('should pass valid program', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    const execResult = execute(build.program, repr, { grid: grid.cells });

    const context: VerifierContext = {
      request: {
        task_id: 'test-1',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: execResult
    };

    const result = verify(context);
    expect(result.ok).toBe(true);
    expect(result.highest_tier_passed).toBeGreaterThanOrEqual(0);
  });

  it('should fail on invalid output', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);

    // Create invalid exec result (no output)
    const invalidExecResult = {
      ok: true,
      outputs: {},
      metrics: { runtime_steps: 0, cells_processed: 0, objs_selected: 0 },
      trace: []
    };

    const context: VerifierContext = {
      request: {
        task_id: 'test-2',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: invalidExecResult,
      input_grid: grid.cells
    };

    const result = verify(context);
    expect(result.ok).toBe(false);
    expect(result.highest_tier_passed).toBe(0);
    expect(result.why_failed).toBe(VerifierWhyCode.OUTPUT_MISMATCH);
  });
});

describe('Verifier v0 - Tier 1', () => {
  it('should enforce same_dims constraint', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    const execResult = execute(build.program, repr, { grid: grid.cells });

    const context: VerifierContext = {
      request: {
        task_id: 'test-3',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        constraints: [
          {
            type: 'same_dims',
            params: {}
          }
        ],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: execResult,
      input_grid: grid.cells
    };

    const result = verify(context);
    // Should pass if output has same dims as input
    expect(result.highest_tier_passed).toBeGreaterThanOrEqual(1);
  });
});

describe('Verifier v0 - Tier 2', () => {
  it('should validate example consistency', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    const execResult = execute(build.program, repr, { grid: grid.cells });

    const examples = [
      {
        input_grid: grid.cells,
        expected_output_grid: execResult.outputs?.grid || grid.cells
      }
    ];

    const context: VerifierContext = {
      request: {
        task_id: 'test-4',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: execResult,
      input_grid: grid.cells,
      examples
    };

    const result = verify(context);
    expect(result.highest_tier_passed).toBeGreaterThanOrEqual(2);
  });
});

describe('Verifier v0 - Cost Extraction', () => {
  it('should extract cost breakdown', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    const execResult = execute(build.program, repr, { grid: grid.cells });

    const context: VerifierContext = {
      request: {
        task_id: 'test-5',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: execResult,
      input_grid: grid.cells
    };

    const result = verify(context);
    expect(result.cost_breakdown).toBeDefined();
    expect(result.cost_breakdown.n_ops).toBeGreaterThanOrEqual(0);
    expect(result.cost_breakdown.n_nodes).toBeGreaterThanOrEqual(0);
    expect(result.cost_breakdown.total_cost).toBeGreaterThanOrEqual(0);
  });
});

describe('Verifier v0 - Determinism', () => {
  it('should produce identical trace on repeated runs', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    const execResult = execute(build.program, repr, { grid: grid.cells });

    const context: VerifierContext = {
      request: {
        task_id: 'test-6',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: execResult,
      input_grid: grid.cells
    };

    const result1 = verify(context);
    const result2 = verify(context);

    // Results should be identical (except run_id which includes timestamp)
    expect(result1.ok).toBe(result2.ok);
    expect(result1.highest_tier_passed).toBe(result2.highest_tier_passed);
    expect(result1.cost_breakdown.total_cost).toBe(result2.cost_breakdown.total_cost);
  });
});

describe('Verifier v0 - Refinement Hook', () => {
  it('should extract refinement info', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    const execResult = execute(build.program, repr, { grid: grid.cells });

    const context: VerifierContext = {
      request: {
        task_id: 'test-7',
        domain: Domain.GRID_2D,
        inputs: [],
        outputs: [],
        budgets: {
          max_proposals: 36,
          max_repairs: 24,
          max_refinement_iters: 6,
          max_wall_ms: 300000,
          max_runtime_steps: 10000,
          max_tokens_per_call: 4000
        },
        run_config: {}
      },
      repr,
      program: build.program,
      exec_result: execResult,
      input_grid: grid.cells
    };

    const result = verify(context);
    const refinementInfo = extractRefinementInfo(result);
    
    expect(refinementInfo.highest_tier_reached).toBeDefined();
    expect(refinementInfo.highest_tier_reached).toBeGreaterThanOrEqual(0);
  });
});

