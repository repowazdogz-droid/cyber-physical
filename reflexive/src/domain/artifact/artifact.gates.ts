/**
 * Decision Gate Logic
 * Conditional rules mapping conditions to institutional moves
 */

import type { DecisionGate, GateMove } from './artifact.types.js'

export function computeDecisionGates(
  confidence: number,
  convergenceCount: number,
  divergenceCount: number,
  evidenceCoverage: number
): DecisionGate[] {
  const gates: DecisionGate[] = []
  
  // Architecture/Infrastructure Gate
  gates.push({
    gateId: 'architecture_audit',
    title: 'Architecture Audit',
    rows: [
      { condition: 'Modular', move: 'ADVANCE' },
      { condition: 'Mixed', move: 'REPRICE' },
      { condition: 'Systemic', move: 'DELAY' },
    ],
  })
  
  // Evidence Coverage Gate
  gates.push({
    gateId: 'evidence_coverage',
    title: 'Evidence Coverage',
    rows: [
      { condition: '>85%', move: 'ADVANCE' },
      { condition: '70-85%', move: 'REPRICE' },
      { condition: '<70%', move: 'DELAY' },
    ],
  })
  
  // Convergence Gate
  gates.push({
    gateId: 'convergence_threshold',
    title: 'Convergence Threshold',
    rows: [
      { condition: '≥3 convergences', move: 'ADVANCE' },
      { condition: '2 convergences', move: 'REPRICE' },
      { condition: '<2 convergences', move: 'DELAY' },
    ],
  })
  
  // Divergence Gate
  if (divergenceCount > 0) {
    gates.push({
      gateId: 'divergence_management',
      title: 'Divergence Management',
      rows: [
        { condition: 'Contained (<2)', move: 'ADVANCE' },
        { condition: 'Moderate (2-3)', move: 'REPRICE' },
        { condition: 'High (>3)', move: 'DELAY' },
      ],
    })
  }
  
  // Confidence Gate
  gates.push({
    gateId: 'confidence_band',
    title: 'Confidence Band',
    rows: [
      { condition: 'High (≥0.75)', move: 'ADVANCE' },
      { condition: 'Moderate (0.50-0.75)', move: 'REPRICE' },
      { condition: 'Low (<0.50)', move: 'DELAY' },
    ],
  })
  
  return gates
}
