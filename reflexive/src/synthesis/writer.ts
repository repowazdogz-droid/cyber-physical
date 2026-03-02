import { pool } from '../db/client.js';
import { randomUUID } from 'crypto';
import type { EngineOutput, ClaimAnnotation } from './types.js';

/**
 * Write synthesis to database in a single transaction.
 * Phase 6.1
 */
export async function writeSynthesis(
  analysis_id: string,
  engine_output: EngineOutput,
  claim_annotations: ClaimAnnotation[]
): Promise<void> {
  console.log('[WRITE_SYNTHESIS] Starting', { 
    analysis_id, 
    claim_annotations_count: claim_annotations.length,
    confidence_score: engine_output.synthesis.confidence_score 
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('[WRITE_SYNTHESIS] Transaction begun');

    // 1. Update claim rows with engine annotations
    for (const ann of claim_annotations) {
      await client.query(
        `UPDATE claims SET
          about_entity_canonical = $1,
          validity = $2,
          polarity = $3,
          scoring_eligible = $4,
          expires_at = $5,
          stale_unsupported = $6
        WHERE id = $7`,
        [
          ann.about_entity_canonical,
          ann.validity,
          ann.polarity,
          ann.scoring_eligible,
          ann.expires_at,
          ann.stale_unsupported,
          ann.claim_id
        ]
      );
    }

    // 2. Insert synthesis row
    await client.query(
      `INSERT INTO syntheses (
        id, analysis_id,
        convergence_points, divergence_points, orphan_claims,
        confidence_score, confidence_rationale, confidence_breakdown,
        summary, drift_report, computed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        randomUUID(),
        analysis_id,
        JSON.stringify(engine_output.synthesis.convergence_points),
        JSON.stringify(engine_output.synthesis.divergence_points),
        JSON.stringify(engine_output.synthesis.orphan_claims),
        engine_output.synthesis.confidence_score,
        engine_output.synthesis.confidence_rationale,
        JSON.stringify(engine_output.synthesis.confidence_breakdown),
        null, // summary — LLM-generated later if desired
        engine_output.drift ? JSON.stringify(engine_output.drift) : null,
        engine_output.synthesis.computed_at
      ]
    );

    // 3. Update analysis row
    await client.query(
      `UPDATE analyses SET
        state = 'completed',
        confidence_score = $1,
        confidence_breakdown = $2,
        completed_at = NOW()
      WHERE id = $3`,
      [
        engine_output.synthesis.confidence_score,
        JSON.stringify(engine_output.synthesis.confidence_breakdown),
        analysis_id
      ]
    );

    await client.query('COMMIT');
    console.log('[WRITE_SYNTHESIS] Transaction committed successfully');
  } catch (err: any) {
    console.error('[WRITE_SYNTHESIS] Transaction failed', {
      error: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      analysis_id
    });
    await client.query('ROLLBACK').catch(rollbackErr => {
      console.error('[WRITE_SYNTHESIS] Rollback also failed', { error: rollbackErr.message });
    });
    throw err;
  } finally {
    client.release();
  }
}
