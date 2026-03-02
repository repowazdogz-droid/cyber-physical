'use client'

import { ReactNode } from 'react'
import { ReadingMode } from './uiTokens'
import { CARD_PADDING, SPACING } from './uiTokens'

interface UiCardProps {
  children: ReactNode
  readingMode?: ReadingMode
  calmMode?: boolean
  style?: React.CSSProperties
  variant?: string
}

export default function UiCard({
  children,
  readingMode = 'standard',
  calmMode = false,
  style
}: UiCardProps) {
  const mode = calmMode ? 'calm' : readingMode
  
  return (
    <div
      style={{
        padding: CARD_PADDING[mode],
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '12px',
        marginBottom: SPACING[mode].md,
        maxWidth: '100%',
        ...style
      }}
    >
      {children}
    </div>
  )
}










