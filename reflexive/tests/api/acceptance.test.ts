import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildServer } from '../../src/api/server.js';
import type { CreateAnalysisRequest } from '../../src/api/types.js';
import * as orchestrator from '../../src/api/orchestrator.js';

describe('API Acceptance Test', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('POST /v1/analyses returns complete traceability shape', async () => {
    // Mock the orchestrator to return deterministic results
    const mockLensResults = [
      {
        lens_id: 'lens-1',
        lens_version: 1,
        state: 'completed' as const,
        raw_response: 'Mock raw lens output text',
        rendered_prompt: '',
        content_hash: 'hash1',
        model_id: 'gpt-4o',
        model_params: {},
        token_usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        latency_ms: 1500,
        attempts: 1,
        error: null,
        perspective_id: 'perspective-1',
      },
    ];

    const mockClaims = [
      {
        id: 'claim-1',
        perspective_id: 'perspective-1',
        analysis_id: 'analysis-1',
        statement: 'Test claim statement',
        category: 'factual' as const,
        claim_kind: 'claim' as const,
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'supported' as const,
        about_entity_candidate: 'Entity1',
        about_entity_canonical: 'Entity1',
        validity: 'strict' as const,
        polarity: 'neutral' as const,
        scoring_eligible: true,
        as_of: new Date().toISOString(),
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
    ];

    vi.spyOn(orchestrator, 'runAnalysisForApi').mockResolvedValue({
      lensResults: mockLensResults,
      claims: mockClaims,
      engineOutput: {
        synthesis: {
          confidence_score: 0.5,
          convergence_points: [],
          divergence_points: [],
          orphan_claims: [],
        },
      },
      warnings: [],
    });

    vi.spyOn(orchestrator, 'mapLensResults').mockResolvedValue([
      {
        lens: 'analytical',
        status: 'ok',
        raw_text: 'Mock raw lens output text',
        claim_ids: ['claim-1'],
        duration_ms: 1500,
      },
    ]);

    vi.spyOn(orchestrator, 'mapClaims').mockResolvedValue([
      {
        claim_id: 'claim-1',
        lens: 'analytical',
        text: 'Test claim statement',
        about_entity: 'Entity1',
        polarity: 'neutral',
        category: 'factual',
        provenance: {
          lens_raw_ref: 'lens:analytical:claim:0',
        },
      },
    ]);

    const request: CreateAnalysisRequest = {
      stimulus: {
        text: 'Should we acquire Company X for $500M? They have $200M annual revenue.',
        type: 'decision',
      },
    };

    const response = await server.inject({
      method: 'POST',
      url: '/v1/analyses',
      payload: request,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);

    // Assert all required traceability fields exist
    expect(body.analysis_id).toBeDefined();
    expect(body.created_at).toBeDefined();
    expect(body.run_metadata.engine_config_snapshot).toBeDefined();
    expect(body.run_metadata.engine_config_snapshot.W_a).toBeDefined();
    
    // Assert lens raw_text present for ok lenses
    expect(body.lens_results.length).toBeGreaterThan(0);
    for (const lensResult of body.lens_results) {
      if (lensResult.status === 'ok') {
        expect(lensResult.raw_text).toBeDefined();
        expect(typeof lensResult.raw_text).toBe('string');
      }
    }
    
    // Assert every claim has provenance.lens_raw_ref
    expect(body.claims.length).toBeGreaterThan(0);
    for (const claim of body.claims) {
      expect(claim.provenance).toBeDefined();
      expect(claim.provenance.lens_raw_ref).toBeDefined();
      expect(typeof claim.provenance.lens_raw_ref).toBe('string');
      // Verify provenance matches a lens artifact
      const matchingLens = body.lens_results.find((lr: any) => lr.lens === claim.lens);
      expect(matchingLens).toBeDefined();
    }
    
    // Assert evidence object exists
    expect(body.evidence).toBeDefined();
    expect(body.evidence.items).toBeDefined();
    expect(body.evidence.links).toBeDefined();
    expect(Array.isArray(body.evidence.items)).toBe(true);
    expect(Array.isArray(body.evidence.links)).toBe(true);
  });
});
