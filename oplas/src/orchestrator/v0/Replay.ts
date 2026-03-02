/**
 * Replay
 * 
 * Replays a task run deterministically.
 * 
 * Version: 1.0.0
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { Request } from '../../contracts/types/Request';
import { Program } from '../../dsl/v0/types';
import { TaskRunInputs } from './types';
import { runTask } from './Orchestrator';
import { loadProgramsFromFixtures } from './FixturesRunner';
import { parseDSL, buildProgram } from '../../dsl/v0';

/**
 * Replays a task run.
 */
export async function replayTask(
  taskId: string,
  taskRoot: string
): Promise<{ ok: boolean; error?: string; summary?: any }> {
  const taskDir = join(taskRoot, `task_${taskId}`);
  const runDir = join(taskDir, 'runs');

  try {
    // Read request.json
    const requestJson = await readFile(join(taskDir, 'request.json'), 'utf8');
    const request: Request = JSON.parse(requestJson);

    // Read inputs/grid.json
    const gridJson = await readFile(join(taskDir, 'inputs', 'grid.json'), 'utf8');
    const gridData = JSON.parse(gridJson);
    const input_grid = gridData.cells;

    // Read examples if present
    const examples: Array<{ input_grid: number[][]; expected_output_grid: number[][] }> = [];
    try {
      let i = 0;
      while (true) {
        const exampleInputJson = await readFile(join(taskDir, 'inputs', `example_${i}_input.json`), 'utf8');
        const exampleExpectedJson = await readFile(join(taskDir, 'inputs', `example_${i}_expected.json`), 'utf8');
        const exampleInput = JSON.parse(exampleInputJson);
        const exampleExpected = JSON.parse(exampleExpectedJson);
        examples.push({
          input_grid: exampleInput.cells,
          expected_output_grid: exampleExpected.cells
        });
        i++;
      }
    } catch {
      // No more examples
    }

    // Find run directories
    const runDirs = await readdir(runDir);
    if (runDirs.length === 0) {
      return { ok: false, error: 'No run directories found' };
    }

    // Use first run directory
    const firstRunDir = runDirs[0];
    const candidateDir = join(runDir, firstRunDir, 'candidates');

    // Load candidate programs
    const candidatePrograms: Program[] = [];
    try {
      const candidateDirs = await readdir(candidateDir);
      for (const candidateId of candidateDirs) {
        const programDslPath = join(candidateDir, candidateId, 'program.dsl');
        const programDsl = await readFile(programDslPath, 'utf8');
        const parse = parseDSL(programDsl.trim());
        if (parse.ok && parse.ast && parse.declared_frame) {
          const build = buildProgram(parse.ast, parse.declared_frame);
          if (build.ok && build.program) {
            candidatePrograms.push(build.program);
          }
        }
      }
    } catch (error) {
      return { ok: false, error: `Failed to load candidates: ${error}` };
    }

    // Re-run task
    const summary = await runTask(
      request,
      candidatePrograms,
      { grid: input_grid, examples },
      taskRoot
    );

    // Compare with original summary
    const originalSummaryJson = await readFile(join(runDir, firstRunDir, 'summary.json'), 'utf8');
    const originalSummary = JSON.parse(originalSummaryJson);

    // Check determinism (ignore run_id and timestamps)
    const originalOk = originalSummary.ok;
    const originalWinner = originalSummary.winner_program_id;
    const replayOk = summary.ok;
    const replayWinner = summary.winner_program_id;

    if (originalOk !== replayOk || originalWinner !== replayWinner) {
      return {
        ok: false,
        error: `Replay mismatch: original ok=${originalOk} winner=${originalWinner}, replay ok=${replayOk} winner=${replayWinner}`,
        summary
      };
    }

    return { ok: true, summary };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown replay error'
    };
  }
}

