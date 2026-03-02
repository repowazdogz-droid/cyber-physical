/**
 * Artifact Adapter
 * Converts DemoPackResponse → ComposerInput → InstitutionalArtifact
 */

import type { DemoPackResponse } from '../api'
import type { InstitutionalArtifact } from '../artifact-domain/artifact.types'
import { composeArtifact, type ComposerInput } from '../artifact-domain/artifact.composer'

export function adaptDemoPackToArtifact(demoPack: DemoPackResponse): InstitutionalArtifact | null {
  // Check if synthesis exists and has confidence_score
  const synthesis = demoPack.synthesis
  if (!synthesis || synthesis.confidence_score === null || synthesis.confidence_score === undefined) {
    return null
  }

  // Extract data from demo-pack
  const artifacts = demoPack.artifacts || {}
  const claims = artifacts.claim_artifacts || []
  
  // Map claim artifacts to ExtractedClaim format
  const extractedClaims = claims.map((c: any) => ({
    id: c.claim_id,
    perspective_id: '', // Not in demo-pack
    analysis_id: demoPack.analysis_id,
    statement: c.text,
    category: c.category || 'factual',
    claim_kind: 'claim',
    confidence_weight: 0.5, // Default
    evidence_basis: c.evidence_basis || null,
    evidence_status: 'supported', // Assume supported if in demo-pack
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
  }))

  // Extract evidence from demoPack.evidence (top-level) or fallback to artifacts.evidence_artifacts
  // NOTE: Evidence is now populated upstream from evidence_basis, so no stimulus injection needed
  const evidence = (demoPack as any).evidence || artifacts.evidence_artifacts || {}
  const evidenceItems = evidence.items || []
  const evidenceLinks = evidence.links || []

  // Map evidence items
  const mappedEvidenceItems = evidenceItems.map((e: any) => ({
    id: e.id,
    claim_id: e.claim_id,
    content_text: e.content_text || '',
    source_type: e.source_type || 'lens_inference',
    as_of: e.as_of || new Date().toISOString(),
    possibly_stale: e.possibly_stale || false,
  }))

  // Map evidence links
  const mappedEvidenceLinks = evidenceLinks.map((l: any) => ({
    claim_id: l.claim_id,
    evidence_item_id: l.evidence_item_id,
    support_type: l.support_type || 'supports',
  }))

  // Wrap synthesis in EngineOutput structure
  const engineOutput = {
    synthesis: {
      convergence_points: synthesis.convergence_points || [],
      divergence_points: synthesis.divergence_points || [],
      orphan_claims: synthesis.orphan_claims || [],
      confidence_score: synthesis.confidence_score,
      confidence_breakdown: synthesis.confidence_breakdown || {
        agreement_factor: 0,
        evidence_density_factor: 0,
        unsupported_penalty: 0,
        divergence_penalty: 0,
        lens_count_factor: 1,
        raw_score: synthesis.confidence_score,
        final_score: synthesis.confidence_score,
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
  }

  // Build composer input
  const input: ComposerInput = {
    engineOutput,
    claims: extractedClaims,
    evidenceItems: mappedEvidenceItems,
    evidenceLinks: mappedEvidenceLinks,
    analysisId: demoPack.analysis_id,
    createdAt: demoPack.created_at,
    modelSnapshot: demoPack.model_snapshot,
    execSummary: demoPack.exec_summary,
    confidenceScore: demoPack.summary.confidence_score!,
    band: demoPack.summary.band,
    convergenceCount: demoPack.summary.convergence_count,
    divergenceCount: demoPack.summary.divergence_count,
    orphanCount: demoPack.summary.orphan_count,
  }

  return composeArtifact(input)
}
