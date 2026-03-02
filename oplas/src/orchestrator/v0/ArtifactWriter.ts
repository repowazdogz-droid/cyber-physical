/**
 * Artifact Writer
 * 
 * Writes task bundle artifacts.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { CandidateResult } from './types';
import { RunSummary } from './types';
import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { writeTrace } from '../../verifier/v0/TraceWriter';
import { VerifierTraceEvent } from '../../verifier/v0/types';
import { Grid } from '../../executor/v0/types';

/**
 * Writes task bundle artifacts.
 */
export async function writeTaskBundle(
  taskId: string,
  taskRoot: string,
  request: Request,
  repr: CanonicalRepresentation,
  candidates: CandidateResult[],
  summary: RunSummary,
  input_grid: Grid,
  examples?: Array<{ input_grid: Grid; expected_output_grid: Grid }>
): Promise<void> {
  const taskDir = join(taskRoot, `task_${taskId}`);
  const inputsDir = join(taskDir, 'inputs');
  const runsDir = join(taskDir, 'runs');
  const runDir = join(runsDir, summary.run_id);
  const candidatesDir = join(runDir, 'candidates');

  // Create directories
  await fs.mkdir(taskDir, { recursive: true });
  await fs.mkdir(inputsDir, { recursive: true });
  await fs.mkdir(runsDir, { recursive: true });
  await fs.mkdir(runDir, { recursive: true });
  await fs.mkdir(candidatesDir, { recursive: true });

  // Write request.json
  await fs.writeFile(
    join(taskDir, 'request.json'),
    JSON.stringify(request, null, 2),
    'utf8'
  );

  // Write inputs/grid.json
  await fs.writeFile(
    join(inputsDir, 'grid.json'),
    JSON.stringify({ cells: input_grid }, null, 2),
    'utf8'
  );

  // Write repr.json and repr.sha256
  await fs.writeFile(
    join(taskDir, 'repr.json'),
    JSON.stringify(repr, null, 2),
    'utf8'
  );
  await fs.writeFile(
    join(taskDir, 'repr.sha256'),
    repr.repr_id,
    'utf8'
  );

  // Write example reprs if present
  if (examples) {
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      await fs.writeFile(
        join(inputsDir, `example_${i}_input.json`),
        JSON.stringify({ cells: example.input_grid }, null, 2),
        'utf8'
      );
      await fs.writeFile(
        join(inputsDir, `example_${i}_expected.json`),
        JSON.stringify({ cells: example.expected_output_grid }, null, 2),
        'utf8'
      );
    }
  }

  // Write candidate results
  for (const candidate of candidates) {
    const candidateDir = join(candidatesDir, candidate.program.program_id);
    await fs.mkdir(candidateDir, { recursive: true });

    // Write program.dsl
    await fs.writeFile(
      join(candidateDir, 'program.dsl'),
      candidate.program.dsl_source,
      'utf8'
    );

    // Write program.json
    await fs.writeFile(
      join(candidateDir, 'program.json'),
      JSON.stringify({
        program_id: candidate.program.program_id,
        dsl_grammar_version: candidate.program.dsl_grammar_version,
        declared_frame: candidate.program.declared_frame,
        ast: candidate.program.ast
      }, null, 2),
      'utf8'
    );

    // Write exec_trace.jsonl (from executor trace)
    if (candidate.exec_result.trace) {
      const execTrace = candidate.exec_result.trace.map(event => JSON.stringify(event)).join('\n');
      await fs.writeFile(
        join(candidateDir, 'exec_trace.jsonl'),
        execTrace,
        'utf8'
      );
    }

    // Write output_grid.json (if ok)
    if (candidate.exec_result.ok && candidate.exec_result.outputs?.grid) {
      await fs.writeFile(
        join(candidateDir, 'output_grid.json'),
        JSON.stringify({ cells: candidate.exec_result.outputs.grid }, null, 2),
        'utf8'
      );
    }

    // Write verifier_trace.jsonl
    const verifierTrace: VerifierTraceEvent[] = candidate.verifier_result.failure_details?.trace_events || [];
    if (verifierTrace.length > 0) {
      const verifierTraceJsonl = writeTrace(verifierTrace);
      await fs.writeFile(
        join(candidateDir, 'verifier_trace.jsonl'),
        verifierTraceJsonl,
        'utf8'
      );
    }

    // Write cost.json
    await fs.writeFile(
      join(candidateDir, 'cost.json'),
      JSON.stringify(candidate.cost_breakdown, null, 2),
      'utf8'
    );
  }

  // Write winner.json or failure.json
  if (summary.ok && summary.winner_result) {
    await fs.writeFile(
      join(runDir, 'winner.json'),
      JSON.stringify({
        program_id: summary.winner_program_id,
        cost_breakdown: summary.winner_result.cost_breakdown,
        verifier_result: {
          ok: summary.winner_result.verifier_result.ok,
          highest_tier_passed: summary.winner_result.verifier_result.highest_tier_passed
        }
      }, null, 2),
      'utf8'
    );
  } else {
    await fs.writeFile(
      join(runDir, 'failure.json'),
      JSON.stringify({
        failure_reason: summary.failure_reason,
        closest_candidate: summary.closest_candidate
      }, null, 2),
      'utf8'
    );
  }

  // Write run_trace.jsonl
  const runTraceJsonl = summary.events.map(event => JSON.stringify(event)).join('\n');
  await fs.writeFile(
    join(runDir, 'run_trace.jsonl'),
    runTraceJsonl,
    'utf8'
  );

  // Write summary.json
  await fs.writeFile(
    join(runDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );
}

