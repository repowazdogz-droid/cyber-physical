'use client'

import { type DemoPackResponse } from '@/lib/api'

interface RedlinesSectionProps {
  redlines: DemoPackResponse['redlines']
}

export function RedlinesSection({ redlines }: RedlinesSectionProps) {
  if (redlines.length === 0) {
    return (
      <div className="border border-black/[0.06] rounded-xl bg-surface p-6 text-center text-muted">
        No redlines identified
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted uppercase mb-3">
        REDLINES
      </div>
      {redlines.slice(0, 8).map((redline, idx) => {
        const getConfig = () => {
          switch (redline.type) {
            case 'convergence':
              return {
                bg: 'bg-convergence/[0.06]',
                border: 'border-convergence',
                icon: '◆',
                iconColor: 'text-convergence',
                labelColor: 'text-convergence',
              }
            case 'divergence':
              return {
                bg: 'bg-divergence/[0.06]',
                border: 'border-divergence',
                icon: '◇',
                iconColor: 'text-divergence',
                labelColor: 'text-divergence',
              }
            case 'evidence_gap':
              return {
                bg: 'bg-evidence-gap/[0.06]',
                border: 'border-evidence-gap',
                icon: '○',
                iconColor: 'text-evidence-gap',
                labelColor: 'text-evidence-gap',
              }
            default:
              return {
                bg: 'bg-gray-100',
                border: 'border-gray-300',
                icon: '•',
                iconColor: 'text-gray-500',
                labelColor: 'text-gray-500',
              }
          }
        }

        const config = getConfig()
        const typeLabel = redline.type.toUpperCase().replace('_', ' ')

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 px-4 rounded-lg border-l-2 ${config.bg} ${config.border}`}
          >
            <span className={`text-[14px] ${config.iconColor}`}>{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-mono text-[10px] font-semibold tracking-[0.06em] ${config.labelColor}`}>
                  {typeLabel}
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {redline.claim_ids.length} claim{redline.claim_ids.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-[13px] text-gray-700 leading-relaxed">
                {redline.theme || redline.why_it_matters}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
