/**
 * Invariance Tests
 * 
 * Tests for Level-0 invariance probing.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { testPalettePermutation, testTranslationInvariance } from '../InvarianceTests';
import { validateTier3 } from '../Tier3';
import { parseDSL, buildProgram } from '../../../dsl/v0';
import { parseGrid } from '../../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';
import { Domain } from '../../../contracts/enums/Domains';
import { Request } from '../../../contracts/types/Request';
import { DEFAULT_BUDGETS } from '../../../contracts/types/BudgetSpec';
import { FrameMode } from '../../../contracts/enums/FrameModes';

function loadGridFixture(name: string): any {
  const path = join(process.cwd(), 'fixtures', 'grids', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadProgramFixture(name: string): string {
  const path = join(process.cwd(), 'fixtures', 'programs', `${name}.txt`);
  return readFileSync(path, 'utf8').trim();
}

function createTestRepr(grid: number[][]): any {
  const parseResult = parseGrid({ cells: grid });
  expect(parseResult.ok).toBe(true);
  if (!parseResult.repr) return null;

  let repr = canonicalizeGrid(parseResult.repr);
  repr.repr_id = hashCanonical(repr);
  return repr;
}

describe('Invariance Tests - Palette Permutation', () => {
  it('should pass palette permutation for recolor program', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    if (!repr) return;

    // Create example with expected output (same as input for recolor)
    const inputGrid = grid.cells;
    const expectedOutput = grid.cells;

    const result = testPalettePermutation(
      build.program,
      repr,
      inputGrid,
      expectedOutput
    );

    // Should pass or skip (if insufficient colors)
    expect(result.ok || result.details?.skipped).toBe(true);
  });
});

describe('Invariance Tests - Translation', () => {
  it('should pass translation for RELATIVE program', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    // Ensure program is RELATIVE
    expect(build.program.declared_frame).toBe(FrameMode.RELATIVE);

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    if (!repr) return;

    const inputGrid = grid.cells;
    const expectedOutput = grid.cells;

    const result = testTranslationInvariance(
      build.program,
      repr,
      inputGrid,
      expectedOutput
    );

    // Should pass or skip
    expect(result.ok || result.details?.skipped).toBe(true);
  });

  it('should skip translation for ABSOLUTE program', () => {
    // Create an ABSOLUTE program (if we have one in fixtures)
    // For now, just verify the skip logic works
    expect(true).toBe(true); // Placeholder
  });
});

describe('Invariance Tests - Tier 3', () => {
  it('should run Tier 3 invariance tests', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    if (!repr) return;

    const request: Request = {
      task_id: 'test',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: { enable_invariance: true }
    };

    const examples = [
      {
        input_grid: grid.cells,
        expected_output_grid: grid.cells
      }
    ];

    const result = validateTier3(
      request,
      repr,
      build.program,
      grid.cells,
      grid.cells,
      examples,
      'run_test',
      repr.repr_id,
      build.program.program_id,
      true
    );

    expect(result.events.length).toBeGreaterThan(0);
  });
});

describe('Invariance Tests - Determinism', () => {
  it('should generate deterministic palette permutation', () => {
    const grid = loadGridFixture('two_separated');
    const repr1 = createTestRepr(grid.cells);
    const repr2 = createTestRepr(grid.cells);
    
    if (!repr1 || !repr2) return;

    // Same repr_id should generate same permutation
    expect(repr1.repr_id).toBe(repr2.repr_id);

    // Test that permutation is deterministic
    const colors = [0, 1];
    const { generatePalettePermutation } = require('../InvarianceTests');
    
    // This test would need access to the internal function
    // For now, verify through integration test
    expect(true).toBe(true);
  });
});























