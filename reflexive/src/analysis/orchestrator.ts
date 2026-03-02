import { query, pool } from '../db/client.js';
import { getLenses, createAnalysis, createPerspective, updatePerspectiveState } from '../db/queries.js';
import { insertClaims, getClaimEmbeddings, insertEvidenceItems, insertEvidenceLinks } from '../db/queries.js';
import { parseAssessment } from '../extraction/parser.js';
import { canonicalizeClaims } from '../extraction/canonicalizer.js';
import { classifyPolarity } from '../extraction/polarity.js';
import { ensureEmbeddings } from '../embeddings/service.js';
import { bootstrapEvidence } from '../extraction/evidence-bootstrapper.js';
import { extractEvidenceFromClaims } from '../extraction/evidence-extractor.js';
import { computeSynthesis } from '../engine/index.js';
import { writeSynthesis } from '../synthesis/writer.js';
import type { EngineInput } from '../engine/types.js';
import type { ExtractedClaim } from '../extraction/types.js';
import { ENGINE_CONFIG } from '../config.js';

/**
 * Map application-level source_type to database enum.
 */
function mapSourceTypeToDb(appType: string): 'document' | 'measurement' | 'citation' | 'testimony' | 'observation' {
  if (appType === 'stimulus_quote' || appType === 'context_excerpt' || appType === 'user_upload' || appType === 'url') {
    return 'document';
  }
  if (appType === 'numeric_data' || appType === 'measurement') {
    return 'measurement';
  }
  if (appType === 'external_citation' || appType === 'citation') {
    return 'citation';
  }
  if (appType === 'lens_inference' || appType === 'stimulus_derived') {
    return 'observation';
  }
  return 'observation';
}

/**
 * Run complete analysis pipeline.
 * Phase 6.2 - Top-level orchestrator
 */
export async function runAnalysis(case_id: string, analysis_id: string): Promise<void> {
  const client = await pool.connect();
  try {
    // Race condition guard: lock case
    await client.query('SELECT id FROM cases WHERE id = $1 FOR UPDATE', [case_id]);
    
    // 1. Load case from DB
    const caseResult = await client.query(
      'SELECT stimulus_text, stimulus_type FROM cases WHERE id = $1',
      [case_id]
    );
    if (caseResult.rows.length === 0) {
      throw new Error(`Case ${case_id} not found`);
    }
    const caseData = caseResult.rows[0];
    const stimulus_text = caseData.stimulus_text;
    const stimulus_type = caseData.stimulus_type;
    
    // 2. Load context snapshot (context_items table doesn't exist in schema, use empty array)
    const contextResult = await client.query(
      `SELECT id, label, content_text FROM context_items WHERE case_id = $1 ORDER BY created_at`,
      [case_id]
    ).catch(() => ({ rows: [] })); // Return empty if table doesn't exist
    const context_snapshot = contextResult.rows.map(row => ({
      id: row.id,
      label: row.label,
      content_text: row.content_text,
    }));
    
    // 3. Load active lenses
    const lenses = await getLenses(true);
    
    // 4. Update Analysis row to 'running'
    await client.query(
      'UPDATE analyses SET state = $1, started_at = NOW() WHERE id = $2',
      ['running', analysis_id]
    );
    
    // 5. Create Perspective rows with 'pending' state (or load existing if already created)
    // Check if perspectives already exist (e.g., if invokeLenses() was called before runAnalysis())
    const existingPerspectivesResult = await client.query(
      'SELECT id, lens_id, state FROM perspectives WHERE analysis_id = $1',
      [analysis_id]
    );
    
    let perspectives: Array<{
      id: string;
      lens_id: string;
      lens_name: string;
      lens_orientation: 'convergent' | 'divergent' | 'orthogonal';
      lens_version: number;
      state: string;
    }> = [];
    
    if (existingPerspectivesResult.rows.length > 0) {
      // Perspectives already exist - load them from DB with their actual states
      const lensMap = new Map(lenses.map(l => [l.id, l]));
      for (const row of existingPerspectivesResult.rows) {
        const lens = lensMap.get(row.lens_id);
        if (lens) {
          perspectives.push({
            id: row.id,
            lens_id: row.lens_id,
            lens_name: lens.name,
            lens_orientation: lens.orientation,
            lens_version: lens.version,
            state: row.state,
          });
        }
      }
    } else {
      // No perspectives exist - create them
      for (const lens of lenses) {
        const perspective = await createPerspective(
          analysis_id,
          lens.id,
          lens.version.toString()
        );
        perspectives.push({
          id: perspective.id,
          lens_id: lens.id,
          lens_name: lens.name,
          lens_orientation: lens.orientation,
          lens_version: lens.version,
          state: 'pending',
        });
      }
    }
    
    // 6. Invoke lenses via orchestrator (Phase 2)
    // NOTE: If invokeLenses() was already called (e.g., by live-run-st001.ts),
    // perspectives will have been updated in DB. We re-read them above to get current state.
    // If lenses haven't been invoked yet, this is where they would be invoked.
    
    // 7. Re-read perspectives from DB to get their actual current state
    // (in case they were updated by invokeLenses() after our initial load)
    const currentPerspectivesResult = await client.query(
      'SELECT id, lens_id, state FROM perspectives WHERE analysis_id = $1',
      [analysis_id]
    );
    const lensMap = new Map(lenses.map(l => [l.id, l]));
    perspectives = currentPerspectivesResult.rows.map(row => {
      const lens = lensMap.get(row.lens_id);
      if (!lens) {
        throw new Error(`Lens ${row.lens_id} not found in active lenses`);
      }
      return {
        id: row.id,
        lens_id: row.lens_id,
        lens_name: lens.name,
        lens_orientation: lens.orientation,
        lens_version: lens.version,
        state: row.state,
      };
    });
    
    // 8. Process each completed perspective
    console.log('[ANALYSIS] Processing perspectives', { total: perspectives.length, analysis_id });
    const allClaims: ExtractedClaim[] = [];
    const analysis_started_at = new Date().toISOString();
    
    // Build lens name map for evidence extraction (perspective_id -> lens_name)
    const lensNameMap = new Map<string, string>();
    for (const perspective of perspectives) {
      lensNameMap.set(perspective.id, perspective.lens_name);
    }
    
    for (const perspective of perspectives) {
      // Check if perspective completed (in real implementation, this comes from Phase 2)
      // For now, skip if not completed
      if (perspective.state !== 'completed') {
        console.log('[ANALYSIS] Skipping perspective', { lens: perspective.lens_name, state: perspective.state });
        continue;
      }
      console.log('[ANALYSIS] Processing completed perspective', { lens: perspective.lens_name, perspective_id: perspective.id });
      
      // Load raw output from perspective
      const perspectiveResult = await client.query(
        'SELECT raw_output FROM perspectives WHERE id = $1',
        [perspective.id]
      );
      if (perspectiveResult.rows.length === 0) {
        // No raw_output found - mark as failed and skip
        await updatePerspectiveState(perspective.id, 'failed');
        continue;
      }
      
      const raw_output = perspectiveResult.rows[0].raw_output;
      if (!raw_output || (typeof raw_output === 'string' && raw_output.trim() === '')) {
        // Empty raw_output - mark as failed and skip
        await updatePerspectiveState(perspective.id, 'failed');
        continue;
      }
      
      // Extract the actual raw string from the stored format
      // raw_output is stored as {"raw": "..."} by updatePerspectiveState
      let raw_response: string;
      if (typeof raw_output === 'string') {
        // Try to parse it as JSON first
        try {
          const parsed = JSON.parse(raw_output);
          if (parsed && typeof parsed === 'object' && 'raw' in parsed && typeof parsed.raw === 'string') {
            raw_response = parsed.raw;
          } else {
            raw_response = raw_output;
          }
        } catch {
          raw_response = raw_output;
        }
      } else if (raw_output && typeof raw_output === 'object' && 'raw' in raw_output && typeof raw_output.raw === 'string') {
        raw_response = raw_output.raw;
      } else {
        raw_response = JSON.stringify(raw_output);
      }
      
      // a. Parse assessment
      console.log('[ANALYSIS] Parsing assessment', { lens: perspective.lens_name, raw_length: raw_response.length });
      const parseResult = parseAssessment(
        raw_response,
        perspective.id,
        analysis_id,
        analysis_started_at
      );
      
      if (!parseResult.success) {
        console.error('[ANALYSIS] Parse failed', { lens: perspective.lens_name, error: parseResult.error });
        await updatePerspectiveState(perspective.id, 'failed');
        continue;
      }
      
      console.log('[ANALYSIS] Claims extracted', { lens: perspective.lens_name, count: parseResult.claims.length });
      // b-d. Claims are already extracted, validated, canonicalized, polarity-classified by parser
      // But we need to canonicalize ALL claims together for cross-claim matching
      // So collect all claims first, then canonicalize together
      allClaims.push(...parseResult.claims);
    }
    
    console.log('[ANALYSIS] Total claims collected', { count: allClaims.length });
    
    // Canonicalize all claims together (cross-claim matching)
    canonicalizeClaims(allClaims, stimulus_text);
    
    // Classify polarity for all claims
    for (const claim of allClaims) {
      const polarityResult = classifyPolarity(claim.statement);
      claim.polarity = polarityResult.polarity;
    }
    
    // Extract evidence items and links from claims' evidence_basis
    console.log('[ANALYSIS] Extracting evidence from claims', { count: allClaims.length });
    const { evidenceItems: extractedItems, evidenceLinks } = extractEvidenceFromClaims(
      allClaims,
      analysis_started_at,
      lensNameMap,
      stimulus_text
    );
    
    // Map application-level source_type to database enum and insert evidence items
    if (extractedItems.length > 0) {
      console.log('[ANALYSIS] Inserting evidence items', { count: extractedItems.length });
      const dbEvidenceItems = extractedItems.map(item => ({
        id: item.id,
        content_text: item.content_text,
        source_type: mapSourceTypeToDb(item.source_type) as 'document' | 'measurement' | 'citation' | 'testimony' | 'observation',
        source: item.source,
        as_of: item.as_of,
        created_at: item.created_at,
      }));
      await insertEvidenceItems(dbEvidenceItems);
    }
    if (evidenceLinks.length > 0) {
      console.log('[ANALYSIS] Inserting evidence links', { count: evidenceLinks.length });
      await insertEvidenceLinks(evidenceLinks);
    }
    
    // Build existingEvidenceMap from newly created evidence links
    const existingEvidenceMap = new Map<string, string[]>();
    for (const link of evidenceLinks) {
      if (!existingEvidenceMap.has(link.claim_id)) {
        existingEvidenceMap.set(link.claim_id, []);
      }
      existingEvidenceMap.get(link.claim_id)!.push(link.evidence_item_id);
    }
    
    // Insert all claims into DB
    console.log('[ANALYSIS] Inserting claims', { count: allClaims.length });
    await insertClaims(allClaims, case_id);
    
    // Compute and store embeddings
    console.log('[ANALYSIS] Computing embeddings', { count: allClaims.length });
    await ensureEmbeddings(allClaims);
    
    // Evidence Bootstrapping v0: create synthetic evidence for claims with evidence_basis but no linked evidence
    // (Only for claims that didn't get evidence items from evidence_basis extraction)
    const syntheticEvidence = bootstrapEvidence(allClaims, analysis_started_at, existingEvidenceMap);

    // Update claims: mark claims with synthetic evidence as 'supported' instead of 'unsupported'
    for (const se of syntheticEvidence) {
      const claim = allClaims.find(c => c.id === se.claim_id);
      if (claim) {
        claim.evidence_status = 'supported';
      }
    }

    // Update evidence_status in DB for bootstrapped claims
    for (const se of syntheticEvidence) {
      await client.query(
        'UPDATE claims SET evidence_status = $1 WHERE id = $2',
        ['supported', se.claim_id]
      );
    }
    
    // 9. Re-read perspectives from DB to get final state (after any failed parsing)
    const finalPerspectivesResult = await client.query(
      'SELECT id, lens_id, state FROM perspectives WHERE analysis_id = $1',
      [analysis_id]
    );
    const finalLensMap = new Map(lenses.map(l => [l.id, l]));
    const finalPerspectives = finalPerspectivesResult.rows.map(row => {
      const lens = finalLensMap.get(row.lens_id);
      if (!lens) {
        throw new Error(`Lens ${row.lens_id} not found in active lenses`);
      }
      return {
        id: row.id,
        lens_id: row.lens_id,
        lens_name: lens.name,
        lens_orientation: lens.orientation,
        lens_version: lens.version,
        state: row.state,
      };
    });
    
    // 10. Check: >= 3 completed perspectives with >= 1 scoring-eligible claim?
    const completedPerspectives = finalPerspectives.filter(p => p.state === 'completed');
    const scoringClaims = allClaims.filter(c => c.scoring_eligible);
    
    console.log('[ANALYSIS] Pre-synthesis check', {
      completed_perspectives: completedPerspectives.length,
      min_required: ENGINE_CONFIG.MIN_LENS_COUNT,
      scoring_claims: scoringClaims.length,
      total_claims: allClaims.length
    });
    
    if (completedPerspectives.length < ENGINE_CONFIG.MIN_LENS_COUNT || scoringClaims.length === 0) {
      console.error('[ANALYSIS] Analysis failed pre-synthesis check', {
        reason: completedPerspectives.length < ENGINE_CONFIG.MIN_LENS_COUNT ? 'insufficient_perspectives' : 'no_scoring_claims'
      });
      await client.query(
        'UPDATE analyses SET state = $1 WHERE id = $2',
        ['failed', analysis_id]
      );
      return;
    }
    
    // 11. Load all data needed for EngineInput
    // Load embeddings
    const claimIds = allClaims.map(c => c.id);
    const embeddings = await getClaimEmbeddings(claimIds);
    
    // Build evidence items from synthetic evidence
    const evidence_items: EngineInput['evidence_items'] = syntheticEvidence.map(se => ({
      id: se.id,
      claim_id: se.claim_id,
      content_text: se.content_text,
      source_type: se.source_type,
      as_of: se.as_of,
      possibly_stale: se.possibly_stale,
    }));

    // Build claim-evidence links from synthetic evidence
    const claim_evidence_links: EngineInput['claim_evidence_links'] = syntheticEvidence.map(se => ({
      claim_id: se.claim_id,
      evidence_item_id: se.id,
      support_type: se.support_type,
    }));
    
    // Load prior syntheses (join through analyses to get case_id)
    const priorSynthesesResult = await client.query(
      `SELECT s.analysis_id, s.confidence_score, s.confidence_breakdown,
              s.convergence_points, s.divergence_points, s.orphan_claims, s.computed_at
       FROM syntheses s
       JOIN analyses a ON s.analysis_id = a.id
       WHERE a.case_id = $1 AND s.analysis_id != $2
       ORDER BY s.computed_at DESC
       LIMIT 1`,
      [case_id, analysis_id]
    );
    const prior_syntheses = priorSynthesesResult.rows.map(row => ({
      analysis_id: row.analysis_id,
      confidence_score: row.confidence_score,
      confidence_breakdown: JSON.parse(row.confidence_breakdown),
      convergence_points: JSON.parse(row.convergence_points),
      divergence_points: JSON.parse(row.divergence_points),
      orphan_claims: JSON.parse(row.orphan_claims),
      computed_at: row.computed_at,
    }));
    
    // 12. Build EngineInput
    const engineInput: EngineInput = {
      analysis_id,
      case_id,
      stimulus: {
        text: stimulus_text,
        type: stimulus_type,
      },
      context_snapshot,
      perspectives: completedPerspectives.map(p => ({
        id: p.id,
        lens_id: p.lens_id,
        lens_name: p.lens_name,
        lens_orientation: p.lens_orientation,
        lens_version: p.lens_version,
        state: 'completed' as const,
      })),
      claims: allClaims,
      evidence_items,
      claim_evidence_links,
      prior_syntheses,
    };
    
    // 13. Call computeSynthesis
    console.log('[ANALYSIS] Computing synthesis', { claims: allClaims.length, evidence_items: evidence_items.length });
    const engineOutput = await computeSynthesis(engineInput, embeddings);
    console.log('[ANALYSIS] Synthesis computed', { 
      confidence_score: engineOutput.synthesis.confidence_score,
      convergence_count: engineOutput.synthesis.convergence_points.length,
      divergence_count: engineOutput.synthesis.divergence_points.length
    });
    
    // 14. Call writeSynthesis
    console.log('[ANALYSIS] Writing synthesis', { analysis_id });
    try {
      await writeSynthesis(analysis_id, engineOutput, engineOutput.claim_annotations);
      console.log('[ANALYSIS] Synthesis written successfully');
    } catch (writeErr: any) {
      console.error('[ANALYSIS] writeSynthesis failed', {
        error: writeErr.message,
        stack: writeErr.stack,
        analysis_id,
        confidence_score: engineOutput.synthesis.confidence_score
      });
      throw writeErr;
    }
    console.log('[ANALYSIS] Analysis complete', { analysis_id });
    
  } catch (err) {
    // Error handling: mark analysis as failed
    console.error('[ANALYSIS] Analysis pipeline error', { 
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      analysis_id
    });
    await client.query(
      'UPDATE analyses SET state = $1 WHERE id = $2',
      ['failed', analysis_id]
    ).catch(() => {}); // Ignore errors during error handling
    
    throw err;
  } finally {
    client.release();
  }
}
