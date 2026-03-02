/**
 * Institutional Language Layer
 * Controlled vocabulary and narrative generators
 */

import type {
  DecisionPosture,
  ExecutiveSignal,
  StructuralThesis,
  ConfidenceConstruction,
  EpistemicStratification,
  EvidencePosition,
} from './artifact.types'

export const VOCABULARY = {
  POSTURES: {
    ADVANCE: 'ADVANCE',
    CONDITIONAL_ADVANCE: 'CONDITIONAL ADVANCE',
    DELAY: 'DELAY',
    REPRICE: 'REPRICE',
    DO_NOT_PROCEED: 'DO NOT PROCEED',
  },
  FORCES: {
    POSITIVE: 'Positive Forces',
    COMPRESSION: 'Compression Forces',
  },
  GATES: {
    ADVANCE: 'Advance',
    REPRICE: 'Reprice',
    DELAY: 'Delay',
    ABORT: 'Abort',
  },
  TIERS: {
    OBSERVED: {
      label: 'Observed',
      definition: 'externally verifiable',
      weight: 'HIGH' as const,
    },
    QUANTIFIED: {
      label: 'Quantified',
      definition: 'modeled with disclosed assumptions',
      weight: 'HIGH' as const,
    },
    BASE_RATE_ANCHORED: {
      label: 'Base-Rate Anchored',
      definition: 'empirically recurrent',
      weight: 'MODERATE_HIGH' as const,
    },
    CONDITIONAL: {
      label: 'Conditional',
      definition: 'scenario-bound',
      weight: 'MODERATE' as const,
    },
  },
} as const

export function generateExecutiveSignalText(signal: ExecutiveSignal): string {
  const postureText = signal.postureCondition
    ? `${VOCABULARY.POSTURES[signal.posture]} — ${signal.postureCondition}`
    : VOCABULARY.POSTURES[signal.posture]
  
  return `${postureText}\nVariance Driver: ${signal.varianceDriver}\n\n${signal.interpretation}`
}

export function generateStructuralThesisText(thesis: StructuralThesis): string {
  return `${thesis.classification}\n\n${thesis.thesis}`
}

export function generateConfidenceConstructionText(construction: ConfidenceConstruction): string {
  const bandText = construction.qualifier
    ? `Band: ${construction.band} (${construction.qualifier})`
    : `Band: ${construction.band}`
  
  const positiveSection = construction.positiveForces.length > 0
    ? `\n\n${VOCABULARY.FORCES.POSITIVE}:\n${construction.positiveForces.map(f => `• ${f}`).join('\n')}`
    : ''
  
  const compressionSection = construction.compressionForces.length > 0
    ? `\n\n${VOCABULARY.FORCES.COMPRESSION}:\n${construction.compressionForces.map(f => `• ${f}`).join('\n')}`
    : ''
  
  const principleSection = construction.principle
    ? `\n\nPrinciple:\n${construction.principle}`
    : ''
  
  return `${bandText}${positiveSection}${compressionSection}${principleSection}`
}

export function generateEpistemicStratificationText(stratification: EpistemicStratification[]): string {
  const header = 'Tier\tDefinition\tDecision Weight'
  const rows = stratification.map(s => 
    `${VOCABULARY.TIERS[s.tier].label}\t${s.definition}\t${s.decisionWeight}`
  )
  return [header, ...rows].join('\n')
}

export function generateEvidencePositionText(position: EvidencePosition): string {
  return `Claims Extracted: ${position.claimsExtracted}\n` +
    `Evidence-Linked: ${position.evidenceLinkedClaims}\n` +
    `Coverage: ${position.coveragePercent}%\n` +
    `Unsupported: ${position.unsupportedCount} (forward-state only)\n\n` +
    `Institutional interpretation:\n\n${position.institutionalInterpretation}`
}
