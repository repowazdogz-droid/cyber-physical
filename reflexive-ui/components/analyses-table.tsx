'use client'

import { type AnalysisListItem } from '@/lib/api'
import { ConfidenceRing } from './confidence-ring'
import { TypeBadge } from './type-badge'
import { ClaimBar } from './claim-bar'

interface AnalysesTableProps {
  analyses: AnalysisListItem[]
  onRowClick: (id: string) => void
  getBand: (score: number | null) => string
  formatDate: (date: string) => string
  showIncomplete: boolean
}

function isIncomplete(analysis: AnalysisListItem): boolean {
  return (
    analysis.confidence_score === null ||
    (analysis.convergence_count === 0 &&
      analysis.divergence_count === 0 &&
      analysis.orphan_count === 0)
  )
}

function getBandTextColor(band: string): string {
  switch (band) {
    case 'Low':
      return 'text-band-low-text'
    case 'Moderate':
      return 'text-band-moderate-text'
    case 'High':
      return 'text-band-high-text'
    case 'Very High':
      return 'text-band-very-high-text'
    default:
      return 'text-muted'
  }
}

export function AnalysesTable({
  analyses,
  onRowClick,
  getBand,
  formatDate,
  showIncomplete,
}: AnalysesTableProps) {
  const filteredAnalyses = showIncomplete
    ? analyses
    : analyses.filter((a) => !isIncomplete(a))

  if (filteredAnalyses.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-black/[0.06] py-16 text-center">
        <p className="text-muted">
          {showIncomplete ? 'No analyses found' : 'No complete analyses found'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-black/[0.06] overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_100px_160px_72px] items-center gap-6 px-7 py-3 border-b border-black/[0.06]">
        <div className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-muted">
          Stimulus
        </div>
        <div className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-muted">
          Claims
        </div>
        <div className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-muted">
          Confidence
        </div>
        <div></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-black/[0.06]">
        {filteredAnalyses.map((analysis, idx) => {
          const band = getBand(analysis.confidence_score)
          const date = new Date(analysis.created_at)
          const formattedDate = formatDate(analysis.created_at)
          const dateStr = formattedDate.split(',')[0]
          const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })

          // Truncate stimulus text to ~120 chars
          const stimulusDisplay = analysis.stimulus_text
            ? analysis.stimulus_text.length > 120
              ? analysis.stimulus_text.substring(0, 120) + '…'
              : analysis.stimulus_text
            : `Analysis ${analysis.analysis_id.substring(0, 8)}…`

          return (
            <div
              key={analysis.analysis_id}
              onClick={() => onRowClick(analysis.analysis_id)}
              className="group grid grid-cols-[1fr_100px_160px_72px] items-center gap-6 px-7 py-5 hover:bg-black/[0.015] transition-colors cursor-pointer animate-fade-slide-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Column 1: Stimulus */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  {analysis.stimulus_type && (
                    <TypeBadge type={analysis.stimulus_type} />
                  )}
                  <span className="font-mono text-[11px] text-muted">
                    {analysis.analysis_id.substring(0, 8)}…
                  </span>
                </div>
                <div className="text-[14px] font-medium text-foreground overflow-hidden whitespace-nowrap text-ellipsis">
                  {stimulusDisplay}
                </div>
                <div className="text-[12px] text-muted">
                  {dateStr} · {timeStr} · {analysis.lens_count} lenses
                </div>
              </div>

              {/* Column 2: Claim Bar */}
              <ClaimBar
                convergence={analysis.convergence_count}
                divergence={analysis.divergence_count}
                orphan={analysis.orphan_count}
              />

              {/* Column 3: Confidence */}
              {analysis.confidence_score !== null ? (
                <div className="flex items-center gap-3">
                  <ConfidenceRing score={analysis.confidence_score} size={44} />
                  <div className="flex flex-col">
                    <span
                      className={`font-mono text-[12px] font-semibold ${getBandTextColor(band)}`}
                    >
                      {band}
                    </span>
                    <span className="text-[11px] text-muted">confidence</span>
                  </div>
                </div>
              ) : (
                <div className="text-muted text-[12px]">—</div>
              )}

              {/* Column 4: Arrow */}
              <div className="text-[18px] text-gray-300 group-hover:text-foreground transition-all group-hover:translate-x-[2px]">
                →
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
