'use client'

import type { DemoPackResponse } from '@/lib/api'

interface DecisionPostureProps {
  analysis: DemoPackResponse
}

type Posture = 'PROCEED' | 'DELAY' | 'REPRICE' | 'ABORT'

function computeDecisionPosture(analysis: DemoPackResponse): Posture {
  const confidence = analysis.summary.confidence_score || 0
  const convergenceCount = analysis.summary.convergence_count || 0
  const divergenceCount = analysis.summary.divergence_count || 0
  const band = analysis.summary.band

  // High confidence + high convergence = PROCEED
  if (confidence >= 0.75 && convergenceCount >= 3 && divergenceCount === 0) {
    return 'PROCEED'
  }

  // Low confidence OR high divergence = ABORT
  if (confidence < 0.25 || (divergenceCount >= 3 && convergenceCount < 2)) {
    return 'ABORT'
  }

  // Moderate confidence with some divergence = DELAY (gather more evidence)
  if (confidence >= 0.25 && confidence < 0.60 && divergenceCount > 0) {
    return 'DELAY'
  }

  // Moderate confidence with convergence but some risk = REPRICE (adjust scope/terms)
  if (confidence >= 0.50 && confidence < 0.75 && convergenceCount >= 2) {
    return 'REPRICE'
  }

  // Default: DELAY if uncertain
  return 'DELAY'
}

function getPostureColor(posture: Posture): string {
  switch (posture) {
    case 'PROCEED':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'DELAY':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    case 'REPRICE':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'ABORT':
      return 'text-red-700 bg-red-50 border-red-200'
  }
}

function getPostureLabel(posture: Posture): string {
  switch (posture) {
    case 'PROCEED':
      return 'Proceed'
    case 'DELAY':
      return 'Delay — Gather Evidence'
    case 'REPRICE':
      return 'Reprice — Adjust Scope'
    case 'ABORT':
      return 'Abort'
  }
}

export function DecisionPosture({ analysis }: DecisionPostureProps) {
  const posture = computeDecisionPosture(analysis)
  const confidence = analysis.summary.confidence_score || 0

  return (
    <div className={`border-2 rounded-lg p-6 ${getPostureColor(posture)}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider mb-2 opacity-70">
        DECISION POSTURE
      </div>
      <div className="text-2xl font-bold mb-2">
        {getPostureLabel(posture)}
      </div>
      <div className="text-sm opacity-80">
        {posture === 'PROCEED' && 'Strong convergence supports proceeding with current plan.'}
        {posture === 'DELAY' && 'Additional evidence needed before proceeding.'}
        {posture === 'REPRICE' && 'Proceed with adjusted scope or terms to mitigate risk.'}
        {posture === 'ABORT' && 'Significant divergence or low confidence indicates this path should not proceed.'}
      </div>
    </div>
  )
}
