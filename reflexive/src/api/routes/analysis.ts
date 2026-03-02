import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { requireAuth } from '../auth.js';
import { ApiError, ErrorCode } from '../errors.js';
import { saveAnalysis, loadAnalysis } from '../storage.js';
import { runAnalysisForApi, mapLensResults, mapClaims } from '../orchestrator.js';
import type { CreateAnalysisRequest, CreateAnalysisResponse } from '../types.js';
import { ENGINE_CONFIG } from '../../config.js';
import { LLM_MODEL, OLLAMA_EMBED_MODEL } from '../../config.js';

interface CreateAnalysisParams {
  Body: CreateAnalysisRequest;
}

interface GetAnalysisParams {
  Params: { analysis_id: string };
}

export async function analysisRoutes(fastify: FastifyInstance) {
  // GET /v1/analyses (list all)
  fastify.get(
    '/v1/analyses',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        requireAuth(request.headers.authorization);

        const { query } = await import('../../db/client.js');
        const result = await query(
          `SELECT 
            analysis_id, 
            created_at, 
            status, 
            duration_ms, 
            request_json,
            response_json,
            COALESCE(jsonb_array_length(response_json->'lens_results'), 0) as lens_count,
            request_json->'stimulus'->>'text' as stimulus_text,
            request_json->'stimulus'->>'type' as stimulus_type
           FROM api_analyses
           ORDER BY created_at DESC
           LIMIT 100`
        );

        const analyses = result.rows.map((row) => {
          const response = typeof row.response_json === 'string' 
            ? JSON.parse(row.response_json) 
            : row.response_json;
          const synthesis = response?.engine_output?.synthesis || {};
          
          return {
            analysis_id: row.analysis_id,
            created_at: new Date(row.created_at).toISOString(),
            confidence_score: synthesis?.confidence_score || null,
            convergence_count: Array.isArray(synthesis?.convergence_points) ? synthesis.convergence_points.length : 0,
            divergence_count: Array.isArray(synthesis?.divergence_points) ? synthesis.divergence_points.length : 0,
            orphan_count: Array.isArray(synthesis?.orphan_claims) ? synthesis.orphan_claims.length : 0,
            status: row.status,
            stimulus_text: row.stimulus_text || null,
            stimulus_type: row.stimulus_type || null,
            lens_count: parseInt(row.lens_count) || 0,
          };
        });

        return reply.code(200).send(analyses);
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

  // POST /v1/analyses
  fastify.post<CreateAnalysisParams>(
    '/v1/analyses',
    async (request: FastifyRequest<CreateAnalysisParams>, reply: FastifyReply) => {
      try {
        requireAuth(request.headers.authorization);

        const body = request.body;
        
        // Validate request
        if (!body.stimulus || !body.stimulus.text || !body.stimulus.type) {
          throw new ApiError(ErrorCode.INVALID_REQUEST, 'Missing required field: stimulus.text and stimulus.type');
        }

        if (body.stimulus.text.trim().length < 10) {
          throw new ApiError(ErrorCode.INSUFFICIENT_INPUT, 'Stimulus text must be at least 10 characters');
        }

        const analysisId = randomUUID();
        const startTime = Date.now();
        const createdAt = new Date().toISOString();

        // Dry run mode
        if (body.options?.dry_run) {
          const response: CreateAnalysisResponse = {
            analysis_id: analysisId,
            created_at: createdAt,
            inputs: body,
            run_metadata: {
              duration_ms: Date.now() - startTime,
              models: {
                lens_llm: LLM_MODEL,
                embedder: OLLAMA_EMBED_MODEL,
              },
              engine_config_snapshot: ENGINE_CONFIG,
            },
            lens_results: [],
            claims: [],
            evidence: {
              items: [],
              links: [],
            },
            warnings: ['Dry run mode - no analysis executed'],
          };

          if (body.options.save !== false) {
            await saveAnalysis({
              analysis_id: analysisId,
              created_at: createdAt,
              request_json: body,
              response_json: response,
              status: 'dry_run',
              duration_ms: response.run_metadata.duration_ms,
            });
          }

          return reply.code(200).send(response);
        }

        // Normal run
        try {
          const result = await runAnalysisForApi(body, analysisId);
          
          const lensResults = await mapLensResults(result.lensResults, result.claims);
          const claims = await mapClaims(result.claims, result.lensResults);

          // Validate traceability requirements
          const warnings: string[] = [...(result.warnings || [])];
          
          // Check lens raw_text presence
          for (const lensResult of lensResults) {
            if (lensResult.status === 'ok' && !lensResult.raw_text) {
              warnings.push(`Warning: lens ${lensResult.lens} marked ok but raw_text missing`);
            }
          }
          
          // Check claims provenance
          for (const claim of claims) {
            if (!claim.provenance?.lens_raw_ref) {
              warnings.push(`Warning: claim ${claim.claim_id} missing provenance.lens_raw_ref`);
            }
          }
          
          // Ensure evidence structure exists
          const evidence = result.engineOutput?.evidence || {
            items: [],
            links: [],
          };

          const response: CreateAnalysisResponse = {
            analysis_id: analysisId,
            created_at: createdAt,
            inputs: body,
            run_metadata: {
              duration_ms: Date.now() - startTime,
              models: {
                lens_llm: LLM_MODEL,
                embedder: OLLAMA_EMBED_MODEL,
              },
              engine_config_snapshot: ENGINE_CONFIG,
            },
            lens_results: lensResults,
            claims,
            evidence,
            engine_output: result.engineOutput,
            warnings,
          };

          if (body.options?.save !== false) {
            await saveAnalysis({
              analysis_id: analysisId,
              created_at: createdAt,
              request_json: body,
              response_json: response,
              status: 'completed',
              duration_ms: response.run_metadata.duration_ms,
            });
          }

          return reply.code(201).send(response);
        } catch (err: any) {
          if (err instanceof ApiError) {
            throw err;
          }
          throw new ApiError(ErrorCode.ENGINE_FAILURE, `Analysis failed: ${err.message}`, { original_error: err.message });
        }
      } catch (err: any) {
        if (err instanceof ApiError) {
          return reply.code(400).send(err.toJSON());
        }
        return reply.code(500).send({
          error: {
            code: ErrorCode.ENGINE_FAILURE,
            message: err.message || 'Internal server error',
          },
        });
      }
    }
  );

  // GET /v1/analyses/:analysis_id
  fastify.get<GetAnalysisParams>(
    '/v1/analyses/:analysis_id',
    async (request: FastifyRequest<GetAnalysisParams>, reply: FastifyReply) => {
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

        return reply.code(200).send(stored.response_json);
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
}
