'use client'

import { useState } from 'react'
import { type DemoPackResponse } from '@/lib/api'
import { JsonViewer } from './json-viewer'

interface TraceabilityPanelProps {
  analysis: DemoPackResponse
}

export function TraceabilityPanel({ analysis }: TraceabilityPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['lenses'])
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const lensArtifacts = analysis.artifacts?.lens_artifacts || []
  const claimArtifacts = analysis.artifacts?.claim_artifacts || []
  const evidenceArtifacts = analysis.artifacts?.evidence_artifacts || {}
  const totalClaims = claimArtifacts.length
  const evidenceItems = evidenceArtifacts?.items?.length || 0
  const convergenceCount = analysis.summary.convergence_count
  const divergenceCount = analysis.summary.divergence_count
  const orphanCount = analysis.summary.orphan_count

  // Extract confidence breakdown from synthesis if available
  const synthesis = analysis.synthesis || {}
  const confidenceBreakdown = synthesis.confidence_breakdown || {}

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted uppercase mb-1">
        TRACEABILITY
      </div>

      {/* Active Lenses */}
      <div className="border border-black/[0.08] rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('lenses')}
          className="w-full px-5 py-3.5 text-[12px] font-semibold text-gray-700 bg-black/[0.02] hover:bg-black/[0.04] flex justify-between items-center transition-colors"
        >
          <span>Active Lenses</span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${
              expandedSections.has('lenses') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {expandedSections.has('lenses') && (
          <div className="border-t border-black/[0.05] p-5">
            <div className="flex flex-wrap gap-2">
              {lensArtifacts.map((lens: any, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-black/[0.04] text-gray-700 font-mono"
                >
                  {lens.lens}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Metrics */}
      <div className="border border-black/[0.08] rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('metrics')}
          className="w-full px-5 py-3.5 text-[12px] font-semibold text-gray-700 bg-black/[0.02] hover:bg-black/[0.04] flex justify-between items-center transition-colors"
        >
          <span>Analysis Metrics</span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${
              expandedSections.has('metrics') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {expandedSections.has('metrics') && (
          <div className="border-t border-black/[0.05]">
            <div className="divide-y divide-black/[0.04]">
              <div className="py-2.5 px-5 flex justify-between">
                <span className="text-[12px] text-muted">Total claims</span>
                <span className="text-[12px] font-semibold font-mono text-foreground">
                  {totalClaims}
                </span>
              </div>
              <div className="py-2.5 px-5 flex justify-between">
                <span className="text-[12px] text-muted">Evidence items</span>
                <span className="text-[12px] font-semibold font-mono text-foreground">
                  {evidenceItems}
                </span>
              </div>
              <div className="py-2.5 px-5 flex justify-between">
                <span className="text-[12px] text-muted">Convergent</span>
                <span className="text-[12px] font-semibold font-mono text-convergence">
                  {convergenceCount}
                </span>
              </div>
              <div className="py-2.5 px-5 flex justify-between">
                <span className="text-[12px] text-muted">Divergent</span>
                <span className="text-[12px] font-semibold font-mono text-divergence">
                  {divergenceCount}
                </span>
              </div>
              <div className="py-2.5 px-5 flex justify-between">
                <span className="text-[12px] text-muted">Orphaned</span>
                <span className="text-[12px] font-semibold font-mono text-foreground">
                  {orphanCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Breakdown */}
      {confidenceBreakdown && Object.keys(confidenceBreakdown).length > 0 && (
        <div className="border border-black/[0.08] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('breakdown')}
            className="w-full px-5 py-3.5 text-[12px] font-semibold text-gray-700 bg-black/[0.02] hover:bg-black/[0.04] flex justify-between items-center transition-colors"
          >
            <span>Confidence Breakdown</span>
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform ${
                expandedSections.has('breakdown') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedSections.has('breakdown') && (
            <div className="border-t border-black/[0.05] p-5 space-y-3">
              {Object.entries(confidenceBreakdown).map(([key, value]: [string, any]) => {
                const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
                const isPositive = numValue >= 0
                const displayValue = isPositive ? `+${numValue.toFixed(2)}` : numValue.toFixed(2)
                const barWidth = Math.min(Math.abs(numValue) * 100, 100)

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-muted capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isPositive ? 'text-convergence' : 'text-divergence'
                        }`}
                      >
                        {displayValue}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden bg-black/[0.04]">
                      <div
                        className={`h-full ${
                          isPositive ? 'bg-convergence' : 'bg-red-300'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Config Snapshot */}
      <div className="border border-black/[0.08] rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('config')}
          className="w-full px-5 py-3.5 text-[12px] font-semibold text-gray-700 bg-black/[0.02] hover:bg-black/[0.04] flex justify-between items-center transition-colors"
        >
          <span>Config Snapshot</span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${
              expandedSections.has('config') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {expandedSections.has('config') && (
          <div className="border-t border-black/[0.05] p-5">
            <JsonViewer data={analysis.config_snapshot} />
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => {
            const apiBase =
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            window.open(
              `${apiBase}/v1/analyses/${analysis.analysis_id}/demo-pack.txt`,
              '_blank'
            )
          }}
          className="w-full py-2.5 px-4 rounded-lg border border-black/[0.12] bg-white text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ↗ Export Demo Pack
        </button>
        <button
          onClick={() => {
            const apiBase =
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            window.open(
              `${apiBase}/v1/analyses/${analysis.analysis_id}`,
              '_blank'
            )
          }}
          className="w-full py-2.5 px-4 rounded-lg border border-black/[0.12] bg-white text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {'{ }'} View Raw JSON
        </button>
      </div>
    </div>
  )
}
