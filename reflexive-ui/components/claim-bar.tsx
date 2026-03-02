'use client'

interface ClaimBarProps {
  convergence: number
  divergence: number
  orphan: number
  className?: string
}

export function ClaimBar({
  convergence,
  divergence,
  orphan,
  className = '',
}: ClaimBarProps) {
  const total = convergence + divergence + orphan
  if (total === 0) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="h-1 rounded-full overflow-hidden bg-black/[0.04]"></div>
        <div className="flex gap-3 font-mono text-[11px] text-muted">
          <span>● 0</span>
        </div>
      </div>
    )
  }

  const convergencePct = (convergence / total) * 100
  const divergencePct = (divergence / total) * 100
  const orphanPct = (orphan / total) * 100

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="h-1 rounded-full overflow-hidden bg-black/[0.04] flex">
        {convergence > 0 && (
          <div
            className="bg-convergence"
            style={{ width: `${convergencePct}%` }}
          />
        )}
        {divergence > 0 && (
          <div
            className="bg-divergence"
            style={{ width: `${divergencePct}%` }}
          />
        )}
        {orphan > 0 && (
          <div
            className="bg-gray-400"
            style={{ width: `${orphanPct}%` }}
          />
        )}
      </div>
      <div className="flex gap-3 font-mono text-[11px] text-muted">
        {convergence > 0 && (
          <span className="text-convergence">● {convergence}</span>
        )}
        {divergence > 0 && (
          <span className="text-divergence">● {divergence}</span>
        )}
        {orphan > 0 && <span>● {orphan}</span>}
      </div>
    </div>
  )
}
