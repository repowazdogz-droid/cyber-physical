'use client'

import { type DemoPackResponse } from '@/lib/api'

interface ExecutiveSummaryProps {
  analysis: DemoPackResponse
}

export function ExecutiveSummary({ analysis }: ExecutiveSummaryProps) {
  // Parse exec_summary line by line (matches demo-pack.txt format exactly)
  const lines = analysis.exec_summary.split('\n').filter((line) => line.trim())

  // Extract key lines
  const confidenceLine = lines.find((l) => l.startsWith('Confidence:'))
  const countsLine = lines.find((l) => l.startsWith('Counts:'))
  const evidenceLine = lines.find((l) => l.startsWith('Evidence:'))
  const schemaLine = lines.find((l) => l.startsWith('Schema:'))
  const modelsLine = lines.find((l) => l.startsWith('Models:'))
  const configLine = lines.find((l) => l.startsWith('Config:'))

  // Find REDLINES section start
  const redlinesStartIdx = lines.findIndex((l) =>
    l.toUpperCase().includes('REDLINES')
  )
  const summaryLines =
    redlinesStartIdx >= 0 ? lines.slice(0, redlinesStartIdx) : lines

  // Extract interpretation line if present
  const interpretationLine = summaryLines.find((l) =>
    l.startsWith('Interpretation:')
  )

  // Extract Key Agreements/Disagreements
  const agreementsStartIdx = summaryLines.findIndex((l) =>
    l.includes('Key Agreements')
  )
  const disagreementsStartIdx = summaryLines.findIndex((l) =>
    l.includes('Key Disagreements')
  )

  const agreements: string[] = []
  const disagreements: string[] = []

  if (agreementsStartIdx >= 0) {
    let idx = agreementsStartIdx + 1
    while (
      idx < summaryLines.length &&
      summaryLines[idx].trim().startsWith('•')
    ) {
      agreements.push(summaryLines[idx].trim().substring(1).trim())
      idx++
    }
  }

  if (disagreementsStartIdx >= 0) {
    let idx = disagreementsStartIdx + 1
    while (
      idx < summaryLines.length &&
      summaryLines[idx].trim().startsWith('•')
    ) {
      disagreements.push(summaryLines[idx].trim().substring(1).trim())
      idx++
    }
  }

  // Generate REDLINES section text (matching demo-pack.txt format)
  const generateRedlinesText = (redlines: typeof analysis.redlines): string => {
    if (redlines.length === 0) return ''
    
    const lines: string[] = []
    lines.push('REDLINES')
    lines.push('─'.repeat(40))
    lines.push('')

    let bulletCount = 0
    const maxBullets = 8
    const maxTotalLines = 25

    for (const redline of redlines) {
      if (bulletCount >= maxBullets) break

      if (redline.type === 'convergence') {
        const claimIdsStr = redline.claim_ids.slice(0, 3).join(',')
        const more = redline.claim_ids.length > 3 ? '...' : ''
        lines.push(
          `• [CONVERGENCE] ${redline.theme || 'Unlabeled'} (claims: ${claimIdsStr}${more})`
        )
        bulletCount++
      } else if (redline.type === 'divergence') {
        const claimIdsStr = redline.claim_ids.slice(0, 3).join(',')
        const more = redline.claim_ids.length > 3 ? '...' : ''
        lines.push(
          `• [DIVERGENCE] ${redline.theme || 'Unlabeled'} (claims: ${claimIdsStr}${more})`
        )
        bulletCount++
      } else if (redline.type === 'evidence_gap') {
        for (const claimId of redline.claim_ids.slice(0, 3)) {
          if (bulletCount >= maxBullets) break
          lines.push(`• [EVIDENCE GAP] claim ${claimId} has no linked evidence`)
          bulletCount++
        }
      }
    }

    return lines.join('\n')
  }

  const redlinesText = generateRedlinesText(analysis.redlines)

  return (
    <div className="border border-gray-200 bg-white p-8">
      <h2 className="mb-6 text-xl font-semibold text-black">
        Executive Summary
      </h2>

      {/* Render exec_summary exactly like demo-pack.txt */}
      <div className="space-y-4 font-mono text-sm text-black">
        {confidenceLine && (
          <div className="text-lg font-semibold">{confidenceLine}</div>
        )}
        {countsLine && <div>{countsLine}</div>}
        {evidenceLine && <div>{evidenceLine}</div>}
        {schemaLine && <div className="text-xs text-gray-600">{schemaLine}</div>}
        {modelsLine && <div className="text-xs text-gray-600">{modelsLine}</div>}
        {interpretationLine && (
          <div className="text-sm text-gray-700 italic">
            {interpretationLine}
          </div>
        )}
        {configLine && <div className="text-xs text-gray-600">{configLine}</div>}
        
        {/* REDLINES section */}
        {redlinesText && (
          <div className="mt-6 space-y-2 whitespace-pre-line">
            {redlinesText.split('\n').map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith('REDLINES') || line.startsWith('─')
                    ? 'font-semibold'
                    : ''
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Agreements/Disagreements */}
      {(agreements.length > 0 || disagreements.length > 0) && (
        <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
          {agreements.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-600">
                Key Agreements
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-900">
                {agreements.map((agreement, idx) => (
                  <li key={idx}>{agreement}</li>
                ))}
              </ul>
            </div>
          )}
          {disagreements.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-600">
                Key Disagreements
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-900">
                {disagreements.map((disagreement, idx) => (
                  <li key={idx}>{disagreement}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
