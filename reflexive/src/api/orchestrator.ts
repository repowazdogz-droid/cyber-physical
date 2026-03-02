import { randomUUID } from 'crypto';
import { query, pool } from '../db/client.js';
import { getLenses } from '../db/queries.js';
import { invokeLenses } from '../lenses/orchestrator.js';
import { runAnalysis } from '../analysis/orchestrator.js';
import { getClaimEmbeddings } from '../db/queries.js';
import { ENGINE_CONFIG } from '../config.js';
import { LLM_MODEL, OLLAMA_EMBED_MODEL } from '../config.js';
import type { CreateAnalysisRequest, CreateAnalysisResponse, LensResult, ClaimWithProvenance } from './types.js';
import type { LensInvocationResult } from '../lenses/orchestrator.js';
import type { ExtractedClaim } from '../extraction/types.js';
import { ApiError, ErrorCode } from './errors.js';

export interface AnalysisRunResult {
  lensResults: LensInvocationResult[];
  claims: ExtractedClaim[];
  engineOutput: any;
  warnings: string[];
}

export async function runAnalysisForApi(
  request: CreateAnalysisRequest,
  analysisId: string
): Promise<AnalysisRunResult> {
  console.log('[ENGINE] Starting analysis', { analysisId, stimulus: request.stimulus.text.substring(0, 50) });
  const client = await pool.connect();
  const warnings: string[] = [];

  try {
    // Map stimulus type to DB enum
    const stimulusTypeMap: Record<string, string> = {
      'decision': 'decision_request',
      'question': 'research_question',
      'scenario': 'problem_statement',
      'assessment_request': 'assessment_request',
    };
    const dbStimulusType = stimulusTypeMap[request.stimulus.type] || 'decision_request';

    // Ensure stimulus_text column exists
    await query(
      `ALTER TABLE cases ADD COLUMN IF NOT EXISTS stimulus_text TEXT`,
      []
    ).catch(() => {});

    // Create case
    const caseId = randomUUID();
    await query(
      `INSERT INTO cases (id, title, stimulus_content, stimulus_type, stimulus_text, state, created_at)
       VALUES ($1, $2, $3, $4::stimulus_type, $3, 'active', NOW())`,
      [caseId, `API Analysis ${analysisId.substring(0, 8)}`, request.stimulus.text, dbStimulusType]
    );

    // Create analysis
    await query(
      `INSERT INTO analyses (id, case_id, sequence_number, state, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [analysisId, caseId, 1, 'pending']
    );

    // Get lenses (filter if specified)
    let lenses = await getLenses(true);
    console.log('[ENGINE] Loaded lenses', { count: lenses.length, names: lenses.map(l => l.name) });
    if (request.options?.lenses && request.options.lenses.length > 0) {
      lenses = lenses.filter(l => request.options!.lenses!.includes(l.name));
      if (lenses.length === 0) {
        throw new ApiError(ErrorCode.INVALID_REQUEST, 'No matching lenses found');
      }
    }

    // Invoke lenses
    const contextItems = (request.context?.documents || []).map(doc => ({
      label: doc.title || doc.doc_id,
      content_text: doc.excerpt || '',
    }));

    const analysisDate = new Date().toISOString();
    console.log('[ENGINE] Invoking lenses', { count: lenses.length, analysisId });
    const lensInvocationResults = await invokeLenses(
      lenses,
      analysisId,
      request.stimulus.text,
      request.stimulus.type,
      contextItems,
      analysisDate
    );
    console.log('[ENGINE] Lens invocation complete', { 
      results: lensInvocationResults.length,
      completed: lensInvocationResults.filter(r => r.state === 'completed').length,
      failed: lensInvocationResults.filter(r => r.state === 'failed').length
    });

    // Run analysis
    console.log('[ENGINE] Running analysis pipeline', { caseId, analysisId });
    await runAnalysis(caseId, analysisId);
    console.log('[ENGINE] Analysis pipeline complete');

    // Load claims - join through perspectives since claims doesn't have analysis_id
    console.log('[ENGINE] Loading claims', { analysisId });
    const claimsResult = await query(
      `SELECT c.*, p.analysis_id 
       FROM claims c
       JOIN perspectives p ON c.perspective_id = p.id
       WHERE p.analysis_id = $1 
       ORDER BY c.created_at`,
      [analysisId]
    );
    console.log('[ENGINE] Claims loaded', { count: claimsResult.rows.length });
    const claims: ExtractedClaim[] = claimsResult.rows.map(row => ({
      id: row.id,
      perspective_id: row.perspective_id,
      analysis_id: row.analysis_id, // Now comes from the join
      statement: row.content, // Schema uses 'content' not 'statement'
      category: row.category,
      claim_kind: row.claim_kind || 'claim',
      confidence_weight: parseFloat(row.confidence_weight) || 0,
      evidence_basis: null, // Not in schema - always null
      evidence_status: row.evidence_status,
      about_entity_candidate: row.about_entity_candidate || '',
      about_entity_canonical: row.about_entity_canonical || null,
      validity: row.validity || 'strict',
      polarity: row.polarity || null,
      scoring_eligible: row.scoring_eligible !== undefined ? row.scoring_eligible : true,
      as_of: row.as_of ? new Date(row.as_of).toISOString() : new Date().toISOString(),
      valid_from: row.valid_from ? new Date(row.valid_from).toISOString() : null,
      valid_until: row.valid_until ? new Date(row.valid_until).toISOString() : null,
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      stale_unsupported: row.stale_unsupported !== undefined ? row.stale_unsupported : (row.possibly_stale || false),
      repairs: [], // Not in schema - always empty array
    }));

    // Load synthesis - syntheses table has analysis_id, so this query is correct
    console.log('[ENGINE] Loading synthesis', { analysisId });
    const synthesisResult = await query(
      `SELECT s.* FROM syntheses s WHERE s.analysis_id = $1`,
      [analysisId]
    );
    console.log('[ENGINE] Synthesis loaded', { found: synthesisResult.rows.length > 0 });

    let engineOutput: any = null;
    if (synthesisResult.rows.length > 0) {
      const synth = synthesisResult.rows[0];
      // confidence_breakdown is on analyses table, not syntheses - get it separately if needed
      const breakdown = synth.confidence_breakdown || null;
      const convergence = typeof synth.convergence_points === 'string'
        ? JSON.parse(synth.convergence_points) : synth.convergence_points;
      const divergence = typeof synth.divergence_points === 'string'
        ? JSON.parse(synth.divergence_points) : synth.divergence_points;
      const orphans = typeof synth.orphan_claims === 'string'
        ? JSON.parse(synth.orphan_claims) : (synth.orphan_claims || []);

      engineOutput = {
        synthesis: {
          confidence_score: synth.confidence_score,
          confidence_breakdown: breakdown,
          convergence_points: convergence || [],
          divergence_points: divergence || [],
          orphan_claims: orphans || [],
        },
      };
    }

    console.log('[ENGINE] Analysis complete', {
      lensResults: lensInvocationResults.length,
      claims: claims.length,
      hasEngineOutput: !!engineOutput,
      warnings: warnings.length
    });

    return {
      lensResults: lensInvocationResults,
      claims,
      engineOutput,
      warnings,
    };
  } catch (error) {
    console.error('[ENGINE] Analysis failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    throw error;
  } finally {
    client.release();
  }
}

export async function mapLensResults(
  lensInvocationResults: LensInvocationResult[],
  claims: ExtractedClaim[]
): Promise<LensResult[]> {
  const claimsByPerspective = new Map<string, ExtractedClaim[]>();
  for (const claim of claims) {
    if (!claimsByPerspective.has(claim.perspective_id)) {
      claimsByPerspective.set(claim.perspective_id, []);
    }
    claimsByPerspective.get(claim.perspective_id)!.push(claim);
  }

  // Get lens names
  const lenses = await getLenses(true);
  const lensNameMap = new Map(lenses.map(l => [l.id, l.name]));

  return lensInvocationResults.map((result, index) => {
    const claimIds = claimsByPerspective.get(result.perspective_id)?.map(c => c.id) || [];
    const lensName = lensNameMap.get(result.lens_id) || result.lens_id;
    const isOk = result.state === 'completed';
    
    // Ensure raw_text is present for ok lenses
    const rawText = result.raw_response || (isOk ? '' : undefined);
    
    return {
      lens: lensName,
      status: isOk ? 'ok' : 'error',
      error: result.error ? {
        code: ErrorCode.LENS_FAILURE,
        message: result.error,
      } : undefined,
      raw_text: rawText,
      claim_ids: claimIds,
      duration_ms: result.latency_ms,
    };
  });
}

export async function mapClaims(
  claims: ExtractedClaim[],
  lensInvocationResults: LensInvocationResult[]
): Promise<ClaimWithProvenance[]> {
  // Get lens names for stable refs
  const lenses = await getLenses(true);
  const lensNameMap = new Map(lenses.map(l => [l.id, l.name]));
  
  // Map perspective_id -> lens_name for stable refs
  const perspectiveToLensName = new Map<string, string>();
  for (const result of lensInvocationResults) {
    const lensName = lensNameMap.get(result.lens_id) || result.lens_id;
    perspectiveToLensName.set(result.perspective_id, lensName);
  }
  
  return claims.map((claim, index) => {
    const lensName = perspectiveToLensName.get(claim.perspective_id) || 'unknown';
    // Create stable ref: lens:<name>:claim:<index>
    const lensRawRef = `lens:${lensName}:claim:${index}`;
    
    return {
      claim_id: claim.id,
      lens: lensName,
      text: claim.statement,
      about_entity: claim.about_entity_canonical || claim.about_entity_candidate || null,
      polarity: claim.polarity || undefined,
      category: claim.category,
      evidence_basis: claim.evidence_basis,
      provenance: {
        lens_raw_ref: lensRawRef,
      },
    };
  });
}
