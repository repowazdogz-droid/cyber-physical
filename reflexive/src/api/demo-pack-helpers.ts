import { ENGINE_CONFIG } from '../config.js';
import { ApiError, ErrorCode } from './errors.js';

export interface Redline {
  type: 'convergence' | 'divergence' | 'orphan' | 'evidence_gap';
  theme?: string;
  claim_ids: string[];
  lenses?: string[];
  why_it_matters: string;
  converges?: Array<{ claim_id: string; lens: string; text: string }>;
  diverges?: Array<{ side: string; claim_ids: string[]; lenses: string[]; texts: string[] }>;
  missing_evidence?: Array<{ claim_id: string; text: string; suggested_evidence: string }>;
}

function getBand(score: number | null): string {
  if (score === null || score === undefined) return 'Unknown';
  if (score < ENGINE_CONFIG.BAND_LOW_MAX) return 'Low';
  if (score < ENGINE_CONFIG.BAND_MODERATE_MAX) return 'Moderate';
  if (score < ENGINE_CONFIG.BAND_HIGH_MAX) return 'High';
  return 'Very High';
}

/**
 * Extract confidence_score from stored analysis with fallback precedence:
 * 1. response_json.engine_output.synthesis.confidence_score
 * 2. response_json.engine_output.confidence_score
 * 3. response_json.engine_output.synthesis (if it's a number directly)
 * 4. response_json.engine_output (if it's a number directly)
 */
export function extractConfidenceScore(responseJson: any): number {
  // Try synthesis.confidence_score first
  if (responseJson?.engine_output?.synthesis?.confidence_score != null) {
    const score = responseJson.engine_output.synthesis.confidence_score;
    if (typeof score === 'number') return score;
  }
  
  // Try engine_output.confidence_score
  if (responseJson?.engine_output?.confidence_score != null) {
    const score = responseJson.engine_output.confidence_score;
    if (typeof score === 'number') return score;
  }
  
  // Try synthesis itself if it's a number (edge case)
  if (typeof responseJson?.engine_output?.synthesis === 'number') {
    return responseJson.engine_output.synthesis;
  }
  
  // Try engine_output itself if it's a number (edge case)
  if (typeof responseJson?.engine_output === 'number') {
    return responseJson.engine_output;
  }
  
  throw new ApiError(
    ErrorCode.MISSING_SYNTHESIS_SCORE,
    'Stored analysis is missing confidence_score; cannot generate exec_summary.'
  );
}

/**
 * Count claims with evidence links from stored evidence artifacts.
 * 
 * CRITICAL INVARIANT: Denominator MUST be claimArtifacts.length (all extracted claims),
 * NOT convergence-only, non-orphan, scoring_eligible, or redline claims.
 * 
 * Fail-safe: Handles missing/malformed evidence schema gracefully (returns 0 linked).
 */
export function countLinkedClaims(
  evidenceArtifacts: any,
  claimArtifacts: any[]
): { linkedClaims: number; totalClaims: number } {
  // Denominator: ALL extracted claims (audit-grade invariant)
  const totalClaims = claimArtifacts.length;
  
  // Fail-safe: Guard against missing or malformed evidence schema
  if (!evidenceArtifacts || !evidenceArtifacts.links) {
    return { linkedClaims: 0, totalClaims };
  }
  
  // Fail-safe: Guard against non-array links (object/string/null/etc)
  if (!Array.isArray(evidenceArtifacts.links)) {
    return { linkedClaims: 0, totalClaims };
  }
  
  // Count unique claim_ids (duplicate-guard: Set deduplicates)
  const linkedClaimIds = new Set<string>();
  for (const link of evidenceArtifacts.links) {
    // Fail-safe: Guard against invalid link structure
    if (link && typeof link.claim_id === 'string' && link.claim_id.length > 0) {
      linkedClaimIds.add(link.claim_id);
    }
  }
  
  return { linkedClaims: linkedClaimIds.size, totalClaims };
}

/**
 * Extract model snapshot from stored analysis run_metadata (deterministic, no env reads)
 */
export function extractModelSnapshot(responseJson: any, createdAt: string): {
  llm_model: string | null;
  embedding_model: string | null;
  run_id: string | null;
  created_at: string;
} {
  const runMetadata = responseJson?.run_metadata || {};
  const models = runMetadata?.models || {};
  
  return {
    llm_model: runMetadata?.llm_model || runMetadata?.model || models?.lens_llm || models?.llm || null,
    embedding_model: runMetadata?.embedding_model || models?.embedder || models?.embedding || null,
    run_id: runMetadata?.run_id || null,
    created_at: createdAt,
  };
}

export function generateExecSummary(
  responseJson: any,
  configSnapshot: any,
  request: any,
  evidenceArtifacts?: any,
  claimArtifacts?: any[],
  modelSnapshot?: { llm_model: string | null; embedding_model: string | null; run_id: string | null; created_at: string }
): string {
  // Extract confidence with fallbacks
  const confidenceScore = extractConfidenceScore(responseJson);
  const band = getBand(confidenceScore);
  
  // Extract synthesis data
  const synthesis = responseJson?.engine_output?.synthesis || {};
  const convergencePoints = synthesis?.convergence_points || [];
  const divergencePoints = synthesis?.divergence_points || [];
  const orphanClaims = synthesis?.orphan_claims || [];
  
  const convergenceCount = Array.isArray(convergencePoints) ? convergencePoints.length : 0;
  const divergenceCount = Array.isArray(divergencePoints) ? divergencePoints.length : 0;
  const orphanCount = Array.isArray(orphanClaims) ? orphanClaims.length : 0;

  // Count evidence-linked claims (denominator = ALL extracted claims)
  const claims = claimArtifacts || responseJson?.claims || [];
  const evidence = evidenceArtifacts || responseJson?.evidence;
  const { linkedClaims, totalClaims } = countLinkedClaims(evidence, claims);
  const evidenceRate = totalClaims === 0 ? 0 : linkedClaims / totalClaims;
  const evidencePct = Math.round(evidenceRate * 100);

  const lines: string[] = [];

  // Header
  lines.push('REFLEXIVE Analysis Summary');
  lines.push('─'.repeat(40));
  lines.push('');

  // Required lines (in exact order)
  lines.push(`Confidence: ${confidenceScore.toFixed(4)} (${band} band)`);
  lines.push(`Counts: Convergence=${convergenceCount} Divergence=${divergenceCount} Orphans=${orphanCount}`);
  
  // Evidence line (always present, even if no evidence object)
  const hasEvidenceLinks = evidence && evidence.links && Array.isArray(evidence.links) && evidence.links.length > 0;
  if (hasEvidenceLinks) {
    lines.push(`Evidence: ${linkedClaims}/${totalClaims} claims linked (${evidencePct}%)`);
  } else {
    lines.push(`Evidence: 0/${totalClaims} claims linked (0%) — evidence not provided`);
  }
  lines.push('');

  // Schema and model snapshot lines
  const schemaVersion = 'demo-pack@0.1.5';
  lines.push(`Schema: ${schemaVersion}`);
  
  if (modelSnapshot) {
    const llmModel = modelSnapshot.llm_model || 'unknown';
    const embedModel = modelSnapshot.embedding_model || 'unknown';
    const runId = modelSnapshot.run_id || 'unknown';
    lines.push(`Models: llm=${llmModel} embed=${embedModel} run_id=${runId}`);
  } else {
    lines.push('Models: llm=unknown embed=unknown run_id=unknown');
  }
  lines.push('');

  // Top convergences
  lines.push('Key Agreements:');
  const topConvergences = Array.isArray(convergencePoints) ? convergencePoints.slice(0, 3) : [];
  if (topConvergences.length > 0) {
    for (const cp of topConvergences) {
      const theme = cp.theme_label || cp.theme || 'Convergence theme';
      lines.push(`  • ${theme}`);
    }
  } else {
    lines.push('  • None');
  }
  lines.push('');

  // Top divergence
  lines.push('Key Disagreements:');
  const topDivergence = Array.isArray(divergencePoints) ? divergencePoints[0] : null;
  if (topDivergence) {
    const theme = topDivergence.theme_label || topDivergence.theme || 'Divergence point';
    lines.push(`  • ${theme}`);
  } else {
    lines.push('  • None');
  }
  lines.push('');

  // Interpretation line (only if evidence_rate < 0.25)
  if (evidenceRate < 0.25) {
    lines.push('Interpretation: Conservative — low evidence inflates penalties');
    lines.push('');
  }

  // Config snapshot
  const configLine = `Config: SIM_MATCH=${configSnapshot?.SIM_MATCH ?? ENGINE_CONFIG.SIM_MATCH} SIM_REJECT=${configSnapshot?.SIM_REJECT ?? ENGINE_CONFIG.SIM_REJECT} W_a=${configSnapshot?.W_a ?? ENGINE_CONFIG.W_a} W_e=${configSnapshot?.W_e ?? ENGINE_CONFIG.W_e} W_u=${configSnapshot?.W_u ?? ENGINE_CONFIG.W_u} W_d=${configSnapshot?.W_d ?? ENGINE_CONFIG.W_d}`;
  lines.push(configLine);

  return lines.join('\n');
}

/**
 * Check if a claim has evidence links (fail-safe: handles malformed schema)
 */
function hasEvidenceLink(claimId: string, evidenceLinks: any[]): boolean {
  if (!evidenceLinks || !Array.isArray(evidenceLinks)) return false;
  return evidenceLinks.some((link: any) => 
    link && typeof link.claim_id === 'string' && link.claim_id === claimId
  );
}

export function generateRedlines(
  synthesis: any,
  claimArtifacts: any[],
  lensArtifacts: any[],
  evidenceArtifacts?: any
): Redline[] {
  const redlines: Redline[] = [];
  const convergencePoints = synthesis?.convergence_points || [];
  const divergencePoints = synthesis?.divergence_points || [];
  const orphanClaims = synthesis?.orphan_claims || [];

  // Create claim lookup
  const claimMap = new Map(claimArtifacts.map((c: any) => [c.claim_id, c]));
  
  // Get evidence links
  const evidenceLinks = evidenceArtifacts?.links || [];

  // Process convergences
  for (const cp of convergencePoints) {
    const supportingClaims = cp.supporting_claims || [];
    const supportingLenses = cp.supporting_lenses || [];
    const theme = cp.theme_label || cp.theme || 'Convergence theme';

    if (supportingClaims.length > 0) {
      const converges = supportingClaims.slice(0, 3).map((claimId: string) => {
        const claim = claimMap.get(claimId);
        return {
          claim_id: claimId,
          lens: claim?.lens || 'unknown',
          text: claim?.text || `Claim ${claimId.substring(0, 8)}`,
        };
      });

      redlines.push({
        type: 'convergence',
        theme,
        claim_ids: supportingClaims,
        lenses: supportingLenses,
        why_it_matters: `Multiple lenses agree on this point, indicating high confidence.`,
        converges,
        diverges: [],
        missing_evidence: [],
      });
    }
  }

  // Process divergences
  for (const dp of divergencePoints) {
    const positions = dp.positions || [];
    const theme = dp.theme_label || dp.theme || 'Divergence point';
    const allClaimIds: string[] = [];
    const allLenses = new Set<string>();

    const diverges = positions.map((pos: any, idx: number) => {
      const claimIds = pos.claim_ids || [];
      allClaimIds.push(...claimIds);
      const lenses = new Set<string>();
      const texts: string[] = [];

      for (const claimId of claimIds) {
        const claim = claimMap.get(claimId);
        if (claim) {
          lenses.add(claim.lens);
          allLenses.add(claim.lens);
          texts.push(claim.text);
        }
      }

      return {
        side: pos.position_summary || `Position ${idx + 1}`,
        claim_ids: claimIds,
        lenses: Array.from(lenses),
        texts: texts.slice(0, 3), // Limit to 3 texts per side
      };
    });

    if (diverges.length > 0) {
      redlines.push({
        type: 'divergence',
        theme,
        claim_ids: allClaimIds,
        lenses: Array.from(allLenses),
        why_it_matters: `Different lenses present conflicting views. Requires deeper investigation.`,
        converges: [],
        diverges,
        missing_evidence: [],
      });
    }
  }

  // Process evidence gaps: orphan claims first, then convergence/divergence claims without evidence
  const evidenceGapClaimIds: string[] = [];
  
  // Add orphan claims
  const topOrphans = Array.isArray(orphanClaims) ? orphanClaims.slice(0, 5) : [];
  evidenceGapClaimIds.push(...topOrphans);
  
  // Add convergence/divergence claims without evidence (up to 5 total)
  for (const cp of convergencePoints) {
    if (evidenceGapClaimIds.length >= 5) break;
    for (const claimId of cp.supporting_claims || []) {
      if (evidenceGapClaimIds.length >= 5) break;
      if (!hasEvidenceLink(claimId, evidenceLinks) && !evidenceGapClaimIds.includes(claimId)) {
        evidenceGapClaimIds.push(claimId);
      }
    }
  }
  
  for (const dp of divergencePoints) {
    if (evidenceGapClaimIds.length >= 5) break;
    for (const pos of dp.positions || []) {
      if (evidenceGapClaimIds.length >= 5) break;
      for (const claimId of pos.claim_ids || []) {
        if (evidenceGapClaimIds.length >= 5) break;
        if (!hasEvidenceLink(claimId, evidenceLinks) && !evidenceGapClaimIds.includes(claimId)) {
          evidenceGapClaimIds.push(claimId);
        }
      }
    }
  }

  if (evidenceGapClaimIds.length > 0) {
    const missingEvidence = evidenceGapClaimIds.map((claimId: string) => {
      const claim = claimMap.get(claimId);
      const text = claim?.text || `Claim ${claimId.substring(0, 8)}`;
      const entity = claim?.about_entity || 'the subject';
      
      return {
        claim_id: claimId,
        text,
        suggested_evidence: `Verify "${text}" through independent sources or data about ${entity}.`,
      };
    });

    redlines.push({
      type: 'evidence_gap',
      theme: 'Evidence Gaps',
      claim_ids: evidenceGapClaimIds,
      why_it_matters: `These claims lack supporting evidence and reduce overall confidence.`,
      converges: [],
      diverges: [],
      missing_evidence: missingEvidence,
    });
  }

  return redlines;
}

/**
 * Generate REDLINES section for TXT output (max 8 bullets, max 25 lines total)
 */
export function generateRedlinesText(redlines: Redline[]): string {
  const lines: string[] = [];
  lines.push('REDLINES');
  lines.push('─'.repeat(40));
  lines.push('');

  let bulletCount = 0;
  const maxBullets = 8;
  const maxTotalLines = 25;

  for (const redline of redlines) {
    if (bulletCount >= maxBullets || lines.length >= maxTotalLines - 1) break;

    if (redline.type === 'convergence') {
      const claimIdsStr = redline.claim_ids.slice(0, 3).join(',');
      const more = redline.claim_ids.length > 3 ? '...' : '';
      lines.push(`• [CONVERGENCE] ${redline.theme || 'Unlabeled'} (claims: ${claimIdsStr}${more})`);
      bulletCount++;
    } else if (redline.type === 'divergence') {
      const claimIdsStr = redline.claim_ids.slice(0, 3).join(',');
      const more = redline.claim_ids.length > 3 ? '...' : '';
      lines.push(`• [DIVERGENCE] ${redline.theme || 'Unlabeled'} (claims: ${claimIdsStr}${more})`);
      bulletCount++;
    } else if (redline.type === 'evidence_gap') {
      for (const claimId of redline.claim_ids.slice(0, 3)) {
        if (bulletCount >= maxBullets || lines.length >= maxTotalLines - 1) break;
        lines.push(`• [EVIDENCE GAP] claim ${claimId} has no linked evidence`);
        bulletCount++;
      }
    }
  }

  return lines.join('\n');
}
