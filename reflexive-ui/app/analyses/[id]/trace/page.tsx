'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, type DemoPackResponse } from '@/lib/api'
import { ReasoningGraph } from '@/components/reasoning-graph'
import { StructuralThesis } from '@/components/structural-thesis'
import { InspectionPanel } from '@/components/inspection-panel'

type SelectedNode = 
  | { type: 'lens'; id: string; lens: string }
  | { type: 'claim'; id: string; claimId: string }
  | { type: 'evidence'; id: string; evidenceId: string }
  | { type: 'convergence'; id: string; themeId: string }
  | { type: 'divergence'; id: string; themeId: string }
  | null

export default function ReasoningTracePage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null)

  const {
    data: analysis,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => api.getAnalysis(analysisId),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted font-mono text-sm">Loading reasoning trace...</div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground font-semibold mb-2">Error loading analysis</div>
          <button
            onClick={() => router.push(`/analyses/${analysisId}`)}
            className="text-sm text-muted hover:text-foreground"
          >
            ← Back to analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/analyses/${analysisId}`)}
            className="text-xs text-muted hover:text-foreground font-mono"
          >
            ← Analysis
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="font-mono text-xs text-foreground font-semibold">
            REASONING TRACE
          </div>
          <div className="font-mono text-[10px] text-muted">
            {analysisId.substring(0, 8)}...
          </div>
        </div>
        {analysis.summary.confidence_score !== null && (
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-muted">Confidence:</div>
            <div className="font-mono text-xs font-semibold text-foreground">
              {(analysis.summary.confidence_score * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Reasoning Graph */}
        <div className="w-[40%] border-r border-border bg-surface">
          <ReasoningGraph
            analysis={analysis}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
        </div>

        {/* Center: Structural Thesis */}
        <div className="w-[35%] border-r border-border bg-surface overflow-y-auto">
          <StructuralThesis analysis={analysis} />
        </div>

        {/* Right: Inspection Panel */}
        <div className="w-[25%] bg-surface overflow-y-auto">
          <InspectionPanel
            analysis={analysis}
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </div>
  )
}
