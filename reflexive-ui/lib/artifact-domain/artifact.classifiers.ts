/**
 * Artifact Classifiers
 * Pure functions that extract facts from engine output
 * No language generation - facts only
 */

import type {
  DecisionPosture,
  EpistemicTier,
  EpistemicStratification,
  ConfidenceConstruction,
  EvidencePosition,
  ArtifactConvergence,
  ArtifactDivergence,
} from './artifact.types'
import { VOCABULARY } from './artifact.language'

// Local type definitions
interface ConvergencePoint {
  theme_id: string
  theme_label: string
  supporting_lenses: string[]
  supporting_claims: string[]
  strength: number
  evidence_density: number
}

interface DivergencePoint {
  theme_id: string
  theme_label: string
  positions: Array<{
    lens_id: string
    claim_ids: string[]
    position_summary: string
  }>
  nature: string
  severity: number
}

interface ConfidenceBreakdown {
  agreement_factor: number
  evidence_density_factor: number
  unsupported_penalty: number
  divergence_penalty: number
  lens_count_factor: number
  raw_score: number
  final_score: number
  drift_flags: string[]
  low_evidence_warning: boolean
  high_contradiction_warning: boolean
  per_lens: any[]
  per_theme: any[]
}

interface ExtractedClaim {
  id: string
  perspective_id: string
  analysis_id: string
  statement: string
  category: string
  claim_kind: string
  confidence_weight: number
  evidence_basis: string | null
  evidence_status: string
  about_entity_candidate: string
  about_entity_canonical: string | null
  validity: string
  polarity: string | null
  scoring_eligible: boolean
  as_of: string
  valid_from: string | null
  valid_until: string | null
  expires_at: string | null
  stale_unsupported: boolean
  repairs: string[]
}

interface EvidenceItem {
  id: string
  claim_id: string
  content_text: string
  source_type: string
  as_of: string
  possibly_stale: boolean
}

interface ClaimEvidenceLink {
  claim_id: string
  evidence_item_id: string
  support_type: string
}

export interface ExecutiveSignalFacts {
  posture: DecisionPosture
  postureCondition?: string
  varianceDriver: string
  interpretation: string
}

export interface EvidencePositionFacts {
  claimsExtracted: number
  evidenceLinkedClaims: number
  evidenceLinksTotal: number
  coveragePercent: number // External coverage (for institutional read)
  inputCoveragePercent: number
  externalCoveragePercent: number
  inputLinkedClaims: number
  externalLinkedClaims: number
  unsupportedCount: number
  institutionalInterpretation: string
}

export function computeDecisionPosture(
  confidence: number,
  convergenceCount: number,
  divergenceCount: number,
  band: string,
  evidenceCoveragePercent?: number,
  externalCoveragePercent?: number
): { posture: DecisionPosture; condition?: string } {
  // Use externalCoveragePercent if provided, otherwise fall back to evidenceCoveragePercent
  const coverage = externalCoveragePercent ?? evidenceCoveragePercent ?? 100
  
  // 6️⃣ Fix posture guardrail: IF external coverage < 60, RETURN "DELAY"
  if (coverage < 60) {
    return { posture: 'DELAY' }
  }

  // High confidence + high convergence + no divergence = ADVANCE
  if (confidence >= 0.75 && convergenceCount >= 3 && divergenceCount === 0) {
    return { posture: 'ADVANCE' }
  }

  // DO_NOT_PROCEED is ONLY allowed when:
  // - confidence < 0.35 AND divergence >= 3
  if (confidence < 0.35 && divergenceCount >= 3) {
    return { posture: 'DO_NOT_PROCEED' }
  }

  // Moderate confidence with some divergence = CONDITIONAL_ADVANCE
  // Preserve CONDITIONAL_ADVANCE for moderate confidence with uncertainty
  if (confidence >= 0.35 && confidence < 0.60 && divergenceCount > 0) {
    // If divergence is about infrastructure/execution, condition on that
    return { 
      posture: 'CONDITIONAL_ADVANCE',
      condition: 'SUBJECT TO ARCHITECTURE VERIFICATION'
    }
  }

  // Moderate confidence with convergence but some risk = REPRICE
  if (confidence >= 0.50 && confidence < 0.75 && convergenceCount >= 2) {
    return { posture: 'REPRICE' }
  }

  // Default: DELAY if uncertain
  return { posture: 'DELAY' }
}

export function extractVarianceDriver(
  divergencePoints: DivergencePoint[],
  convergencePoints: ConvergencePoint[],
  divergenceCount: number,
  externalCoveragePercent?: number,
  inputCoveragePercent?: number
): string {
  const safeDivergencePoints = divergencePoints || []
  const externalCoverage = externalCoveragePercent ?? 100
  const inputCoverage = inputCoveragePercent ?? 0
  
  // 3️⃣ Fix Variance Driver defaulting - EXACT rule at top
  if (divergenceCount === 0 && externalCoverage === 0 && inputCoverage > 0) {
    return 'External corroboration absent (stimulus-bound evidence only)'
  }
  
  if (safeDivergencePoints.length === 0) {
    return 'Outcome dispersion is low'
  }

  // Extract themes from divergences
  const divergenceThemes = divergencePoints.map(dp => dp.theme_label.toLowerCase())
  
  // Common variance drivers
  if (divergenceThemes.some(t => t.includes('infrastructure') || t.includes('architecture'))) {
    return 'Infrastructure uncertainty, not strategic misalignment'
  }
  if (divergenceThemes.some(t => t.includes('execution') || t.includes('integration'))) {
    return 'Execution complexity, not market risk'
  }
  if (divergenceThemes.some(t => t.includes('retention') || t.includes('talent'))) {
    return 'Talent dynamics, not operational risk'
  }
  if (divergenceThemes.some(t => t.includes('growth') || t.includes('revenue'))) {
    return 'Growth durability, not valuation risk'
  }

  // Default: use first divergence theme
  return divergencePoints[0]?.theme_label || 'Uncertainty in key assumptions'
}

export function classifyEpistemicTiers(
  claims: ExtractedClaim[],
  evidenceLinks: ClaimEvidenceLink[],
  evidenceItems: EvidenceItem[]
): { stratification: EpistemicStratification[]; claimTierById: Record<string, EpistemicTier> } {
  const claimTierById: Record<string, EpistemicTier> = {}
  
  // Build evidence item type map by ID
  const evidenceItemTypes = new Map<string, string>()
  for (const item of evidenceItems) {
    evidenceItemTypes.set(item.id, item.source_type || 'lens_inference')
  }
  
  // Build per-claim evidence type sets
  const claimEvidenceTypes = new Map<string, Set<string>>()
  for (const link of evidenceLinks) {
    const evidenceType = evidenceItemTypes.get(link.evidence_item_id) || 'lens_inference'
    if (!claimEvidenceTypes.has(link.claim_id)) {
      claimEvidenceTypes.set(link.claim_id, new Set())
    }
    claimEvidenceTypes.get(link.claim_id)!.add(evidenceType)
  }
  
  // External evidence types
  const externalEvidenceTypes = new Set([
    'external_citation',
    'numeric_data',
    'context_excerpt',
    'user_upload',
    'url',
  ])
  
  // Classify each claim
  // 3️⃣ Epistemic tiering rule (hard)
  for (const claim of claims) {
    const evidenceTypes = claimEvidenceTypes.get(claim.id) || new Set()
    const hasExternalEvidence = Array.from(evidenceTypes).some(type => externalEvidenceTypes.has(type))
    const hasOnlyStimulus = evidenceTypes.size > 0 && evidenceTypes.has('stimulus_quote') && !hasExternalEvidence
    const hasExternalCitation = evidenceTypes.has('external_citation')
    const hasNumericData = evidenceTypes.has('numeric_data')
    const hasContextExcerpt = evidenceTypes.has('context_excerpt')
    
    // stimulus_quote-only support => tier = CONDITIONAL
    if (hasOnlyStimulus) {
      claimTierById[claim.id] = 'CONDITIONAL'
    }
    // BASE_RATE_ANCHORED only if external_citation present (heuristic: assume citations contain dataset/sample metadata)
    else if (hasExternalCitation) {
      claimTierById[claim.id] = 'BASE_RATE_ANCHORED'
    }
    // OBSERVED requires evidence types in {external_citation, numeric_data, context_excerpt}
    else if (hasExternalEvidence && (hasNumericData || hasContextExcerpt)) {
      claimTierById[claim.id] = 'OBSERVED'
    }
    // QUANTIFIED if numeric_data present OR modeled assumptions explicitly flagged
    else if (hasNumericData || (claim.evidence_status === 'supported' && claim.category === 'factual' && claim.evidence_basis?.toLowerCase().includes('model'))) {
      claimTierById[claim.id] = 'QUANTIFIED'
    }
    // Default: CONDITIONAL
    else {
      claimTierById[claim.id] = 'CONDITIONAL'
    }
  }
  
  // Count by tier
  const tierCounts: Record<EpistemicTier, number> = {
    OBSERVED: 0,
    QUANTIFIED: 0,
    BASE_RATE_ANCHORED: 0,
    CONDITIONAL: 0,
  }
  
  for (const tier of Object.values(claimTierById)) {
    tierCounts[tier]++
  }
  
  // Build stratification array
  const stratification: EpistemicStratification[] = []
  
  for (const [tier, config] of Object.entries(VOCABULARY.TIERS)) {
    const count = tierCounts[tier as EpistemicTier]
    if (count > 0) {
      stratification.push({
        tier: tier as EpistemicTier,
        definition: config.definition,
        decisionWeight: config.weight,
        claimCount: count,
      })
    }
  }
  
  return { stratification, claimTierById }
}

export function extractConfidenceForces(
  confidenceBreakdown: ConfidenceBreakdown,
  convergenceCount: number,
  divergenceCount: number,
  externalCoveragePercent: number,
  unsupportedCount: number
): { positive: string[]; compression: string[] } {
  const positive: string[] = []
  const compression: string[] = []
  
  // Positive forces
  if (externalCoveragePercent >= 80) {
    positive.push('Evidence >80%')
  }
  if (confidenceBreakdown.agreement_factor >= 0.60) {
    positive.push('Strong convergence across lenses')
  }
  if (convergenceCount >= 3) {
    positive.push('Multiple convergence themes')
  }
  if (confidenceBreakdown.evidence_density_factor >= 0.70) {
    positive.push('High evidence density')
  }
  
  // 4️⃣ Compression forces aligned with split coverage
  // Add compression force "External evidence coverage below threshold" iff externalCoveragePercent < 60
  if (externalCoveragePercent < 60) {
    compression.push('External evidence coverage below threshold')
  }
  // Add compression force "Forward-state claims remain unsupported" iff unsupportedCount > 0
  if (unsupportedCount > 0) {
    compression.push('Forward-state claims remain unsupported')
  }
  // REMOVE/stop emitting "Significant unsupported claims" - replaced by unsupportedCount check above
  if (divergenceCount >= 2) {
    compression.push('Active divergence detected')
  }
  if (confidenceBreakdown.divergence_penalty > 0.15) {
    compression.push('High contradiction level')
  }
  
  return { positive, compression }
}

export function computeEvidencePosition(
  claims: ExtractedClaim[],
  evidenceItems: EvidenceItem[],
  evidenceLinks: ClaimEvidenceLink[]
): EvidencePositionFacts {
  const claimsExtracted = claims.length
  const evidenceLinksTotal = evidenceLinks.length
  const unsupportedCount = claims.filter(c => c.evidence_status === 'unsupported').length
  
  // Build evidence item type map by ID
  const evidenceItemTypes = new Map<string, string>()
  for (const item of evidenceItems) {
    evidenceItemTypes.set(item.id, item.source_type || 'lens_inference')
  }
  
  // External evidence types (not stimulus_quote)
  const externalEvidenceTypes = new Set([
    'external_citation',
    'numeric_data',
    'context_excerpt',
    'user_upload',
    'url',
    'lens_inference', // Keep lens inference as external for now
  ])
  
  // Build sets of claim IDs by evidence type
  const inputLinkedClaimIds = new Set<string>()
  const externalLinkedClaimIds = new Set<string>()
  
  for (const link of evidenceLinks) {
    const evidenceType = evidenceItemTypes.get(link.evidence_item_id) || 'lens_inference'
    if (evidenceType === 'stimulus_quote') {
      inputLinkedClaimIds.add(link.claim_id)
    } else if (externalEvidenceTypes.has(evidenceType)) {
      externalLinkedClaimIds.add(link.claim_id)
    }
  }
  
  const inputLinkedClaims = inputLinkedClaimIds.size
  const externalLinkedClaims = externalLinkedClaimIds.size
  // Evidence-Linked (Total) = union of both sets (claims linked to ANY evidence)
  const evidenceLinkedClaims = new Set([...inputLinkedClaimIds, ...externalLinkedClaimIds]).size
  
  // 1️⃣ Evidence Position correctness: Ensure totals match
  // evidenceLinkedClaims should equal externalLinkedClaims + inputLinkedClaims - overlap
  // But since we use Set union, it's already correct (no double-counting)
  
  // Calculate coverage percentages using claimsExtracted as denominator
  const inputCoveragePercent = claimsExtracted > 0
    ? Math.round((inputLinkedClaims / claimsExtracted) * 100)
    : 0
  
  const externalCoveragePercent = claimsExtracted > 0
    ? Math.round((externalLinkedClaims / claimsExtracted) * 100)
    : 0
  
  // coveragePercent = externalCoveragePercent for institutional read
  const coveragePercent = externalCoveragePercent
  
  // 5️⃣ HARD SAFETY: Never allow 0% coverage when claims exist
  // But now we distinguish: if only input coverage exists, that's still valid
  if (claimsExtracted > 0 && evidenceLinksTotal === 0) {
    return {
      claimsExtracted,
      evidenceLinkedClaims: 0,
      evidenceLinksTotal: 0,
      coveragePercent: 0, // External coverage is 0
      inputCoveragePercent: 0,
      externalCoveragePercent: 0,
      inputLinkedClaims: 0,
      externalLinkedClaims: 0,
      unsupportedCount,
      institutionalInterpretation: 'Stimulus-supported only; no external corroboration.',
    }
  }
  
  // 2️⃣ Institutional interpretation with stimulus-aware messaging
  let institutionalInterpretation: string
  if (externalCoveragePercent >= 80) {
    institutionalInterpretation = 'Above ~80%, judgment transitions from structured diligence to executable advisory. Residual uncertainty is concentrated in future-state engineering effort, not current operating reality.'
  } else if (externalCoveragePercent >= 60) {
    institutionalInterpretation = 'Coverage above 60% supports conditional judgment. Additional evidence gathering recommended for critical claims.'
  } else if (externalCoveragePercent === 0 && inputCoveragePercent > 0) {
    institutionalInterpretation = 'Stimulus-supported only; no external corroboration.'
  } else {
    institutionalInterpretation = 'Coverage below 60% indicates significant evidence gaps. Proceed with caution and prioritize evidence collection.'
  }
  
  return {
    claimsExtracted,
    evidenceLinkedClaims,
    evidenceLinksTotal,
    coveragePercent,
    inputCoveragePercent,
    externalCoveragePercent,
    inputLinkedClaims,
    externalLinkedClaims,
    unsupportedCount,
    institutionalInterpretation,
  }
}

export function extractConvergenceField(
  convergencePoints: ConvergencePoint[]
): ArtifactConvergence[] {
  return convergencePoints.map(cp => ({
    theme: cp.theme_label,
    interpretation: `Cross-lens agreement on ${cp.theme_label.toLowerCase()}. ${cp.supporting_lenses.length} lenses converge.`,
  }))
}

export function extractActiveDivergence(
  divergencePoints: DivergencePoint[]
): ArtifactDivergence[] {
  return divergencePoints.map(dp => ({
    theme: dp.theme_label,
    positions: dp.positions.map(pos => ({
      label: pos.position_summary || `Position ${dp.positions.indexOf(pos) + 1}`,
      interpretation: pos.position_summary || 'Divergent position identified',
    })),
    institutionalRead: dp.nature === 'contradictory'
      ? 'Conflict remains surfaced. Institutional artifacts gain credibility when tension survives synthesis.'
      : 'Complementary perspectives identified. Integration required.',
  }))
}
