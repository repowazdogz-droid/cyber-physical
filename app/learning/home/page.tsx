'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadPersistedState, clearPersistedState, savePersistedState, AccessibilityPreferences } from '../persist/LearningPersist'
import { getGuidedPath } from '../paths/pathLibrary'
import { getProgressSummary, getCurrentStep } from '../paths/GuidedPathRunner'
import PrimaryActionBar from '../ui/PrimaryActionBar'
import UiCard from '../ui/UiCard'

export default function LearningHome() {
  const router = useRouter()
  const [persistedState, setPersistedState] = useState(loadPersistedState())
  const [showDataVisibility, setShowDataVisibility] = useState(false)
  const [calmMode, setCalmMode] = useState(true)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const state = loadPersistedState()
    setPersistedState(state)
    
    // Load accessibility preferences
    if (state?.accessibility) {
      setCalmMode(state.accessibility.calmMode)
      setHighContrast(state.accessibility.highContrast)
      setReducedMotion(state.accessibility.reducedMotion)
    } else if (state) {
      setCalmMode(state.lastContext.isMinor)
    }
  }, [])
  
  // Apply accessibility preferences to document
  useEffect(() => {
    const container = document.documentElement
    if (highContrast) {
      container.classList.add('high-contrast')
    } else {
      container.classList.remove('high-contrast')
    }
    
    if (reducedMotion) {
      container.classList.add('reduced-motion')
    } else {
      container.classList.remove('reduced-motion')
    }
  }, [highContrast, reducedMotion])
  
  // Save accessibility preferences when they change
  useEffect(() => {
    const state = loadPersistedState()
    if (state) {
      savePersistedState({
        ...state,
        accessibility: {
          calmMode,
          highContrast,
          reducedMotion
        }
      })
    }
  }, [calmMode, highContrast, reducedMotion])

  const handleContinue = () => {
    if (persistedState) {
      router.push('/learning')
    }
  }

  const handleStartNew = () => {
    router.push('/learning/start')
  }

  const handleClearData = () => {
    if (confirm('Clear all saved progress? This cannot be undone.')) {
      clearPersistedState()
      setPersistedState(null)
      router.push('/learning/start')
    }
  }

  if (!persistedState) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '2rem' }}>Welcome</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Start your learning journey
        </p>
        <button
          onClick={handleStartNew}
          style={{
            padding: '1rem 2rem',
            background: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Start Learning
        </button>
      </div>
    )
  }

  // Get path info if available
  const path = persistedState.pathProgress
    ? getGuidedPath(
        persistedState.lastContext.ageBand,
        persistedState.lastContext.missionId as any,
        persistedState.lastContext.topic.toLowerCase().replace(/\s+/g, '-')
      )
    : null

  const progressText = path && persistedState.pathProgress
    ? getProgressSummary(persistedState.pathProgress, path)
    : null

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Today&apos;s Plan</h1>
        
        {/* Accessibility toggles */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={calmMode}
              onChange={(e) => setCalmMode(e.target.checked)}
            />
            Calm
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
            High Contrast
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            Reduced Motion
          </label>
        </div>
      </div>

      {/* Continue Section */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        background: '#f0f7ff',
        border: '1px solid #b3d9ff',
        borderRadius: '12px'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          {persistedState.lastContext.subject} → {persistedState.lastContext.topic}
        </h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          {persistedState.lastContext.objective}
        </p>
        {progressText && (
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
            {progressText}
          </p>
        )}
        <PrimaryActionBar
          primaryLabel="Continue"
          onPrimary={handleContinue}
          secondaryLabel="Start New Session"
          onSecondary={handleStartNew}
          tertiary={
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#666' }}>
                Data & Visibility
              </summary>
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  {persistedState.lastContext.isMinor ? (
                    <>Minor mode: Parent/Teacher can view your sessions. Your data is stored locally.</>
                  ) : (
                    <>Adult mode: Your sessions are private by default. Teachers can view only if you opt in.</>
                  )}
                </p>
                <button
                  onClick={handleClearData}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}
                >
                  Clear All Data
                </button>
              </div>
            </details>
          }
          readingMode="standard"
          calmMode={calmMode}
        />
        
        {/* Next step card for guided paths */}
        {path && persistedState.pathProgress && !persistedState.pathProgress.pathCompleted && (
          <UiCard readingMode="standard" calmMode={calmMode} style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              {getProgressSummary(persistedState.pathProgress, path)}
            </div>
            {getCurrentStep(persistedState.pathProgress, path) && (
              <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {getCurrentStep(persistedState.pathProgress, path)?.title}
              </div>
            )}
            <button
              onClick={handleContinue}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: '#0066cc',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Next step
            </button>
          </UiCard>
        )}
      </div>

      {/* Recent Activity (if any) */}
      {persistedState.lastTurns && persistedState.lastTurns.length > 0 && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Recent Activity</h3>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {persistedState.lastTurns.slice(-3).map((turn, i) => (
              <div key={i} style={{ marginBottom: '0.5rem', paddingLeft: '1rem' }}>
                <strong>{turn.role === 'learner' ? 'You' : 'Tutor'}:</strong> {turn.message.substring(0, 60)}...
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

