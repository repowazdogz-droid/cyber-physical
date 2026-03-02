import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/api/server.js';
import type { CreateAnalysisRequest } from '../../src/api/types.js';

describe('Artifacts API', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /v1/analyses/:id/artifacts returns 404 for non-existent analysis', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/analyses/00000000-0000-0000-0000-000000000000/artifacts',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET /v1/analyses/:id/artifacts returns artifacts for stored analysis', async () => {
    // First create a dry_run analysis
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M? They have $200M annual revenue.',
        type: 'decision',
      },
      options: {
        dry_run: true,
        save: true,
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

    // Then fetch artifacts
    const artifactsResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/artifacts`,
    });

    expect(artifactsResponse.statusCode).toBe(200);
    const artifactsBody = JSON.parse(artifactsResponse.body);
    
    expect(artifactsBody.analysis_id).toBe(analysisId);
    expect(artifactsBody.created_at).toBeDefined();
    expect(artifactsBody.config_snapshot).toBeDefined();
    expect(artifactsBody.lens_artifacts).toBeDefined();
    expect(artifactsBody.claim_artifacts).toBeDefined();
    expect(artifactsBody.evidence_artifacts).toBeDefined();
    
    // Verify schema matches expected structure
    expect(Array.isArray(artifactsBody.lens_artifacts)).toBe(true);
    expect(Array.isArray(artifactsBody.claim_artifacts)).toBe(true);
    expect(artifactsBody.evidence_artifacts.items).toBeDefined();
    expect(artifactsBody.evidence_artifacts.links).toBeDefined();
  });

  it('GET /v1/analyses/:id/artifacts lens_artifacts count matches lens_results', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M? They have $200M annual revenue.',
        type: 'decision',
      },
      options: {
        dry_run: true,
        save: true,
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

    // Fetch artifacts
    const artifactsResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/artifacts`,
    });

    expect(artifactsResponse.statusCode).toBe(200);
    const artifactsBody = JSON.parse(artifactsResponse.body);
    
    // For dry_run, lens_results is empty, so lens_artifacts should also be empty
    expect(artifactsBody.lens_artifacts.length).toBe(createBody.lens_results.length);
  });
});
