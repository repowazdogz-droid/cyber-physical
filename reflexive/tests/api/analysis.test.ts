import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/api/server.js';
import type { CreateAnalysisRequest } from '../../src/api/types.js';

describe('Analysis API', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('POST /v1/analyses with dry_run returns skeleton response', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M? They have $200M annual revenue.',
        type: 'decision',
      },
      options: {
        dry_run: true,
      },
    };

    const response = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: request,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    
    expect(body.analysis_id).toBeDefined();
    expect(body.created_at).toBeDefined();
    expect(body.inputs).toEqual(request);
    expect(body.run_metadata).toBeDefined();
    expect(body.run_metadata.models).toBeDefined();
    expect(body.run_metadata.engine_config_snapshot).toBeDefined();
    expect(body.lens_results).toEqual([]);
    expect(body.claims).toEqual([]);
    expect(body.evidence).toBeDefined();
    expect(body.engine_output).toBeUndefined();
    expect(body.warnings).toBeDefined();
    expect(body.warnings.length).toBeGreaterThan(0);
  });

  it('POST /v1/analyses validates required fields', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: {
        stimulus: {},
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  it('POST /v1/analyses validates minimum text length', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: {
        stimulus: {
          text: 'short',
          type: 'decision',
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('INSUFFICIENT_INPUT');
  });

  it('GET /v1/analyses/:id returns 404 for non-existent analysis', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/analyses/00000000-0000-0000-0000-000000000000',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('POST /v1/analyses dry_run does not store when save=false', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M? They have $200M annual revenue.',
        type: 'decision',
      },
      options: {
        dry_run: true,
        save: false,
      },
    };

    const response = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: request,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const analysisId = body.analysis_id;

    // Try to fetch it back - should 404
    const getResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}`,
    });

    expect(getResponse.statusCode).toBe(404);
  });

  it('POST /v1/analyses dry_run saves to storage when save=true', async () => {
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

    const response = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: request,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const analysisId = body.analysis_id;

    // Try to fetch it back
    const getResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}`,
    });

    expect(getResponse.statusCode).toBe(200);
    const getBody = JSON.parse(getResponse.body);
    expect(getBody.analysis_id).toBe(analysisId);
    expect(getBody.inputs).toEqual(request);
  });

  it('GET /v1/analyses/:id returns identical response_json as stored', async () => {
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

    // Fetch it back
    const getResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}`,
    });

    expect(getResponse.statusCode).toBe(200);
    const getBody = JSON.parse(getResponse.body);
    
    // Deep equality check
    expect(getBody).toEqual(createBody);
  });
});
