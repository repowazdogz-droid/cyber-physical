'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { AnalysesTable } from '@/components/analyses-table'
import { useState } from 'react'

function getBand(score: number | null): string {
  if (score === null || score === undefined) return 'Unknown'
  if (score < 0.25) return 'Low'
  if (score < 0.50) return 'Moderate'
  if (score < 0.75) return 'High'
  return 'Very High'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HistoryPage() {
  const router = useRouter()
  const [showIncomplete, setShowIncomplete] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(20)

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analyses'],
    queryFn: api.listAnalyses,
  })

  const handleRowClick = (analysisId: string) => {
    router.push(`/analyses/${analysisId}`)
  }

  const completeAnalyses = analyses?.filter(
    (a) =>
      a.confidence_score !== null &&
      !(a.convergence_count === 0 && a.divergence_count === 0 && a.orphan_count === 0)
  ) || []
  const incompleteAnalyses = analyses?.filter(
    (a) =>
      a.confidence_score === null ||
      (a.convergence_count === 0 && a.divergence_count === 0 && a.orphan_count === 0)
  ) || []
  const highCount = completeAnalyses.filter(
    (a) => a.confidence_score !== null && a.confidence_score >= 0.75
  ).length

  // Client-side pagination (API doesn't support limit/offset yet)
  const displayedAnalyses = (showIncomplete ? analyses : completeAnalyses) || []
  const paginatedAnalyses = displayedAnalyses.slice(0, displayLimit)
  const hasMore = displayedAnalyses.length > displayLimit

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">History</h1>
            <p className="mt-1 text-[13px] text-muted">
              {analyses?.length || 0} analyses · {highCount} high confidence
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowIncomplete(!showIncomplete)}
              className="text-[12px] text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              {showIncomplete
                ? `Hide incomplete`
                : `Show incomplete (${incompleteAnalyses.length})`}
            </button>
          </div>
        </div>

        {/* Clear test data notice */}
        {(analyses?.length || 0) > 50 && (
          <div className="text-[12px] text-muted mb-4">
            Showing {analyses?.length || 0} analyses. During development, you
            can clear test data from the database directly.
          </div>
        )}

        {isLoading ? (
          <AnalysesTableSkeleton />
        ) : (
          <>
            <AnalysesTable
              analyses={paginatedAnalyses}
              onRowClick={handleRowClick}
              getBand={getBand}
              formatDate={formatDate}
              showIncomplete={showIncomplete}
            />
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setDisplayLimit(displayLimit + 20)}
                  className="text-[13px] font-medium text-muted hover:text-foreground px-4 py-2 border border-black/[0.08] rounded-lg hover:bg-black/[0.02] transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AnalysesTableSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-black/[0.06] overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_160px_72px] items-center gap-6 px-7 py-3 border-b border-black/[0.06]">
        {['Stimulus', 'Claims', 'Confidence', ''].map((header) => (
          <div
            key={header}
            className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-muted"
          >
            {header}
          </div>
        ))}
      </div>
      <div className="divide-y divide-black/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_100px_160px_72px] items-center gap-6 px-7 py-5 animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
              <div className="h-3 w-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-11 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
