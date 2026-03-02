import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../auth.js';
import { ApiError, ErrorCode } from '../errors.js';
import { loadAnalysis } from '../storage.js';

interface GetArtifactsParams {
  Params: { analysis_id: string };
}

interface ArtifactsResponse {
  analysis_id: string;
  created_at: string;
  config_snapshot: any;
  lens_artifacts: Array<{
    lens: string;
    status: 'ok' | 'error';
    raw_text?: string;
    parsed?: any;
    claim_ids: string[];
    duration_ms: number;
  }>;
  claim_artifacts: Array<{
    claim_id: string;
    lens: string;
    text: string;
    about_entity?: string | null;
    polarity?: string;
    category?: string;
    evidence_basis?: any;
    provenance: { lens_raw_ref: string };
  }>;
  evidence_artifacts: {
    items: any[];
    links: any[];
  };
}

export async function artifactsRoutes(fastify: FastifyInstance) {
  // GET /v1/analyses/:analysis_id/artifacts
  fastify.get<GetArtifactsParams>(
    '/v1/analyses/:analysis_id/artifacts',
    async (request: FastifyRequest<GetArtifactsParams>, reply: FastifyReply) => {
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
        
        // Derive artifacts from stored response
        const artifacts: ArtifactsResponse = {
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

        return reply.code(200).send(artifacts);
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
