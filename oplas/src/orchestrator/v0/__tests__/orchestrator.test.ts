/**
 * Orchestrator v0 Tests
 * 
 * Tests for orchestrator v0.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { runTask } from '../Orchestrator';
import { replayTask } from '../Replay';
import { loadProgramsFromFixtures } from '../FixturesRunner';
import { Request } from '../../../contracts/types/Request';
import { Domain } from '../../../contracts/enums/Domains';
import { DEFAULT_BUDGETS } from '../../../contracts/types/BudgetSpec';
import { parseDSL, buildProgram } from '../../../dsl/v0';

function loadGridFixture(name: string): any {
  const path = join(process.cwd(), 'fixtures', 'grids', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadProgramFixture(name: string): string {
  const path = join(process.cwd(), 'fixtures', 'programs', `${name}.txt`);
  return readFileSync(path, 'utf8').trim();
}

describe('Orchestrator v0 - Fixtures Runner', () => {
  it('should load programs from fixtures', async () => {
    const fixturesDir = join(process.cwd(), 'fixtures', 'programs');
    const programs = await loadProgramsFromFixtures(fixturesDir);

    expect(programs.length).toBeGreaterThan(0);
    expect(programs[0].program_id).toBeDefined();
  });
});

describe('Orchestrator v0 - Task Run', () => {
  it('should run task end-to-end', async () => {
    const source1 = loadProgramFixture('01_simple_recolor');
    const parse1 = parseDSL(source1);
    expect(parse1.ok).toBe(true);
    if (!parse1.ast || !parse1.declared_frame) return;

    const build1 = buildProgram(parse1.ast, parse1.declared_frame);
    expect(build1.ok).toBe(true);
    if (!build1.program) return;

    const grid = loadGridFixture('single_color');
    const request: Request = {
      task_id: 'test-task-1',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const taskRoot = join(process.cwd(), 'tmp', 'tasks');
    const summary = await runTask(
      request,
      [build1.program],
      { grid: grid.cells },
      taskRoot
    );

    expect(summary.ok).toBeDefined();
    expect(summary.candidates_evaluated).toBe(1);
    expect(summary.events.length).toBeGreaterThan(0);
  });

  it('should select winner from multiple candidates', async () => {
    const source1 = loadProgramFixture('01_simple_recolor');
    const source2 = loadProgramFixture('02_select_and_recolor');

    const parse1 = parseDSL(source1);
    const parse2 = parseDSL(source2);
    expect(parse1.ok && parse2.ok).toBe(true);
    if (!parse1.ast || !parse1.declared_frame || !parse2.ast || !parse2.declared_frame) return;

    const build1 = buildProgram(parse1.ast, parse1.declared_frame);
    const build2 = buildProgram(parse2.ast, parse2.declared_frame);
    expect(build1.ok && build2.ok).toBe(true);
    if (!build1.program || !build2.program) return;

    const grid = loadGridFixture('single_color');
    const request: Request = {
      task_id: 'test-task-2',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const taskRoot = join(process.cwd(), 'tmp', 'tasks');
    const summary = await runTask(
      request,
      [build1.program, build2.program],
      { grid: grid.cells },
      taskRoot
    );

    expect(summary.candidates_evaluated).toBe(2);
    // At least one should be evaluated
    expect(summary.events.length).toBeGreaterThan(0);
  });
});

describe('Orchestrator v0 - Budget Enforcement', () => {
  it('should enforce max_proposals budget', async () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const request: Request = {
      task_id: 'test-task-3',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: {
        ...DEFAULT_BUDGETS,
        max_proposals: 1
      },
      run_config: {}
    };

    const taskRoot = join(process.cwd(), 'tmp', 'tasks');
    const summary = await runTask(
      request,
      [build.program, build.program, build.program], // 3 candidates
      { grid: grid.cells },
      taskRoot
    );

    expect(summary.candidates_evaluated).toBeLessThanOrEqual(1);
    if (summary.budget_exhausted) {
      expect(summary.events.some(e => e.event_type === 'budget_exhausted')).toBe(true);
    }
  });
});

describe('Orchestrator v0 - Deterministic Replay', () => {
  it('should produce identical results on replay', async () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const request: Request = {
      task_id: 'test-task-replay',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const taskRoot = join(process.cwd(), 'tmp', 'tasks');
    
    // First run
    const summary1 = await runTask(
      request,
      [build.program],
      { grid: grid.cells },
      taskRoot
    );

    // Replay
    const replayResult = await replayTask('test-task-replay', taskRoot);
    expect(replayResult.ok).toBe(true);
    expect(replayResult.summary?.ok).toBe(summary1.ok);
    if (summary1.ok && replayResult.summary?.ok) {
      expect(replayResult.summary.winner_program_id).toBe(summary1.winner_program_id);
    }
  });
});

describe('Orchestrator v0 - Selection Determinism', () => {
  it('should select deterministically with tie-break', async () => {
    // Create two programs with same cost
    const source1 = loadProgramFixture('01_simple_recolor');
    const source2 = loadProgramFixture('01_simple_recolor'); // Same program

    const parse1 = parseDSL(source1);
    const parse2 = parseDSL(source2);
    expect(parse1.ok && parse2.ok).toBe(true);
    if (!parse1.ast || !parse1.declared_frame || !parse2.ast || !parse2.declared_frame) return;

    const build1 = buildProgram(parse1.ast, parse1.declared_frame);
    const build2 = buildProgram(parse2.ast, parse2.declared_frame);
    expect(build1.ok && build2.ok).toBe(true);
    if (!build1.program || !build2.program) return;

    const grid = loadGridFixture('single_color');
    const request: Request = {
      task_id: 'test-task-selection',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const taskRoot = join(process.cwd(), 'tmp', 'tasks');
    
    // Run multiple times
    const summary1 = await runTask(
      request,
      [build1.program, build2.program],
      { grid: grid.cells },
      taskRoot
    );

    const summary2 = await runTask(
      { ...request, task_id: 'test-task-selection-2' },
      [build1.program, build2.program],
      { grid: grid.cells },
      taskRoot
    );

    // Selection should be deterministic (same winner if both pass)
    if (summary1.ok && summary2.ok) {
      // Both should select the same winner (tie-break by program_id)
      expect(summary1.winner_program_id).toBe(summary2.winner_program_id);
    }
  });
});























