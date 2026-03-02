'use client'

import { ReadingMode } from './uiTokens'

interface ReadingModeToggleProps {
  value: ReadingMode
  onChange: (mode: ReadingMode) => void
  isMinor?: boolean
  calmMode?: boolean
}

export default function ReadingModeToggle({
  value,
  onChange,
  isMinor = false,
  calmMode = false
}: ReadingModeToggleProps) {
  // Minors and calm mode users default to calm, can't access dense
  const canUseDense = !isMinor && !calmMode
  
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <label style={{ fontSize: '0.85rem', color: '#666' }}>Reading Mode:</label>
      <div style={{ display: 'flex', gap: '0.25rem', border: '1px solid #ddd', borderRadius: '6px', padding: '0.25rem' }}>
        <button
          onClick={() => onChange('calm')}
          style={{
            padding: '0.5rem 0.75rem',
            background: value === 'calm' ? '#0066cc' : 'transparent',
            color: value === 'calm' ? '#fff' : '#666',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: value === 'calm' ? 'bold' : 'normal'
          }}
        >
          Calm
        </button>
        <button
          onClick={() => onChange('standard')}
          style={{
            padding: '0.5rem 0.75rem',
            background: value === 'standard' ? '#0066cc' : 'transparent',
            color: value === 'standard' ? '#fff' : '#666',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: value === 'standard' ? 'bold' : 'normal'
          }}
        >
          Standard
        </button>
        {canUseDense && (
          <button
            onClick={() => onChange('dense')}
            style={{
              padding: '0.5rem 0.75rem',
              background: value === 'dense' ? '#0066cc' : 'transparent',
              color: value === 'dense' ? '#fff' : '#666',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: value === 'dense' ? 'bold' : 'normal'
            }}
          >
            Dense
          </button>
        )}
      </div>
    </div>
  )
}








































