/**
 * Artifact Composer
 * Main pipeline: Engine Output → Classifiers → Facts → Narrative → Artifact
 */

import type { InstitutionalArtifact } from './artifact.types'

// Local type definitions (copied from engine types)
interface EngineOutput {
  synthesis: {
    convergence_points: any[]
    divergence_points: any[]
    orphan_claims: string[]
    confidence_score: number
    confidence_breakdown: any
    confidence_rationale: string
    computed_at: string
  }
  claim_annotations: any[]
  drift: any
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
import {
  computeDecisionPosture,
  extractVarianceDriver,
  classifyEpistemicTiers,
  extractConfidenceForces,
  computeEvidencePosition,
  extractConvergenceField,
  extractActiveDivergence,
} from './artifact.classifiers'
import { computeDecisionGates } from './artifact.gates'
import { VOCABULARY } from './artifact.language'

export interface ComposerInput {
  engineOutput: EngineOutput
  claims: ExtractedClaim[]
  evidenceItems: EvidenceItem[]
  evidenceLinks: ClaimEvidenceLink[]
  analysisId: string
  createdAt: string
  modelSnapshot: {
    llm_model: string | null
    embedding_model: string | null
    run_id: string | null
    created_at: string
  }
  execSummary: string
  confidenceScore: number
  band: string
  convergenceCount: number
  divergenceCount: number
  orphanCount: number
  stimulusText?: string // Optional stimulus text for thesis generation
}

function generateArtifactId(analysisId: string, stimulusType?: string): string {
  // Generate human-readable ID: RX-[TYPE]-[SHORT-UUID]
  const prefix = stimulusType === 'decision' ? 'DEC' :
                 stimulusType === 'question' ? 'Q' :
                 stimulusType === 'scenario' ? 'SCEN' : 'ANALYSIS'
  const shortId = analysisId.substring(0, 8).toUpperCase()
  return `RX-${prefix}-${shortId}`
}

function generateClassification(band: string, convergenceCount: number): string {
  if (band === 'High' && convergenceCount >= 3) {
    return 'Deal Advisory Grade — Underwriting Ready'
  }
  if (band === 'Moderate' || band === 'High') {
    return 'Advisory Grade — Conditional'
  }
  return 'Advisory Grade — Diligence Required'
}

function generateStructuralThesis(execSummary: string, convergencePoints: any[], divergencePoints: any[], stimulusText?: string): {
  classification: string
  thesis: string
} {
  // Use exec_summary as primary thesis text
  const safeExecSummary = execSummary || ''
  
  // 5️⃣ Strip the "REFLEXIVE Analysis Summary …" block properly
  // If exec_summary contains "REFLEXIVE Analysis Summary", drop that line AND everything until
  // we hit a blank line after "Interpretation:" OR hard-stop at section markers
  
  let thesisText = ''
  
  // Check if it contains the debug header
  if (safeExecSummary.includes('REFLEXIVE Analysis Summary')) {
    const lines = safeExecSummary.split('\n')
    let foundInterpretation = false
    let interpretationStartIndex = -1
    
    // Find "Interpretation:" line
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase().trim()
      if (lower.startsWith('interpretation:')) {
        foundInterpretation = true
        interpretationStartIndex = i
        break
      }
    }
    
    if (foundInterpretation && interpretationStartIndex >= 0) {
      // Extract content after "Interpretation:" until blank line or section marker
      const interpretationLine = lines[interpretationStartIndex]
      const interpretationContent = interpretationLine.substring('interpretation:'.length).trim()
      const afterLines: string[] = []
      
      // Collect lines after Interpretation until blank line or section marker
      for (let i = interpretationStartIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line === '' || line.match(/^─+$/) || line.toLowerCase().includes('confidence construction')) {
          break
        }
        if (line.length > 0 && !line.match(/^\s*•/)) { // Skip bullet points
          afterLines.push(line)
        }
      }
      
      thesisText = [interpretationContent, ...afterLines].filter(Boolean).join(' ').trim()
    } else {
      // No Interpretation found - try REDLINES split
      const beforeRedlines = safeExecSummary.split('REDLINES')[0]
      const interpretationMatch = beforeRedlines.match(/interpretation:\s*(.+)/i)
      if (interpretationMatch) {
        thesisText = interpretationMatch[1].trim()
      }
    }
  } else {
    // No debug header - try REDLINES split or use as-is
    thesisText = safeExecSummary.split('REDLINES')[0].trim()
  }
  
  // Final cleanup: remove any remaining dev/debug patterns
  if (thesisText) {
    thesisText = thesisText
      .split('\n')
      .filter(line => {
        const lower = line.toLowerCase().trim()
        return !lower.includes('reflexive analysis summary') &&
               !lower.startsWith('schema:') &&
               !lower.startsWith('models:') &&
               !lower.startsWith('config:') &&
               !lower.match(/^confidence:.*band\)$/i) &&
               !lower.match(/^counts:.*$/i) &&
               !lower.match(/^evidence:.*$/i) &&
               !lower.match(/^key agreements?:$/i) &&
               !lower.match(/^key disagreements?:$/i) &&
               !lower.match(/^\s*•/) &&
               !lower.match(/^─+$/)
      })
      .join(' ')
      .trim()
  }
  
  // If exec_summary is missing/empty after cleaning, generate fallback
  if (!thesisText || thesisText.length < 20) {
    thesisText = 'Structural analysis complete. Decision requires external corroboration before proceeding.'
  }
  
  // Generate deterministic classification from stimulus type/keywords (NOT from claims/convergence)
  let classification = 'A strategic decision carrying execution risk.'
  
  if (stimulusText) {
    const stimulusLower = stimulusText.toLowerCase()
    
    // M&A / Acquisition patterns
    if (stimulusLower.includes('acquire') || stimulusLower.includes('acquisition') || stimulusLower.includes('buy')) {
      if (stimulusLower.includes('capability') || stimulusLower.includes('team') || stimulusLower.includes('engineering')) {
        classification = 'A capability acquisition carrying latent integration obligations.'
      } else if (stimulusLower.includes('market') || stimulusLower.includes('entry')) {
        classification = 'A market entry transaction carrying execution risk.'
      } else {
        classification = 'A strategic acquisition carrying integration obligations.'
      }
    }
    // Partnership / Alliance patterns
    else if (stimulusLower.includes('partnership') || stimulusLower.includes('alliance') || stimulusLower.includes('joint venture')) {
      classification = 'A strategic partnership carrying coordination risk.'
    }
    // Investment / Funding patterns
    else if (stimulusLower.includes('invest') || stimulusLower.includes('funding') || stimulusLower.includes('capital')) {
      classification = 'A capital allocation decision carrying execution risk.'
    }
    // Default: keep generic
  }
  
  return {
    classification,
    thesis: thesisText,
  }
}

function generateTerminalLine(
  posture: string,
  varianceDriver: string,
  thesis: string
): string {
  if (posture === 'ADVANCE' || posture === 'CONDITIONAL_ADVANCE') {
    return `Proceed with ${posture === 'CONDITIONAL_ADVANCE' ? 'conditions met' : 'confidence'}. ${varianceDriver}.`
  }
  if (posture === 'DELAY') {
    return `Delay decision. Underwrite the unknowns, then re-evaluate.`
  }
  if (posture === 'REPRICE') {
    return `Reprice transaction. ${varianceDriver}. Adjust scope or terms to mitigate identified risks.`
  }
  if (posture === 'DO_NOT_PROCEED') {
    return `Do not proceed. ${varianceDriver}.`
  }
  return `Delay decision. Underwrite the unknowns, then re-evaluate.`
}

export function composeArtifact(input: ComposerInput): InstitutionalArtifact {
  const {
    engineOutput,
    claims,
    evidenceItems,
    evidenceLinks,
    analysisId,
    createdAt,
    modelSnapshot,
    execSummary,
    confidenceScore,
    band,
    convergenceCount,
    divergenceCount,
  } = input

  const synthesis = engineOutput.synthesis
  const convergencePoints = synthesis.convergence_points || []
  const divergencePoints = synthesis.divergence_points || []

  // Classifiers - compute evidence position first (needed for posture)
  const evidencePositionFacts = computeEvidencePosition(claims, evidenceItems, evidenceLinks)
  const postureResult = computeDecisionPosture(
    confidenceScore,
    convergenceCount,
    divergenceCount,
    band,
    evidencePositionFacts.coveragePercent,
    evidencePositionFacts.externalCoveragePercent
  )
  const varianceDriver = extractVarianceDriver(
    divergencePoints,
    convergencePoints,
    divergenceCount,
    evidencePositionFacts.externalCoveragePercent,
    evidencePositionFacts.inputCoveragePercent
  )
  const { stratification, claimTierById } = classifyEpistemicTiers(claims, evidenceLinks, evidenceItems)
  const confidenceForces = extractConfidenceForces(
    synthesis.confidence_breakdown,
    convergenceCount,
    divergenceCount,
    evidencePositionFacts.externalCoveragePercent,
    evidencePositionFacts.unsupportedCount
  )
  const decisionGates = computeDecisionGates(
    confidenceScore,
    convergenceCount,
    divergenceCount,
    evidencePositionFacts.coveragePercent
  )
  const convergenceField = extractConvergenceField(convergencePoints)
  const activeDivergence = extractActiveDivergence(divergencePoints)
  
  // Extract stimulus text for thesis generation
  const stimulusText = input.stimulusText || ''
  const structuralThesis = generateStructuralThesis(execSummary, convergencePoints, divergencePoints, stimulusText)

  // Generate interpretation for executive signal
  const interpretation = convergenceCount >= 3 && divergenceCount === 0
    ? 'Strong convergence across analytical lenses. Outcome dispersion is minimal.'
    : convergenceCount >= 2 && divergenceCount <= 1
    ? 'Convergence exists with manageable divergence. Outcome dispersion is contained.'
    : 'Divergence patterns indicate structural uncertainty. Outcome dispersion requires management.'

  // Build artifact
  const artifact: InstitutionalArtifact = {
    artifactId: generateArtifactId(analysisId),
    analysisId,
    createdAt,
    schemaVersion: 'reflexive.artifact.v7',
    classification: generateClassification(band, convergenceCount),
    modelSnapshot,

    executiveSignal: {
      posture: postureResult.posture,
      postureCondition: postureResult.condition,
      varianceDriver,
      interpretation,
    },

    evidencePosition: {
      claimsExtracted: evidencePositionFacts.claimsExtracted,
      evidenceLinkedClaims: evidencePositionFacts.evidenceLinkedClaims,
      evidenceLinksTotal: evidencePositionFacts.evidenceLinksTotal,
      coveragePercent: evidencePositionFacts.coveragePercent,
      inputCoveragePercent: evidencePositionFacts.inputCoveragePercent,
      externalCoveragePercent: evidencePositionFacts.externalCoveragePercent,
      inputLinkedClaims: evidencePositionFacts.inputLinkedClaims,
      externalLinkedClaims: evidencePositionFacts.externalLinkedClaims,
      unsupportedCount: evidencePositionFacts.unsupportedCount,
      institutionalInterpretation: evidencePositionFacts.institutionalInterpretation,
    },

    epistemicStratification: stratification,
    claimTierById,

    structuralThesis,

    confidenceConstruction: {
      band: band === 'High' ? 'Moderate–High' : band === 'Moderate' ? 'Moderate' : 'Low–Moderate',
      qualifier: band === 'High' ? 'Underwriteable, diligence-sensitive' : undefined,
      positiveForces: confidenceForces.positive,
      compressionForces: confidenceForces.compression,
      principle: 'When variance is structural, increase measurement — not narrative certainty.',
    },

    decisionGates,

    convergenceField,
    activeDivergence,

    reasoningTrace: [], // TODO: Extract from lens artifacts

    terminalLine: generateTerminalLine(
      postureResult.posture,
      varianceDriver,
      structuralThesis.thesis
    ),
  }

  return artifact
}
