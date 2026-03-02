'use client'

import { ReactNode } from 'react'
import { ReadingMode } from './uiTokens'
import { TAP_MIN_PX, SPACING } from './uiTokens'

interface PrimaryActionBarProps {
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  tertiary?: ReactNode
  readingMode?: ReadingMode
  calmMode?: boolean
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
}

export default function PrimaryActionBar({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  tertiary,
  readingMode = 'standard',
  calmMode = false,
  primaryDisabled = false,
  secondaryDisabled = false
}: PrimaryActionBarProps) {
  const mode = calmMode ? 'calm' : readingMode
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: calmMode ? 'column' : 'row',
      gap: SPACING[mode].sm,
      marginTop: SPACING[mode].md
    }}>
      <button
        onClick={onPrimary}
        disabled={primaryDisabled}
        style={{
          flex: calmMode ? 'none' : 1,
          minHeight: `${TAP_MIN_PX}px`,
          padding: `${SPACING[mode].sm} ${SPACING[mode].md}`,
          background: primaryDisabled ? '#ccc' : '#0066cc',
          color: '#fff',
          border: 'none',
          cursor: primaryDisabled ? 'not-allowed' : 'pointer',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          width: calmMode ? '100%' : 'auto'
        }}
      >
        {primaryLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button
          onClick={onSecondary}
          disabled={secondaryDisabled}
          style={{
            flex: calmMode ? 'none' : 1,
            minHeight: `${TAP_MIN_PX}px`,
            padding: `${SPACING[mode].sm} ${SPACING[mode].md}`,
            background: secondaryDisabled ? '#f5f5f5' : '#fff',
            color: secondaryDisabled ? '#999' : '#0066cc',
            border: `1px solid ${secondaryDisabled ? '#ddd' : '#0066cc'}`,
            cursor: secondaryDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            fontSize: '1rem',
            width: calmMode ? '100%' : 'auto'
          }}
        >
          {secondaryLabel}
        </button>
      )}
      {tertiary && (
        <div style={{ width: calmMode ? '100%' : 'auto' }}>
          {tertiary}
        </div>
      )}
    </div>
  )
}








































