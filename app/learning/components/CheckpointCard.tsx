'use client'

import { useState } from 'react'

interface CheckpointCardProps {
  title: string
  why?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  calmMode?: boolean
}

export default function CheckpointCard({
  title,
  why,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  calmMode = false
}: CheckpointCardProps) {
  const [showWhy, setShowWhy] = useState(false)

  return (
    <div style={{
      padding: calmMode ? '1rem' : '1.25rem',
      background: '#f0f7ff',
      border: '2px solid #b3d9ff',
      borderRadius: '12px',
      marginBottom: calmMode ? '1rem' : '1.5rem'
    }}>
      <div style={{ marginBottom: calmMode ? '0.75rem' : '1rem' }}>
        <h3 style={{
          fontSize: calmMode ? '1rem' : '1.1rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          Checkpoint: {title}
        </h3>
        {why && (
          <button
            onClick={() => setShowWhy(!showWhy)}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: '1px solid #b3d9ff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#0066cc'
            }}
          >
            {showWhy ? 'Hide why' : 'Why this matters'}
          </button>
        )}
        {showWhy && why && (
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: '#666',
            lineHeight: '1.5'
          }}>
            {why}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexDirection: calmMode ? 'column' : 'row' }}>
        <button
          onClick={onPrimary}
          style={{
            flex: calmMode ? 'none' : 1,
            padding: calmMode ? '0.875rem 1.5rem' : '1rem 2rem',
            background: '#0066cc',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: calmMode ? '0.9rem' : '1rem',
            fontWeight: 'bold',
            width: calmMode ? '100%' : 'auto'
          }}
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            style={{
              flex: calmMode ? 'none' : 1,
              padding: calmMode ? '0.875rem 1.5rem' : '1rem 2rem',
              background: '#fff',
              color: '#0066cc',
              border: '1px solid #0066cc',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: calmMode ? '0.9rem' : '1rem',
              width: calmMode ? '100%' : 'auto'
            }}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}








































