/**
 * Enumerator Tests
 * 
 * Tests for DSL enumeration and pruning.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { enumeratePrograms, extractParameters, generatePredicates, generateSketches } from '../Enumerator';
import { Domain } from '../../../contracts/enums/Domains';
import { parseGrid } from '../../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';
import { Request } from '../../../contracts/types/Request';

function createTestRepr(grid: number[][]): any {
  const parseResult = parseGrid({ cells: grid });
  if (!parseResult.ok || !parseResult.repr) {
    throw new Error('Failed to parse grid');
  }
  let repr = canonicalizeGrid(parseResult.repr);
  repr.repr_id = hashCanonical(repr);
  return repr;
}

function createTestRequest(): Request {
  return {
    task_id: 'test-task',
    domain: Domain.GRID_2D,
    inputs: [],
    outputs: [],
    constraints: [],
    budgets: {
      max_proposals: 100,
      max_repairs: 5,
      max_refinement_iters: 3,
      max_wall_ms: 60000,
      max_runtime_steps: 1000,
      max_tokens_per_call: 4000
    },
    run_config: {
      enable_refinement: false,
      enable_vault: false
    }
  };
}

describe('Enumerator - Parameter Extraction', () => {
  it('should extract colors from repr', () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 2]
    ];
    const repr = createTestRepr(grid);
    const params = extractParameters(repr);

    expect(params.colors.length).toBeGreaterThan(0);
    expect(params.colors).toContain(0);
    expect(params.colors).toContain(1);
    expect(params.colors).toContain(2);
  });

  it('should extract area thresholds', () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 2]
    ];
    const repr = createTestRepr(grid);
    const params = extractParameters(repr);

    expect(params.area_thresholds.length).toBeGreaterThan(0);
  });
});

describe('Enumerator - Sketch Generation', () => {
  it('should generate sketches deterministically', () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 2]
    ];
    const repr = createTestRepr(grid);
    const request = createTestRequest();

    const sketches1 = generateSketches(repr, request);
    const sketches2 = generateSketches(repr, request);

    expect(sketches1.length).toBe(sketches2.length);
    expect(sketches1).toEqual(sketches2);
  });

  it('should generate sketches with all chains', () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1]
    ];
    const repr = createTestRepr(grid);
    const request = createTestRequest();

    const sketches = generateSketches(repr, request);

    expect(sketches.length).toBeGreaterThan(0);
    // Check that we have chain A (recolor)
    const hasRecolor = sketches.some(s => s.includes('recolor'));
    expect(hasRecolor).toBe(true);
    // Check that we have chain B (crop)
    const hasCrop = sketches.some(s => s.includes('crop_to_bbox'));
    expect(hasCrop).toBe(true);
  });
});

describe('Enumerator - Enumeration', () => {
  it('should enumerate programs deterministically', async () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1]
    ];
    const repr = createTestRepr(grid);
    const request = createTestRequest();

    const result1 = await enumeratePrograms(repr, request, grid, undefined, {
      max_proposals: 10,
      max_depth: 3
    });

    const result2 = await enumeratePrograms(repr, request, grid, undefined, {
      max_proposals: 10,
      max_depth: 3
    });

    // Should produce same number of programs
    expect(result1.programs.length).toBe(result2.programs.length);
    
    // Should produce same program IDs
    const ids1 = result1.programs.map(p => p.program_id).sort();
    const ids2 = result2.programs.map(p => p.program_id).sort();
    expect(ids1).toEqual(ids2);
  });

  it('should respect max_proposals limit', async () => {
    const grid = [
      [0, 0, 1, 2],
      [0, 1, 1, 2],
      [3, 3, 3, 3]
    ];
    const repr = createTestRepr(grid);
    const request = createTestRequest();

    const result = await enumeratePrograms(repr, request, grid, undefined, {
      max_proposals: 5,
      max_depth: 3
    });

    expect(result.programs.length).toBeLessThanOrEqual(5);
  });

  it('should track pruning counts', async () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1]
    ];
    const repr = createTestRepr(grid);
    const request = createTestRequest();

    const result = await enumeratePrograms(repr, request, grid, undefined, {
      max_proposals: 20,
      max_depth: 3
    });

    expect(result.counts.total_generated).toBeGreaterThan(0);
    expect(result.counts.total_generated).toBe(
      result.counts.pruned_precheck +
      result.counts.pruned_tier1 +
      result.counts.pruned_tier2 +
      result.counts.passed_tier2
    );
  });
});























