import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { buildServer } from '../../src/api/server.js';
import type { CreateAnalysisRequest } from '../../src/api/types.js';
import { saveAnalysis } from '../../src/api/storage.js';

const execAsync = promisify(exec);

describe('Export Script', () => {
  let tempDir: string;
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'reflexive-export-'));
    server = await buildServer();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await server.close();
  });

  it('export script writes all 3 files', async () => {
    // Create a dry_run analysis and save it
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M? They have $200M annual revenue.',
        type: 'decision',
      },
      options: {
        dry_run: true,
      },
    };

    const createResponse = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: request,
    });

    expect(createResponse.statusCode).toBe(200);
    const createBody = JSON.parse(createResponse.body);
    const analysisId = createBody.analysis_id;

    // Save it manually for the export script to find, with confidence_score added
    const responseWithConfidence = {
      ...createBody,
      engine_output: {
        synthesis: {
          confidence_score: 0.5,
          convergence_points: [],
          divergence_points: [],
          orphan_claims: [],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: responseWithConfidence,
      status: 'completed',
      duration_ms: createBody.run_metadata.duration_ms,
    });

    // Run export script
    const cwd = process.cwd();
    const { stdout, stderr } = await execAsync(
      `npx tsx eval/demo/export-demo-pack.ts --id ${analysisId} --out ${tempDir}`,
      { cwd }
    ).catch(err => {
      // If script fails, still check if files were created
      return { stdout: '', stderr: err.message || '' };
    });

    // Verify files exist
    const demoPackPath = join(tempDir, `${analysisId}.demo-pack.json`);
    const artifactsPath = join(tempDir, `${analysisId}.artifacts.json`);
    const synthesisPath = join(tempDir, `${analysisId}.synthesis.json`);

    expect(existsSync(demoPackPath)).toBe(true);
    expect(existsSync(artifactsPath)).toBe(true);
    expect(existsSync(synthesisPath)).toBe(true);

    // Verify content
    const demoPack = JSON.parse(readFileSync(demoPackPath, 'utf-8'));
    const artifacts = JSON.parse(readFileSync(artifactsPath, 'utf-8'));
    const synthesis = JSON.parse(readFileSync(synthesisPath, 'utf-8'));

    expect(demoPack.analysis_id).toBe(analysisId);
    expect(demoPack.artifacts).toEqual(artifacts);
    expect(demoPack.synthesis).toEqual(synthesis);
    
    // Verify exec_summary.txt was written
    const execSummaryPath = join(tempDir, `${analysisId}.exec-summary.txt`);
    expect(existsSync(execSummaryPath)).toBe(true);
    
    const execSummary = readFileSync(execSummaryPath, 'utf-8');
    expect(typeof execSummary).toBe('string');
    expect(execSummary.length).toBeGreaterThan(0);
    expect(execSummary).toContain('REFLEXIVE Analysis Summary');
  }, 30000);
});
