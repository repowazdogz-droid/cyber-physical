import { query } from '../db/client.js';
import type { CreateAnalysisRequest, CreateAnalysisResponse } from './types.js';

export interface StoredAnalysis {
  analysis_id: string;
  created_at: string;
  request_json: CreateAnalysisRequest;
  response_json: CreateAnalysisResponse;
  status: 'completed' | 'failed' | 'dry_run';
  duration_ms: number;
}

export async function saveAnalysis(analysis: StoredAnalysis): Promise<void> {
  await query(
    `INSERT INTO api_analyses (analysis_id, created_at, request_json, response_json, status, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (analysis_id) DO UPDATE SET
       request_json = EXCLUDED.request_json,
       response_json = EXCLUDED.response_json,
       status = EXCLUDED.status,
       duration_ms = EXCLUDED.duration_ms`,
    [
      analysis.analysis_id,
      analysis.created_at,
      JSON.stringify(analysis.request_json),
      JSON.stringify(analysis.response_json),
      analysis.status,
      analysis.duration_ms,
    ]
  );
}

export async function loadAnalysis(analysis_id: string): Promise<StoredAnalysis | null> {
  const result = await query(
    `SELECT analysis_id, created_at, request_json, response_json, status, duration_ms
     FROM api_analyses
     WHERE analysis_id = $1`,
    [analysis_id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    analysis_id: row.analysis_id,
    created_at: new Date(row.created_at).toISOString(),
    request_json: typeof row.request_json === 'string' ? JSON.parse(row.request_json) : row.request_json,
    response_json: typeof row.response_json === 'string' ? JSON.parse(row.response_json) : row.response_json,
    status: row.status,
    duration_ms: row.duration_ms,
  };
}
