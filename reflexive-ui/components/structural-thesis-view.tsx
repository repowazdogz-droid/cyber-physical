'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { DemoPackResponse } from '@/lib/api'
import { ConfidenceRing } from './confidence-ring'
import { DecisionPosture } from './decision-posture'
import { StructuralThesis } from './structural-thesis'
import { ReasoningGraph } from './reasoning-graph'
import { RedlinesSection } from './redlines-section'

interface StructuralThesisViewProps {
  analysis: DemoPackResponse
  analysisId: string
}

export function StructuralThesisView({ analysis, analysisId }: StructuralThesisViewProps) {
  const router = useRouter()
  const [showReasoning, setShowReasoning] = useState(false)
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false)
  const developerMenuRef = useRef<HTMLDivElement>(null)

  // Close developer menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (developerMenuRef.current && !developerMenuRef.current.contains(event.target as Node)) {
        setShowDeveloperMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const synthesis = analysis.synthesis || {}
  const confidenceScore = analysis.summary.confidence_score
  const convergenceCount = analysis.summary.convergence_count || 0
  const divergenceCount = analysis.summary.divergence_count || 0

  // Parse exec_summary for thesis text
  const execSummary = analysis.exec_summary || ''
  const lines = execSummary.split('\n').filter((l) => l.trim())
  
  const interpretationIdx = lines.findIndex((l) =>
    l.toLowerCase().includes('interpretation') || l.toLowerCase().includes('thesis')
  )
  const thesisText = interpretationIdx >= 0
    ? lines.slice(interpretationIdx + 1).join(' ').trim()
    : execSummary.split('REDLINES')[0].trim()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/analyses')}
            className="text-sm text-muted hover:text-foreground"
          >
            ← Decision History
          </button>
          
          {/* Developer menu */}
          <div className="relative" ref={developerMenuRef}>
            <button
              onClick={() => setShowDeveloperMenu(!showDeveloperMenu)}
              className="text-xs text-muted hover:text-foreground font-mono"
            >
              Developer
            </button>
            {showDeveloperMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-black/[0.12] rounded-lg shadow-lg py-2 min-w-[200px] z-10">
                <button
                  onClick={() => {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                    window.open(`${apiBase}/v1/analyses/${analysisId}`, '_blank')
                    setShowDeveloperMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  View Raw Analysis
                </button>
                <button
                  onClick={() => {
                    router.push(`/analyses/${analysisId}/trace`)
                    setShowDeveloperMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Reasoning Trace View
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Primary: Structural Thesis */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="font-mono text-[11px] text-muted uppercase tracking-wider mb-3">
              DECISION SUMMARY
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight max-w-4xl mx-auto">
              {thesisText || 'Structural analysis complete'}
            </h1>
          </div>

          {/* Confidence + Decision Posture */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center p-8 border border-black/[0.06] rounded-xl bg-white">
              <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-4">
                CONFIDENCE
              </div>
              {confidenceScore !== null && (
                <>
                  <ConfidenceRing score={confidenceScore} size={120} />
                  <div className="mt-4 text-2xl font-bold text-foreground">
                    {(confidenceScore * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted mt-2">
                    {analysis.summary.band} Confidence
                  </div>
                </>
              )}
            </div>

            <DecisionPosture analysis={analysis} />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <div className="text-center p-6 border border-black/[0.06] rounded-lg bg-white">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {convergenceCount}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Convergences
              </div>
            </div>
            <div className="text-center p-6 border border-black/[0.06] rounded-lg bg-white">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {divergenceCount}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Divergences
              </div>
            </div>
            <div className="text-center p-6 border border-black/[0.06] rounded-lg bg-white">
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {analysis.summary.orphan_count || 0}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Orphan Claims
              </div>
            </div>
          </div>
        </div>

        {/* Secondary: Supporting Reasoning (Collapsible) */}
        <div className="border-t border-black/[0.06] pt-8">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full text-left mb-6 flex items-center justify-between group"
          >
            <div>
              <div className="font-mono text-[11px] text-muted uppercase tracking-wider mb-1">
                REASONING TRACE
              </div>
              <div className="text-lg font-semibold text-foreground">
                Evidence Base & Analysis Structure
              </div>
            </div>
            <div className="text-muted group-hover:text-foreground transition-colors">
              {showReasoning ? '▼' : '▶'}
            </div>
          </button>

          {showReasoning && (
            <div className="space-y-8">
              <RedlinesSection redlines={analysis.redlines} />
              
              <div className="border border-black/[0.06] rounded-xl bg-white p-6">
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-4">
                  REASONING GRAPH
                </div>
                <div className="h-[600px]">
                  <ReasoningGraph
                    analysis={analysis}
                    selectedNode={null}
                    onNodeSelect={() => {}}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
