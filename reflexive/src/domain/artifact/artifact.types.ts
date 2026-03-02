/**
 * Institutional Decision Artifact Schema
 * Schema: reflexive.artifact.v7
 * 
 * The artifact is a first-class domain object representing institutional judgment,
 * not a view transformation.
 */

export type DecisionPosture = 
  | 'ADVANCE'
  | 'CONDITIONAL_ADVANCE'
  | 'DELAY'
  | 'REPRICE'
  | 'DO_NOT_PROCEED'

export type EpistemicTier = 
  | 'OBSERVED'
  | 'QUANTIFIED'
  | 'BASE_RATE_ANCHORED'
  | 'CONDITIONAL'

export type GateMove = 'ADVANCE' | 'REPRICE' | 'DELAY' | 'ABORT'

export interface ExecutiveSignal {
  posture: DecisionPosture
  postureCondition?: string // e.g., "SUBJECT TO ARCHITECTURE VERIFICATION"
  varianceDriver: string
  interpretation: string // 1-2 sentences
}

export interface EvidencePosition {
  claimsExtracted: number
  evidenceLinkedClaims: number // Unique claim_ids with evidence (total)
  evidenceLinksTotal: number // Total evidence links
  coveragePercent: number // External coverage (for institutional read)
  inputCoveragePercent: number // Stimulus-linked coverage
  externalCoveragePercent: number // External evidence coverage
  inputLinkedClaims: number // Claims linked to stimulus_quote evidence
  externalLinkedClaims: number // Claims linked to external evidence
  unsupportedCount: number
  institutionalInterpretation: string
}

export interface EpistemicStratification {
  tier: EpistemicTier
  definition: string
  decisionWeight: 'HIGH' | 'MODERATE_HIGH' | 'MODERATE' | 'LOW'
  claimCount: number
}

export interface StructuralThesis {
  classification: string // "HelioTech is best classified as..."
  thesis: string // Core judgment paragraph
}

export interface BaseRateCitation {
  source: string // "McKinsey & Company"
  title: string
  year: number
  dataset?: string // "~2,000 acquisitions"
  findings: string[]
  institutionalRead: string
}

export interface FinancialUnderwriting {
  entryFacts: Record<string, string | number>
  modelDisclosure: {
    assumptions: Record<string, string>
    sensitivityTested: boolean
  }
}

export interface Scenario {
  label: string // "Modular Integration"
  probability: number
  outcomes: Record<string, string | number> // IRR, NPV, etc.
  institutionalRead: string
}

export interface ConfidenceConstruction {
  band: string // "Moderate–High"
  qualifier?: string // "Underwriteable, diligence-sensitive"
  positiveForces: string[] // Simplified: just descriptions
  compressionForces: string[] // Simplified: just descriptions
  principle: string
}

export interface DecisionGateRow {
  condition: string // e.g., "Modular"
  move: GateMove
}

export interface DecisionGate {
  gateId: string // Stable identifier
  title: string // e.g., "Architecture Audit"
  rows: DecisionGateRow[]
}

export interface ArtifactConvergence {
  theme: string
  interpretation: string
}

export interface ArtifactDivergence {
  theme: string
  positions: Array<{
    label: string
    interpretation: string
  }>
  institutionalRead: string
}

export interface TemporalVarianceLayer {
  timeframe: string // "T1 — Shock Layer"
  description: string
}

export interface ReversibilityPoint {
  stage: string // "Pre-signature"
  reversibility: string // "reversible"
}

export interface ControlRequirement {
  requirement: string
  rationale?: string
}

export interface ReasoningTrace {
  lens: string
  path: string // Brief description of reasoning
}

export interface ModelSnapshot {
  llm_model: string | null
  embedding_model: string | null
  run_id: string | null
  created_at: string
}

export interface InstitutionalArtifact {
  // Metadata
  artifactId: string // Human-readable: "RX-HELIO-ACQ-007"
  analysisId: string // UUID
  createdAt: string
  schemaVersion: string // "reflexive.artifact.v7"
  classification: string // "Deal Advisory Grade — Underwriting Ready"
  modelSnapshot: ModelSnapshot
  __artifact_schema_debug?: string // Temporary debug field to verify API codepath
  
  // Core sections
  executiveSignal: ExecutiveSignal
  evidencePosition: EvidencePosition
  epistemicStratification: EpistemicStratification[]
  claimTierById?: Record<string, EpistemicTier> // Optional traceability map
  structuralThesis: StructuralThesis
  baseRateSurface?: BaseRateCitation[] // Optional for now
  financialUnderwriting?: FinancialUnderwriting // Optional for now
  scenarios?: Scenario[] // Optional for now
  confidenceConstruction: ConfidenceConstruction
  decisionGates: DecisionGate[]
  convergenceField: ArtifactConvergence[]
  activeDivergence: ArtifactDivergence[]
  temporalVariance?: TemporalVarianceLayer[] // Optional for now
  reversibilityGeometry?: ReversibilityPoint[] // Optional for now
  controlArchitecture?: ControlRequirement[] // Optional for now
  reasoningTrace: ReasoningTrace[]
  terminalLine: string
}
