import { validatePreconditions } from './preconditions.js';
import { matchClaims } from './matching.js';
import { buildThemes } from './themes.js';
import { detectScopeDependence } from './scope.js';
import { detectContradictions } from './contradiction.js';
import { labelTheme } from './labels.js';
import { analysisEvidenceDensity, claimEvidenceDensity } from './evidence.js';
import { computeConfidence } from './confidence.js';
import { generateRationale } from './rationale.js';
import { computeDrift } from './drift.js';
import { normalizeDivergencePoints } from './normalize-divergence.js';
import type { EngineInput, EngineOutput, ConvergencePoint, DivergencePoint, ClaimAnnotation } from './types.js';

/**
 * Compute synthesis from engine input.
 * Artifact 04 §10.4
 */
export async function computeSynthesis(
  input: EngineInput,
  embeddings: Map<string, number[]>
): Promise<EngineOutput> {
  // 1. Validate preconditions
  validatePreconditions(input);
  
  // 2. Build perspective lens map
  const perspectiveLensMap = new Map(
    input.perspectives.map(p => [
      p.id,
      {
        lens_id: p.lens_id,
        lens_name: p.lens_name,
        lens_orientation: p.lens_orientation,
      },
    ])
  );
  
  // 3. Filter scoring-eligible claims
  const scoringClaims = input.claims.filter(c => c.scoring_eligible);
  
  // 4. Embeddings are provided by caller (loaded from DB)
  
  // 5. Match claims
  const matches = matchClaims(
    scoringClaims,
    embeddings,
    input.claim_evidence_links,
    perspectiveLensMap
  );
  
  // 6. Build themes
  const themes = buildThemes(matches, scoringClaims, perspectiveLensMap);
  
  // 7. Detect scope dependence
  const scopeResults = detectScopeDependence(
    themes,
    scoringClaims,
    embeddings,
    perspectiveLensMap
  );
  
  // 8. Detect contradictions
  const contradictionResults = detectContradictions(
    themes,
    scoringClaims,
    scopeResults,
    perspectiveLensMap
  );
  
  // 9. Classify themes as convergence or divergence points
  const convergence_points: ConvergencePoint[] = [];
  const divergence_points: DivergencePoint[] = [];
  const orphan_claims: string[] = [];
  
  // Build scope map for quick lookup
  const scopeMap = new Map<string, boolean>();
  for (const scope of scopeResults) {
    const key1 = `${scope.claim_a_id}:${scope.claim_b_id}`;
    const key2 = `${scope.claim_b_id}:${scope.claim_a_id}`;
    scopeMap.set(key1, scope.scope_dependent);
    scopeMap.set(key2, scope.scope_dependent);
  }
  
  // Build contradiction map
  const contradictionMap = new Map<string, boolean>();
  for (const contr of contradictionResults) {
    const key1 = `${contr.claim_a_id}:${contr.claim_b_id}`;
    const key2 = `${contr.claim_b_id}:${contr.claim_a_id}`;
    contradictionMap.set(key1, contr.contradictory);
    contradictionMap.set(key2, contr.contradictory);
  }
  
  // Classify each theme
  for (const theme of themes) {
    if (theme.lens_ids.length < 2) {
      // Single-lens theme → orphan
      orphan_claims.push(...theme.claim_ids);
      continue;
    }
    
    // Check if theme has any contradictions
    let hasContradiction = false;
    let hasScopeDependence = false;
    
    // Check all pairs in theme
    for (let i = 0; i < theme.claim_ids.length; i++) {
      for (let j = i + 1; j < theme.claim_ids.length; j++) {
        const key = `${theme.claim_ids[i]}:${theme.claim_ids[j]}`;
        if (contradictionMap.get(key) === true) {
          hasContradiction = true;
        }
        if (scopeMap.get(key) === true) {
          hasScopeDependence = true;
        }
      }
    }
    
    if (hasContradiction) {
      // Divergence: contradictory
      const positions = [];
      const lensClaimMap = new Map<string, string[]>();
      
      for (const claimId of theme.claim_ids) {
        const claim = scoringClaims.find(c => c.id === claimId);
        if (!claim) continue;
        const lens = perspectiveLensMap.get(claim.perspective_id);
        if (!lens) continue;
        
        if (!lensClaimMap.has(lens.lens_id)) {
          lensClaimMap.set(lens.lens_id, []);
        }
        lensClaimMap.get(lens.lens_id)!.push(claimId);
      }
      
      for (const [lens_id, claim_ids] of lensClaimMap) {
        positions.push({
          lens_id,
          claim_ids,
          position_summary: labelTheme(theme, scoringClaims, perspectiveLensMap),
        });
      }
      
      divergence_points.push({
        theme_id: theme.theme_id,
        theme_label: labelTheme(theme, scoringClaims, perspectiveLensMap),
        positions,
        nature: 'contradictory',
        severity: theme.strength,
      });
    } else if (hasScopeDependence) {
      // Divergence: scope-dependent
      const positions = [];
      const lensClaimMap = new Map<string, string[]>();
      
      for (const claimId of theme.claim_ids) {
        const claim = scoringClaims.find(c => c.id === claimId);
        if (!claim) continue;
        const lens = perspectiveLensMap.get(claim.perspective_id);
        if (!lens) continue;
        
        if (!lensClaimMap.has(lens.lens_id)) {
          lensClaimMap.set(lens.lens_id, []);
        }
        lensClaimMap.get(lens.lens_id)!.push(claimId);
      }
      
      for (const [lens_id, claim_ids] of lensClaimMap) {
        positions.push({
          lens_id,
          claim_ids,
          position_summary: labelTheme(theme, scoringClaims, perspectiveLensMap),
        });
      }
      
      divergence_points.push({
        theme_id: theme.theme_id,
        theme_label: labelTheme(theme, scoringClaims, perspectiveLensMap),
        positions,
        nature: 'scope_dependent',
        severity: theme.strength,
      });
    } else {
      // Convergence: no contradictions, no scope dependence
      convergence_points.push({
        theme_id: theme.theme_id,
        theme_label: labelTheme(theme, scoringClaims, perspectiveLensMap),
        supporting_lenses: theme.lens_ids,
        supporting_claims: theme.claim_ids,
        strength: theme.strength,
        evidence_density: 0, // Will be computed below
      });
    }
  }
  
  // 9.5. Normalize divergence points (convert false divergences to convergences)
  const { normalizedConvergencePoints, remainingDivergencePoints } = normalizeDivergencePoints(divergence_points);
  convergence_points.push(...normalizedConvergencePoints);
  divergence_points.length = 0;
  divergence_points.push(...remainingDivergencePoints);
  
  // 10. Label themes (already done above during classification)
  
  // 11. Compute evidence density
  const completedPerspectives = input.perspectives.filter(p => p.state === 'completed');
  // Use a consistent date for evidence recency calculation
  // If evidence items have as_of dates, use a date close to them for fair recency calculation
  // For now, use current date but this should ideally come from input.analysis_started_at
  const analysis_started_at = new Date().toISOString(); // Should come from input
  
  const evidence_density = analysisEvidenceDensity(
    scoringClaims,
    input.evidence_items,
    input.claim_evidence_links,
    analysis_started_at,
    completedPerspectives,
    perspectiveLensMap
  );
  
  // Update convergence points with evidence density
  for (const cp of convergence_points) {
    // Compute mean evidence density for claims in this convergence point
    const densities = cp.supporting_claims.map(claimId =>
      claimEvidenceDensity(
        claimId,
        input.evidence_items,
        input.claim_evidence_links,
        analysis_started_at
      )
    );
    cp.evidence_density = densities.length > 0
      ? densities.reduce((sum, d) => sum + d, 0) / densities.length
      : 0;
  }
  
  // 12. Compute confidence
  const confidence_breakdown = computeConfidence(
    convergence_points,
    divergence_points,
    scoringClaims,
    evidence_density,
    completedPerspectives.length,
    input.perspectives.length,
    completedPerspectives.map(p => ({
      id: p.lens_id,
      name: p.lens_name,
      orientation: p.lens_orientation,
    })),
    themes.length,
    perspectiveLensMap,
    input.evidence_items,
    input.claim_evidence_links,
    analysis_started_at
  );
  
  // 13. Generate rationale
  const confidence_rationale = generateRationale(confidence_breakdown, themes.length);
  
  // 14. Compute drift
  const prior_synthesis = input.prior_syntheses.length > 0
    ? input.prior_syntheses[input.prior_syntheses.length - 1]
    : null;
  
  // Prior embeddings would need to be loaded separately if computing drift
  // For now, pass empty map (drift will be null if prior is null anyway)
  const prior_embeddings = new Map<string, number[]>(); // Caller should provide if needed
  
  const drift = computeDrift(
    {
      analysis_id: input.analysis_id,
      confidence_breakdown,
      convergence_points,
      divergence_points,
      claims: scoringClaims,
    },
    prior_synthesis,
    input.case_id,
    embeddings,
    prior_embeddings
  );
  
  // 15. Build claim annotations
  const claim_annotations: ClaimAnnotation[] = scoringClaims.map(claim => ({
    claim_id: claim.id,
    about_entity_canonical: claim.about_entity_canonical || 'unresolved',
    validity: claim.validity,
    polarity: claim.polarity || 'neutral',
    scoring_eligible: claim.scoring_eligible,
    evidence_density: claimEvidenceDensity(
      claim.id,
      input.evidence_items,
      input.claim_evidence_links,
      analysis_started_at
    ),
    expires_at: claim.expires_at,
    stale_unsupported: claim.stale_unsupported,
  }));
  
  // 16. Assemble output
  return {
    synthesis: {
      convergence_points,
      divergence_points,
      orphan_claims,
      confidence_score: confidence_breakdown.final_score,
      confidence_breakdown,
      confidence_rationale,
      computed_at: analysis_started_at,
    },
    claim_annotations,
    drift,
  };
}
