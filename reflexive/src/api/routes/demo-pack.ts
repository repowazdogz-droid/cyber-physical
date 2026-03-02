import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../auth.js';
import { ApiError, ErrorCode } from '../errors.js';
import { loadAnalysis } from '../storage.js';
import { ENGINE_CONFIG } from '../../config.js';
import { generateExecSummary, generateRedlines, generateRedlinesText, extractConfidenceScore, extractModelSnapshot } from '../demo-pack-helpers.js';
import { composeArtifact } from '../../domain/artifact/artifact.composer.js';

interface GetDemoPackParams {
  Params: { analysis_id: string };
}

interface DemoPackResponse {
  analysis_id: string;
  created_at: string;
  schema_version: string;
  model_snapshot: {
    llm_model: string | null;
    embedding_model: string | null;
    run_id: string | null;
    created_at: string;
  };
  request: any;
  summary: {
    confidence_score: number | null;
    band: string;
    convergence_count: number;
    divergence_count: number;
    orphan_count: number;
  };
  exec_summary: string;
  redlines: Array<{
    type: 'convergence' | 'divergence' | 'orphan' | 'evidence_gap';
    theme?: string;
    claim_ids: string[];
    lenses?: string[];
    why_it_matters: string;
    converges?: Array<{ claim_id: string; lens: string; text: string }>;
    diverges?: Array<{ side: string; claim_ids: string[]; lenses: string[]; texts: string[] }>;
    missing_evidence?: Array<{ claim_id: string; text: string; suggested_evidence: string }>;
  }>;
  synthesis: any;
  artifacts: any;
  config_snapshot: any;
}

function getBand(score: number | null): string {
  if (score === null || score === undefined) return 'Unknown';
  if (score < ENGINE_CONFIG.BAND_LOW_MAX) return 'Low';
  if (score < ENGINE_CONFIG.BAND_MODERATE_MAX) return 'Moderate';
  if (score < ENGINE_CONFIG.BAND_HIGH_MAX) return 'High';
  return 'Very High';
}

export async function demoPackRoutes(fastify: FastifyInstance) {
  // GET /v1/analyses/:analysis_id/demo-pack
  fastify.get<GetDemoPackParams>(
    '/v1/analyses/:analysis_id/demo-pack',
    async (request: FastifyRequest<GetDemoPackParams>, reply: FastifyReply) => {
      try {
        requireAuth(request.headers.authorization);

        const { analysis_id } = request.params;
        const stored = await loadAnalysis(analysis_id);

        if (!stored) {
          return reply.code(404).send({
            error: {
              code: ErrorCode.NOT_FOUND,
              message: `Analysis ${analysis_id} not found`,
            },
          });
        }

        const response = stored.response_json;
        const synthesis = response.engine_output?.synthesis || {};
        
        // Build artifacts (reuse artifacts logic)
        const artifacts = {
          analysis_id,
          created_at: stored.created_at,
          config_snapshot: response.run_metadata?.engine_config_snapshot || {},
          lens_artifacts: (response.lens_results || []).map((lr: any) => ({
            lens: lr.lens,
            status: lr.status,
            raw_text: lr.raw_text,
            parsed: lr.parsed,
            claim_ids: lr.claim_ids || [],
            duration_ms: lr.duration_ms,
          })),
          claim_artifacts: (response.claims || []).map((c: any) => ({
            claim_id: c.claim_id,
            lens: c.lens,
            text: c.text,
            about_entity: c.about_entity,
            polarity: c.polarity,
            category: c.category,
            evidence_basis: c.evidence_basis,
            provenance: c.provenance,
          })),
          evidence_artifacts: response.evidence || {
            items: [],
            links: [],
          },
        };

        // Extract confidence with fallbacks (throws if missing)
        let confidenceScore: number;
        try {
          confidenceScore = extractConfidenceScore(response);
        } catch (err: any) {
          if (err instanceof ApiError && err.code === ErrorCode.MISSING_SYNTHESIS_SCORE) {
            return reply.code(409).send(err.toJSON());
          }
          throw err;
        }

        // Compute summary
        const convergencePoints = synthesis.convergence_points || [];
        const divergencePoints = synthesis.divergence_points || [];
        const orphanClaims = synthesis.orphan_claims || [];

        // Generate exec_summary and redlines
        const configSnapshot = response.run_metadata?.engine_config_snapshot || {};
        const modelSnapshot = extractModelSnapshot(response, stored.created_at);
        const execSummary = generateExecSummary(response, configSnapshot, stored.request_json, artifacts.evidence_artifacts, artifacts.claim_artifacts, modelSnapshot);
        const redlines = generateRedlines(synthesis, artifacts.claim_artifacts, artifacts.lens_artifacts, artifacts.evidence_artifacts);

        const demoPack: DemoPackResponse = {
          analysis_id,
          created_at: stored.created_at,
          schema_version: 'demo-pack@0.1.5',
          model_snapshot: modelSnapshot,
          request: stored.request_json,
          summary: {
            confidence_score: confidenceScore,
            band: getBand(confidenceScore),
            convergence_count: Array.isArray(convergencePoints) ? convergencePoints.length : 0,
            divergence_count: Array.isArray(divergencePoints) ? divergencePoints.length : 0,
            orphan_count: Array.isArray(orphanClaims) ? orphanClaims.length : 0,
          },
          exec_summary: execSummary,
          redlines,
          synthesis,
          artifacts,
          config_snapshot: configSnapshot,
        };

        return reply.code(200).send(demoPack);
      } catch (err: any) {
        if (err instanceof ApiError) {
          return reply.code(400).send(err.toJSON());
        }
        return reply.code(500).send({
          error: {
            code: ErrorCode.STORAGE_FAILURE,
            message: err.message || 'Internal server error',
          },
        });
      }
    }
  );

  // GET /v1/analyses/:analysis_id/demo-pack.txt
  fastify.get<GetDemoPackParams>(
    '/v1/analyses/:analysis_id/demo-pack.txt',
    async (request: FastifyRequest<GetDemoPackParams>, reply: FastifyReply) => {
      try {
        requireAuth(request.headers.authorization);

        const { analysis_id } = request.params;
        const stored = await loadAnalysis(analysis_id);

        if (!stored) {
          return reply.code(404).send({
            error: {
              code: ErrorCode.NOT_FOUND,
              message: `Analysis ${analysis_id} not found`,
            },
          });
        }

        const response = stored.response_json;
        const synthesis = response.engine_output?.synthesis || {};
        const configSnapshot = response.run_metadata?.engine_config_snapshot || {};
        
        // Build artifacts for evidence/claim access
        const artifacts = {
          evidence_artifacts: response.evidence || { items: [], links: [] },
          claim_artifacts: (response.claims || []).map((c: any) => ({
            claim_id: c.claim_id,
            lens: c.lens,
            text: c.text,
            about_entity: c.about_entity,
            polarity: c.polarity,
            category: c.category,
            evidence_basis: c.evidence_basis,
            provenance: c.provenance,
          })),
        };
        
        // Extract confidence (throws if missing)
        try {
          extractConfidenceScore(response);
        } catch (err: any) {
          if (err instanceof ApiError && err.code === ErrorCode.MISSING_SYNTHESIS_SCORE) {
            return reply.code(409).send(err.toJSON());
          }
          throw err;
        }
        
        const modelSnapshot = extractModelSnapshot(response, stored.created_at);
        const execSummary = generateExecSummary(response, configSnapshot, stored.request_json, artifacts.evidence_artifacts, artifacts.claim_artifacts, modelSnapshot);
        const redlines = generateRedlines(synthesis, artifacts.claim_artifacts, [], artifacts.evidence_artifacts);
        const redlinesText = generateRedlinesText(redlines);
        
        // Combine exec summary and redlines (max 25 lines total)
        const fullText = execSummary + '\n\n' + redlinesText;
        const lines = fullText.split('\n');
        const truncatedLines = lines.slice(0, 25);
        const finalText = truncatedLines.join('\n');

        return reply
          .code(200)
          .type('text/plain')
          .send(finalText);
      } catch (err: any) {
        if (err instanceof ApiError) {
          const statusCode = err.code === ErrorCode.MISSING_SYNTHESIS_SCORE ? 409 : 400;
          return reply.code(statusCode).send(err.toJSON());
        }
        return reply.code(500).send({
          error: {
            code: ErrorCode.STORAGE_FAILURE,
            message: err.message || 'Internal server error',
          },
        });
      }
    }
  );

  // GET /v1/analyses/:analysis_id/artifact
  fastify.get<GetDemoPackParams>(
    '/v1/analyses/:analysis_id/artifact',
    async (request: FastifyRequest<GetDemoPackParams>, reply: FastifyReply) => {
      // 1️⃣ Top-level try/catch wrapping ENTIRE handler body
      try {
        requireAuth(request.headers.authorization);

        const { analysis_id } = request.params;
        const stored = await loadAnalysis(analysis_id);

        if (!stored) {
          return reply.code(404).send({
            error: {
              code: ErrorCode.NOT_FOUND,
              message: `Analysis ${analysis_id} not found`,
            },
          });
        }

        const response = stored.response_json;
        const synthesis = response.engine_output?.synthesis || {};

        // 3️⃣ Runtime validation BEFORE composeArtifact
        if (!synthesis || typeof synthesis !== 'object') {
          throw new Error('Synthesis missing or invalid');
        }
        const claims = response.claims || [];
        if (!Array.isArray(claims) || claims.length === 0) {
          throw new Error('Claims missing or empty');
        }

        // Check if confidence_score exists
        let confidenceScore: number;
        try {
          confidenceScore = extractConfidenceScore(response);
        } catch (err: any) {
          if (err instanceof ApiError && err.code === ErrorCode.MISSING_SYNTHESIS_SCORE) {
            return reply.code(409).send({
              error: {
                code: ErrorCode.MISSING_SYNTHESIS_SCORE,
                message: 'Analysis incomplete; re-run required',
              },
            });
          }
          throw err;
        }

        // Build artifacts for composer
        const artifacts = {
          evidence_artifacts: response.evidence || {
            items: [],
            links: [],
          },
          claim_artifacts: (response.claims || []).map((c: any) => ({
            claim_id: c.claim_id,
            lens: c.lens,
            text: c.text,
            about_entity: c.about_entity,
            polarity: c.polarity,
            category: c.category,
            evidence_basis: c.evidence_basis,
            provenance: c.provenance,
          })),
        };

        // Compute summary
        const convergencePoints = synthesis.convergence_points || [];
        const divergencePoints = synthesis.divergence_points || [];
        const orphanClaims = synthesis.orphan_claims || [];

        // Generate exec_summary
        const configSnapshot = response.run_metadata?.engine_config_snapshot || {};
        const modelSnapshot = extractModelSnapshot(response, stored.created_at);
        const execSummary = generateExecSummary(
          response,
          configSnapshot,
          stored.request_json,
          artifacts.evidence_artifacts,
          artifacts.claim_artifacts,
          modelSnapshot
        );

        // Map claims to ExtractedClaim format
        const extractedClaims = artifacts.claim_artifacts.map((c: any) => ({
          id: c.claim_id,
          perspective_id: '',
          analysis_id: analysis_id,
          statement: c.text,
          category: c.category || 'factual',
          claim_kind: 'claim',
          confidence_weight: 0.5,
          evidence_basis: c.evidence_basis || null,
          evidence_status: 'supported',
          about_entity_candidate: c.about_entity || '',
          about_entity_canonical: c.about_entity || null,
          validity: 'strict',
          polarity: c.polarity || null,
          scoring_eligible: true,
          as_of: new Date().toISOString(),
          valid_from: null,
          valid_until: null,
          expires_at: null,
          stale_unsupported: false,
          repairs: [],
        }));

        // 1️⃣ Extract stimulus safely (check all possible paths)
        const stimulus =
          stored.request_json?.stimulus?.text ??
          stored.request_json?.inputs?.stimulus?.text ??
          stored.inputs?.stimulus?.text ??
          null;

        // 2️⃣ Create arrays from stored evidence (evidence is now populated upstream from evidence_basis)
        const evidenceItems = [...(response.evidence?.items ?? [])].map((e: any) => ({
          id: e.id,
          claim_id: e.claim_id || '',
          content_text: e.content_text || '',
          source_type: e.source_type || 'lens_inference',
          as_of: e.as_of || new Date().toISOString(),
          possibly_stale: e.possibly_stale || false,
        }));

        const evidenceLinks = [...(response.evidence?.links ?? [])].map((l: any) => ({
          claim_id: l.claim_id,
          evidence_item_id: l.evidence_item_id,
          support_type: l.support_type || 'supports',
        }));

        // NOTE: Stimulus injection removed - evidence is now populated upstream from evidence_basis

        // Build EngineOutput structure
        const engineOutput = {
          synthesis: {
            convergence_points: convergencePoints,
            divergence_points: divergencePoints,
            orphan_claims: orphanClaims,
            confidence_score: confidenceScore,
            confidence_breakdown: synthesis.confidence_breakdown || {
              agreement_factor: 0,
              evidence_density_factor: 0,
              unsupported_penalty: 0,
              divergence_penalty: 0,
              lens_count_factor: 1,
              raw_score: confidenceScore,
              final_score: confidenceScore,
              drift_flags: [],
              low_evidence_warning: false,
              high_contradiction_warning: false,
              per_lens: [],
              per_theme: [],
            },
            confidence_rationale: synthesis.confidence_rationale || '',
            computed_at: synthesis.computed_at || new Date().toISOString(),
          },
          claim_annotations: [],
          drift: null,
        };

        // 2️⃣ Second guard around composeArtifact
        let artifact;
        try {
          artifact = composeArtifact({
            engineOutput,
            claims: extractedClaims,
            evidenceItems,
            evidenceLinks,
            analysisId: analysis_id,
            createdAt: stored.created_at,
            modelSnapshot,
            execSummary,
            confidenceScore,
            band: getBand(confidenceScore),
            convergenceCount: Array.isArray(convergencePoints) ? convergencePoints.length : 0,
            divergenceCount: Array.isArray(divergencePoints) ? divergencePoints.length : 0,
            orphanCount: Array.isArray(orphanClaims) ? orphanClaims.length : 0,
            stimulusText: stimulus || undefined,
          });
        } catch (composeErr: any) {
          console.error('🚨 COMPOSER_CRASH', composeErr);
          console.error('🚨 COMPOSER_CRASH - Stack:', composeErr?.stack);
          console.error('🚨 COMPOSER_CRASH - Message:', composeErr?.message);
          throw composeErr;
        }

        // Add debug marker to verify UI is hitting this endpoint
        const artifactWithDebug = {
          ...artifact,
          __artifact_debug: 'NEW_ARTIFACT_PIPELINE_ACTIVE_v2',
        };
        return reply.code(200).send(artifactWithDebug);
      } catch (err: any) {
        // 1️⃣ Top-level catch - NO error escapes
        console.error('🚨 ARTIFACT_FATAL_CRASH');
        console.error('🚨 ARTIFACT_FATAL_CRASH - Error:', err);
        console.error('🚨 ARTIFACT_FATAL_CRASH - Stack:', err?.stack);
        console.error('🚨 ARTIFACT_FATAL_CRASH - Type:', typeof err);
        console.error('🚨 ARTIFACT_FATAL_CRASH - Constructor:', err?.constructor?.name);
        console.error('🚨 ARTIFACT_FATAL_CRASH - Message:', err?.message);
        
        if (err instanceof ApiError) {
          return reply.code(400).send(err.toJSON());
        }
        return reply.code(500).send({
          error: {
            code: 'artifact_fatal_crash',
            message: err instanceof Error ? err.message : 'Unknown artifact error',
          },
        });
      }
    }
  );
}
