'use client'

import type { DemoPackResponse } from '@/lib/api'

interface StructuralThesisProps {
  analysis: DemoPackResponse
}

export function StructuralThesis({ analysis }: StructuralThesisProps) {
  const synthesis = analysis.synthesis || {}
  const confidenceBreakdown = synthesis.confidence_breakdown || {}
  const confidenceScore = analysis.summary.confidence_score

  // Parse exec_summary for thesis text
  const execSummary = analysis.exec_summary || ''
  const lines = execSummary.split('\n').filter((l) => l.trim())
  
  // Extract interpretation/thesis (usually after "Interpretation:" or similar)
  const interpretationIdx = lines.findIndex((l) =>
    l.toLowerCase().includes('interpretation') || l.toLowerCase().includes('thesis')
  )
  const thesisText = interpretationIdx >= 0
    ? lines.slice(interpretationIdx + 1).join(' ').trim()
    : execSummary.split('REDLINES')[0].trim()

  // Gate status calculation
  const minLensCount = 3
  const lensCount = analysis.artifacts?.lens_artifacts?.length || 0
  const scoringClaims = (analysis.artifacts?.claim_artifacts || []).filter(
    (c: any) => c.category !== 'invalid'
  ).length
  const gatePassed = lensCount >= minLensCount && scoringClaims > 0

  // Confidence interval (using breakdown components)
  const agreementFactor = confidenceBreakdown.agreement_factor || 0
  const evidenceDensity = confidenceBreakdown.evidence_density_factor || 0
  const unsupportedPenalty = confidenceBreakdown.unsupported_penalty || 0
  const divergencePenalty = confidenceBreakdown.divergence_penalty || 0

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-1">
          STRUCTURAL THESIS
        </div>
        <div className="text-sm font-semibold text-foreground">
          Executive Assessment
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Confidence Score */}
        {confidenceScore !== null && (
          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3">
              CONFIDENCE SCORE
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <div className="text-4xl font-bold text-foreground">
                {(confidenceScore * 100).toFixed(1)}%
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                  analysis.summary.band === 'Low'
                    ? 'bg-band-low-bg text-band-low-text'
                    : analysis.summary.band === 'Moderate'
                    ? 'bg-band-moderate-bg text-band-moderate-text'
                    : analysis.summary.band === 'High'
                    ? 'bg-band-high-bg text-band-high-text'
                    : 'bg-band-very-high-bg text-band-very-high-text'
                }`}
              >
                {analysis.summary.band}
              </div>
            </div>

            {/* Confidence Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Agreement Factor</span>
                <span className="font-mono font-semibold text-foreground">
                  {(agreementFactor * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Evidence Density</span>
                <span className="font-mono font-semibold text-foreground">
                  {(evidenceDensity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Unsupported Penalty</span>
                <span className="font-mono font-semibold text-red-600">
                  -{(unsupportedPenalty * 100).toFixed(1)}%
                </span>
              </div>
              {divergencePenalty > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Divergence Penalty</span>
                  <span className="font-mono font-semibold text-red-600">
                    -{(divergencePenalty * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gate Status */}
        <div>
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3">
            GATE STATUS
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${
                gatePassed ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <div className="text-sm font-semibold text-foreground">
              {gatePassed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
          <div className="text-xs text-muted space-y-1 ml-5">
            <div>
              Lenses: {lensCount} / {minLensCount} minimum
            </div>
            <div>Scoring Claims: {scoringClaims}</div>
          </div>
        </div>

        {/* Thesis Text */}
        <div>
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3">
            THESIS
          </div>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {thesisText || 'No thesis available.'}
          </div>
        </div>

        {/* Rationale */}
        {synthesis.confidence_rationale && (
          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3">
              RATIONALE
            </div>
            <div className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
              {synthesis.confidence_rationale}
            </div>
          </div>
        )}

        {/* Warnings */}
        {(confidenceBreakdown.low_evidence_warning ||
          confidenceBreakdown.high_contradiction_warning) && (
          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3">
              WARNINGS
            </div>
            <div className="space-y-2">
              {confidenceBreakdown.low_evidence_warning && (
                <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  Low evidence density detected
                </div>
              )}
              {confidenceBreakdown.high_contradiction_warning && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                  High contradiction level detected
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
