import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/api/server.js';
import type { CreateAnalysisRequest } from '../../src/api/types.js';

describe('Demo Pack API', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /v1/analyses/:id/demo-pack returns 404 for non-existent analysis', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/analyses/00000000-0000-0000-0000-000000000000/demo-pack',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET /v1/analyses/:id/demo-pack returns complete demo pack with summary', async () => {
    // Create a dry_run analysis first
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

    // Update stored analysis to include confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
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

    // Fetch demo pack
    const demoPackResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack`,
    });

    expect(demoPackResponse.statusCode).toBe(200);
    const demoPack = JSON.parse(demoPackResponse.body);

    // Verify structure
    expect(demoPack.analysis_id).toBe(analysisId);
    expect(demoPack.created_at).toBeDefined();
    expect(demoPack.schema_version).toBe('demo-pack@0.1.5');
    expect(demoPack.model_snapshot).toBeDefined();
    expect(demoPack.model_snapshot.created_at).toBe(demoPack.created_at);
    expect(demoPack.request).toBeDefined();
    expect(demoPack.summary).toBeDefined();
    expect(demoPack.synthesis).toBeDefined();
    expect(demoPack.artifacts).toBeDefined();
    expect(demoPack.config_snapshot).toBeDefined();

    // Verify summary structure
    expect(demoPack.summary.confidence_score).toBeDefined();
    expect(demoPack.summary.band).toBeDefined();
    expect(demoPack.summary.convergence_count).toBeDefined();
    expect(demoPack.summary.divergence_count).toBeDefined();
    expect(demoPack.summary.orphan_count).toBeDefined();

    // Verify summary counts match synthesis
    const convergenceCount = Array.isArray(demoPack.synthesis.convergence_points) 
      ? demoPack.synthesis.convergence_points.length : 0;
    const divergenceCount = Array.isArray(demoPack.synthesis.divergence_points)
      ? demoPack.synthesis.divergence_points.length : 0;
    const orphanCount = Array.isArray(demoPack.synthesis.orphan_claims)
      ? demoPack.synthesis.orphan_claims.length : 0;

    expect(demoPack.summary.convergence_count).toBe(convergenceCount);
    expect(demoPack.summary.divergence_count).toBe(divergenceCount);
    expect(demoPack.summary.orphan_count).toBe(orphanCount);
  });

  it('GET /v1/analyses/:id/demo-pack includes artifacts schema exactly like /artifacts', async () => {
    // Create a dry_run analysis
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Update stored analysis to include confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
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

    // Fetch demo pack
    const demoPackResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack`,
    });

    // Fetch artifacts
    const artifactsResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/artifacts`,
    });

    expect(demoPackResponse.statusCode).toBe(200);
    expect(artifactsResponse.statusCode).toBe(200);

    const demoPack = JSON.parse(demoPackResponse.body);
    const artifacts = JSON.parse(artifactsResponse.body);

    // Verify artifacts match
    expect(demoPack.artifacts).toEqual(artifacts);
  });

  it('GET /v1/analyses/:id/demo-pack includes exec_summary and redlines', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Update stored analysis to include confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
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

    // Fetch demo pack
    const demoPackResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack`,
    });

    expect(demoPackResponse.statusCode).toBe(200);
    const demoPack = JSON.parse(demoPackResponse.body);

    // Verify exec_summary exists and is a string
    expect(demoPack.exec_summary).toBeDefined();
    expect(typeof demoPack.exec_summary).toBe('string');
    expect(demoPack.exec_summary.length).toBeGreaterThan(0);

    // Verify redlines exists and is an array
    expect(demoPack.redlines).toBeDefined();
    expect(Array.isArray(demoPack.redlines)).toBe(true);

    // Verify redlines structure if any exist
    if (demoPack.redlines.length > 0) {
      for (const redline of demoPack.redlines) {
        expect(redline.type).toBeDefined();
        expect(['convergence', 'divergence', 'orphan', 'evidence_gap']).toContain(redline.type);
        expect(Array.isArray(redline.claim_ids)).toBe(true);
        expect(redline.why_it_matters).toBeDefined();
      }
    }
  });

  it('GET /v1/analyses/:id/demo-pack.txt returns plain text with confidence score and SIM_MATCH', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Update stored analysis to include confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
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

    // Fetch demo pack text
    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    expect(txtResponse.headers['content-type']).toContain('text/plain');
    
    const text = txtResponse.body;
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    
    // Verify it contains key elements
    expect(text).toContain('REFLEXIVE Analysis Summary');
    expect(text).toContain('Confidence:');
    expect(text).toContain('Counts:');
    expect(text).toContain('Evidence:');
  });

  it('GET /v1/analyses/:id/demo-pack includes exec_summary with confidence and band', async () => {
    // Create an analysis with mocked confidence_score
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Manually update the stored analysis to include confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      engine_output: {
        synthesis: {
          confidence_score: 0.75,
          convergence_points: [
            { theme_id: 't1', theme_label: 'Test convergence', supporting_claims: [], supporting_lenses: [], strength: 0.8, evidence_density: 0.5 },
          ],
          divergence_points: [],
          orphan_claims: ['claim-1'],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    // Fetch demo pack
    const demoPackResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack`,
    });

    expect(demoPackResponse.statusCode).toBe(200);
    const demoPack = JSON.parse(demoPackResponse.body);

    // Verify exec_summary contains confidence
    expect(demoPack.exec_summary).toBeDefined();
    expect(typeof demoPack.exec_summary).toBe('string');
    expect(demoPack.exec_summary).toContain('Confidence:');
    expect(demoPack.exec_summary).toMatch(/\d+\.\d{4}/); // Should contain a number with 4 decimal places
    expect(demoPack.exec_summary).toContain('band');
    expect(demoPack.exec_summary).toContain('Convergence=');
    expect(demoPack.exec_summary).toContain('Divergence=');
    expect(demoPack.exec_summary).toContain('Orphans=');
  });

  it('GET /v1/analyses/:id/demo-pack.txt contains confidence and counts', async () => {
    // Create an analysis with mocked confidence_score
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Manually update the stored analysis to include confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
          convergence_points: [
            { theme_id: 't1', theme_label: 'Test convergence', supporting_claims: [], supporting_lenses: [], strength: 0.8, evidence_density: 0.5 },
          ],
          divergence_points: [
            { theme_id: 't2', theme_label: 'Test divergence', positions: [], nature: 'contradictory', severity: 0.5 },
          ],
          orphan_claims: ['claim-1', 'claim-2'],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    // Fetch demo pack text
    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    expect(txtResponse.headers['content-type']).toContain('text/plain');
    
    const text = txtResponse.body;
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    
    // Verify it contains the three required lines
    expect(text).toContain('Confidence:');
    expect(text).toMatch(/Confidence: \d+\.\d{4}/);
    expect(text).toContain('band');
    
    expect(text).toContain('Counts:');
    expect(text).toContain('Convergence=');
    expect(text).toContain('Divergence=');
    expect(text).toContain('Orphans=');
    
    expect(text).toContain('Evidence:');
    expect(text).toMatch(/Evidence: \d+\/\d+ claims linked/);
    
    // Verify Schema and Models lines
    expect(text).toContain('Schema: demo-pack@0.1.5');
    expect(text).toContain('Models:');
    
    // Verify counts match
    expect(text).toContain('Convergence=1');
    expect(text).toContain('Divergence=1');
    expect(text).toContain('Orphans=2');
  });

  it('GET /v1/analyses/:id/demo-pack.txt shows unknown placeholders when metadata missing', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Create analysis without run_metadata.models
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      run_metadata: {
        duration_ms: 1000,
        // No models field
      },
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
      ],
      evidence: {
        items: [],
        links: [],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
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
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const text = txtResponse.body;
    
    // Should show unknown placeholders
    expect(text).toContain('Schema: demo-pack@0.1.5');
    expect(text).toContain('Models: llm=unknown embed=unknown run_id=unknown');
  });

  it('GET /v1/analyses/:id/demo-pack.txt does not include Interpretation when evidence_rate >= 0.25', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Create analysis with evidence_rate >= 0.25 (3/4 = 0.75)
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
        { claim_id: 'c3', lens: 'risk', text: 'Claim 3', about_entity: 'Company X', polarity: 'negative', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:0' } },
        { claim_id: 'c4', lens: 'analytical', text: 'Claim 4', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:1' } },
      ],
      evidence: {
        items: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }],
        links: [
          { claim_id: 'c1', evidence_item_id: 'e1', support_type: 'supports' },
          { claim_id: 'c2', evidence_item_id: 'e2', support_type: 'supports' },
          { claim_id: 'c3', evidence_item_id: 'e3', support_type: 'supports' },
        ],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
          convergence_points: [
            { theme_id: 't1', theme_label: 'Test convergence', supporting_claims: ['c1', 'c2'], supporting_lenses: ['analytical', 'strategic'], strength: 0.8, evidence_density: 0.5 },
          ],
          divergence_points: [],
          orphan_claims: [],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const text = txtResponse.body;
    
    // Should NOT contain Interpretation line
    expect(text).not.toContain('Interpretation: Conservative — low evidence inflates penalties');
  });

  it('GET /v1/analyses/:id/demo-pack.txt includes Interpretation when evidence_rate < 0.25', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Create analysis with evidence_rate < 0.25 (1/5 = 0.2)
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
        { claim_id: 'c3', lens: 'risk', text: 'Claim 3', about_entity: 'Company X', polarity: 'negative', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:0' } },
        { claim_id: 'c4', lens: 'analytical', text: 'Claim 4', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:1' } },
        { claim_id: 'c5', lens: 'strategic', text: 'Claim 5', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:1' } },
      ],
      evidence: {
        items: [{ id: 'e1' }],
        links: [
          { claim_id: 'c1', evidence_item_id: 'e1', support_type: 'supports' },
        ],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
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
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const text = txtResponse.body;
    
    // Should contain Interpretation line exactly
    expect(text).toContain('Interpretation: Conservative — low evidence inflates penalties');
    // Should not contain the old conditional clause
    expect(text).not.toContain('only if linked/total');
  });

  it('GET /v1/analyses/:id/demo-pack.txt includes REDLINES section', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
      ],
      evidence: {
        items: [],
        links: [{ claim_id: 'c1', evidence_item_id: 'e1', support_type: 'supports' }],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
          convergence_points: [
            { theme_id: 't1', theme_label: 'Test convergence', supporting_claims: ['c1', 'c2'], supporting_lenses: ['analytical', 'strategic'], strength: 0.8, evidence_density: 0.5 },
          ],
          divergence_points: [],
          orphan_claims: [],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const text = txtResponse.body;
    expect(text).toContain('REDLINES');
    expect(text).toContain('[CONVERGENCE]');
  });

  it('GET /v1/analyses/:id/demo-pack redlines include claim_ids and evidence_gap items', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
      ],
      evidence: {
        items: [],
        links: [],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
          convergence_points: [],
          divergence_points: [],
          orphan_claims: ['c1', 'c2'],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    const demoPackResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack`,
    });

    expect(demoPackResponse.statusCode).toBe(200);
    const demoPack = JSON.parse(demoPackResponse.body);
    expect(demoPack.redlines.length).toBeGreaterThan(0);
    const evidenceGapRedline = demoPack.redlines.find((r: any) => r.type === 'evidence_gap');
    expect(evidenceGapRedline).toBeDefined();
    expect(Array.isArray(evidenceGapRedline.claim_ids)).toBe(true);
    expect(evidenceGapRedline.claim_ids.length).toBeGreaterThan(0);
  });

  it('GET /v1/analyses/:id/demo-pack evidence denominator uses ALL claims (regression guard)', async () => {
    // CRITICAL TEST: Ensures denominator = total claims, not convergence/divergence-only
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Create analysis with 10 claims total, but only 2 have evidence
    // Convergence/divergence reference fewer than 10 claims
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
        { claim_id: 'c3', lens: 'risk', text: 'Claim 3', about_entity: 'Company X', polarity: 'negative', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:0' } },
        { claim_id: 'c4', lens: 'analytical', text: 'Claim 4', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:1' } },
        { claim_id: 'c5', lens: 'strategic', text: 'Claim 5', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:1' } },
        { claim_id: 'c6', lens: 'analytical', text: 'Claim 6', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:2' } },
        { claim_id: 'c7', lens: 'strategic', text: 'Claim 7', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:2' } },
        { claim_id: 'c8', lens: 'risk', text: 'Claim 8', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:1' } },
        { claim_id: 'c9', lens: 'analytical', text: 'Claim 9', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:3' } },
        { claim_id: 'c10', lens: 'strategic', text: 'Claim 10', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:3' } },
      ],
      evidence: {
        items: [{ id: 'e1' }, { id: 'e2' }],
        links: [
          { claim_id: 'c1', evidence_item_id: 'e1', support_type: 'supports' },
          { claim_id: 'c2', evidence_item_id: 'e2', support_type: 'supports' },
        ],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
          // Convergence references only 3 claims (c1, c2, c3)
          convergence_points: [
            { theme_id: 't1', theme_label: 'Test convergence', supporting_claims: ['c1', 'c2', 'c3'], supporting_lenses: ['analytical', 'strategic', 'risk'], strength: 0.8, evidence_density: 0.5 },
          ],
          // Divergence references only 2 claims (c4, c5)
          divergence_points: [
            { theme_id: 't2', theme_label: 'Test divergence', positions: [{ lens_id: 'analytical', claim_ids: ['c4', 'c5'], position_summary: 'Position A' }], nature: 'contradictory', severity: 0.6 },
          ],
          // Orphans are c6, c7, c8, c9, c10
          orphan_claims: ['c6', 'c7', 'c8', 'c9', 'c10'],
        },
      },
    };
    await saveAnalysis({
      analysis_id: analysisId,
      created_at: createBody.created_at,
      request_json: request,
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    // EXPLICIT SETUP ASSERTIONS (cannot pass by accident)
    // Verify stored analysis has exactly 10 claims
    expect(updatedResponse.claims.length).toBe(10);
    
    // Verify evidence links contain exactly 2 distinct claim_ids
    const distinctLinkedClaimIds = new Set(updatedResponse.evidence.links.map((l: any) => l.claim_id));
    expect(distinctLinkedClaimIds.size).toBe(2);
    expect(distinctLinkedClaimIds.has('c1')).toBe(true);
    expect(distinctLinkedClaimIds.has('c2')).toBe(true);
    
    // Verify convergence/divergence reference fewer than 10 claim ids (temptation is real)
    const convergenceClaimIds = updatedResponse.engine_output.synthesis.convergence_points[0].supporting_claims;
    const divergenceClaimIds = updatedResponse.engine_output.synthesis.divergence_points[0].positions[0].claim_ids;
    const allReferencedClaimIds = new Set([...convergenceClaimIds, ...divergenceClaimIds]);
    expect(allReferencedClaimIds.size).toBeLessThan(10); // Only 5 unique: c1, c2, c3, c4, c5
    expect(allReferencedClaimIds.size).toBe(5);

    // Fetch demo pack text
    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const execSummary = txtResponse.body;
    
    // CRITICAL ASSERTION: Denominator MUST be 10 (all claims), not 5 (convergence+divergence)
    // If someone changes denominator to convergence/divergence-only, this test MUST FAIL
    expect(execSummary).toContain('Evidence: 2/10 claims linked (20%)');
    
    // Verify it's NOT using a smaller denominator
    expect(execSummary).not.toContain('Evidence: 2/5');
    expect(execSummary).not.toContain('Evidence: 2/3');
  });

  it('GET /v1/analyses/:id/demo-pack counts unique claim_ids in evidence links (duplicate guard)', async () => {
    // Guard against counting duplicate evidence links as multiple linked claims
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
        { claim_id: 'c3', lens: 'risk', text: 'Claim 3', about_entity: 'Company X', polarity: 'negative', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:0' } },
        { claim_id: 'c4', lens: 'analytical', text: 'Claim 4', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:1' } },
        { claim_id: 'c5', lens: 'strategic', text: 'Claim 5', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:1' } },
        { claim_id: 'c6', lens: 'analytical', text: 'Claim 6', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:2' } },
        { claim_id: 'c7', lens: 'strategic', text: 'Claim 7', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:2' } },
        { claim_id: 'c8', lens: 'risk', text: 'Claim 8', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:1' } },
        { claim_id: 'c9', lens: 'analytical', text: 'Claim 9', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:3' } },
        { claim_id: 'c10', lens: 'strategic', text: 'Claim 10', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:3' } },
      ],
      evidence: {
        items: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }, { id: 'e4' }],
        links: [
          // Duplicate links for c1 (should count as 1 unique claim)
          { claim_id: 'c1', evidence_item_id: 'e1', support_type: 'supports' },
          { claim_id: 'c1', evidence_item_id: 'e2', support_type: 'supports' },
          // Duplicate links for c2 (should count as 1 unique claim)
          { claim_id: 'c2', evidence_item_id: 'e3', support_type: 'supports' },
          { claim_id: 'c2', evidence_item_id: 'e4', support_type: 'supports' },
        ],
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
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
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    // Verify setup: 4 links total, but only 2 unique claim_ids
    expect(updatedResponse.evidence.links.length).toBe(4);
    const distinctClaimIds = new Set(updatedResponse.evidence.links.map((l: any) => l.claim_id));
    expect(distinctClaimIds.size).toBe(2);

    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const execSummary = txtResponse.body;
    
    // Must report 2 unique linked claims, NOT 4 (total links)
    expect(execSummary).toContain('Evidence: 2/10 claims linked (20%)');
    expect(execSummary).not.toContain('Evidence: 4/10');
  });

  it('GET /v1/analyses/:id/demo-pack handles missing evidence object gracefully', async () => {
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
        { claim_id: 'c3', lens: 'risk', text: 'Claim 3', about_entity: 'Company X', polarity: 'negative', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:0' } },
      ],
      // No evidence object at all
      evidence: undefined,
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
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
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const execSummary = txtResponse.body;
    
    // Must output evidence line even with no evidence object
    expect(execSummary).toContain('Evidence: 0/3 claims linked (0%)');
    expect(execSummary).toContain('evidence not provided');
  });

  it('GET /v1/analyses/:id/demo-pack handles malformed evidence.links gracefully', async () => {
    // Fail-safe test: evidence.links exists but is not an array
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      claims: [
        { claim_id: 'c1', lens: 'analytical', text: 'Claim 1', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:0' } },
        { claim_id: 'c2', lens: 'strategic', text: 'Claim 2', about_entity: 'Company X', polarity: 'positive', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:0' } },
        { claim_id: 'c3', lens: 'risk', text: 'Claim 3', about_entity: 'Company X', polarity: 'negative', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:0' } },
        { claim_id: 'c4', lens: 'analytical', text: 'Claim 4', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:1' } },
        { claim_id: 'c5', lens: 'strategic', text: 'Claim 5', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:1' } },
        { claim_id: 'c6', lens: 'analytical', text: 'Claim 6', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:2' } },
        { claim_id: 'c7', lens: 'strategic', text: 'Claim 7', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:2' } },
        { claim_id: 'c8', lens: 'risk', text: 'Claim 8', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:risk:claim:1' } },
        { claim_id: 'c9', lens: 'analytical', text: 'Claim 9', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:analytical:claim:3' } },
        { claim_id: 'c10', lens: 'strategic', text: 'Claim 10', about_entity: 'Company X', polarity: 'neutral', category: 'factual', evidence_basis: null, provenance: { lens_raw_ref: 'lens:strategic:claim:3' } },
      ],
      evidence: {
        items: [],
        // Malformed: links is an object, not an array
        links: { invalid: 'not an array' },
      },
      engine_output: {
        synthesis: {
          confidence_score: 0.65,
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
      response_json: updatedResponse,
      status: 'completed',
      duration_ms: 1000,
    });

    // Should return 200 (not crash)
    const txtResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack.txt`,
    });

    expect(txtResponse.statusCode).toBe(200);
    const execSummary = txtResponse.body;
    
    // Must show 0/10 (treats malformed as 0 linked, not crash)
    expect(execSummary).toContain('Evidence: 0/10 claims linked (0%)');
    expect(execSummary).toContain('evidence not provided');
  });

  it('GET /v1/analyses/:id/demo-pack returns 409 when confidence_score is missing', async () => {
    // Create an analysis without confidence_score
    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M?',
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

    // Manually update the stored analysis to remove confidence_score
    const { saveAnalysis } = await import('../../src/api/storage.js');
    const updatedResponse = {
      ...createBody,
      engine_output: {
        synthesis: {
          // No confidence_score
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
      response_json: updatedResponse,
      status: 'dry_run',
      duration_ms: 1000,
    });

    // Fetch demo pack - should return 409
    const demoPackResponse = await server.inject({
      method: 'GET',
      url: `/v1/analyses/${analysisId}/demo-pack`,
    });

    expect(demoPackResponse.statusCode).toBe(409);
    const body = JSON.parse(demoPackResponse.body);
    expect(body.error.code).toBe('MISSING_SYNTHESIS_SCORE');
    expect(body.error.message).toContain('missing confidence_score');
  });
});
