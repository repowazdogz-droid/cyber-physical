'use client'

import { useState, useEffect } from 'react'
import { ViewerRole } from '../../../spine/learning/platform/store/StoreTypes'
import TeacherActionCard from '../components/TeacherActionCard'

interface TeacherSummary {
  latestContext?: {
    subject: string
    topic: string
    objective: string
  }
  lastSessions: Array<{
    sessionId: string
    goal: {
      subject: string
      topic: string
      objective: string
    }
    sessionSummary?: string[]
    lastCheckpoint?: string
    selfCheck?: {
      timestamp: string
      status: "Ready" | "NotYet" | "Unsure"
    }
    createdAtIso: string
  }>
  skillBandsSummary?: Array<{
    skillId: string
    confidenceBand: "Low" | "Medium" | "High"
    exposures: number
  }>
  selfCheckTrend?: Array<{
    timestamp: string
    status: "Ready" | "NotYet" | "Unsure"
  }>
  visibilityNote?: string
}

export default function TeacherHome() {
  const [learnerId, setLearnerId] = useState('')
  const [role, setRole] = useState<ViewerRole>('Teacher')
  const [optInTeacherAccess, setOptInTeacherAccess] = useState(false)
  const [summary, setSummary] = useState<TeacherSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calmMode, setCalmMode] = useState(true)

  const handleLoad = async () => {
    if (!learnerId.trim()) {
      setError('Please enter a learner ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        learnerId: learnerId.trim(),
        role,
        optInTeacherAccess: optInTeacherAccess.toString()
      })

      const response = await fetch(`/api/learning/teacher/summary?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load summary')
      }

      const result = await response.json()
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action: string) => {
    // Actions would be sent to learner or stored as suggestions
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Action:', action)
    }
    // In a real implementation, this would trigger a message to the learner
    // or store a suggestion in the session
  }

  return (
    <div style={{ padding: calmMode ? '1.5rem' : '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: calmMode ? '1.5rem' : '1.8rem', margin: 0 }}>Teacher Dashboard</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={calmMode}
            onChange={(e) => setCalmMode(e.target.checked)}
          />
          Calm Mode
        </label>
      </div>

      {/* Search Form */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: calmMode ? '1fr' : '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Learner ID
            </label>
            <input
              type="text"
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              placeholder="learner-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLoad()
                }
              }}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Viewer Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ViewerRole)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem' }}
            >
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Institution">Institution</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={optInTeacherAccess}
                onChange={(e) => setOptInTeacherAccess(e.target.checked)}
              />
              Opt-in Teacher Access (for adults)
            </label>
          </div>
          <button
            onClick={handleLoad}
            disabled={loading || !learnerId.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading || !learnerId.trim() ? '#ccc' : '#000',
              color: '#fff',
              border: 'none',
              cursor: loading || !learnerId.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c00',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {/* Access Denied */}
      {summary?.visibilityNote && summary.visibilityNote.includes('denied') && (
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: '#666' }}>
            {summary.visibilityNote}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            For adult learners, teacher access requires opt-in from the learner.
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      {summary && !summary.visibilityNote && (
        <div>
          {/* Today's Focus */}
          {summary.latestContext && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f0f7ff',
              border: '2px solid #b3d9ff',
              borderRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Today&apos;s Focus
              </h2>
              <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                <div><strong>Subject:</strong> {summary.latestContext.subject}</div>
                <div><strong>Topic:</strong> {summary.latestContext.topic}</div>
                <div><strong>Objective:</strong> {summary.latestContext.objective}</div>
              </div>
            </div>
          )}

          {/* Last Checkpoint */}
          {summary.lastSessions.length > 0 && summary.lastSessions[0].sessionSummary && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Last Checkpoint
              </h2>
              {summary.lastSessions[0].lastCheckpoint && (
                <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                  <strong>Step:</strong> {summary.lastSessions[0].lastCheckpoint}
                </div>
              )}
              {summary.lastSessions[0].sessionSummary && (
                <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
                  {summary.lastSessions[0].sessionSummary.map((bullet, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Self-Check Trend */}
          {summary.selfCheckTrend && summary.selfCheckTrend.length > 0 && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Self-Check Trend (Last {summary.selfCheckTrend.length})
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {summary.selfCheckTrend.map((check, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: check.status === 'Ready' ? '#e8f5e9' : check.status === 'NotYet' ? '#fff3e0' : '#f3e5f5',
                      border: `1px solid ${check.status === 'Ready' ? '#4caf50' : check.status === 'NotYet' ? '#ff9800' : '#9c27b0'}`,
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    {check.status === 'NotYet' ? 'Not yet' : check.status}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Bands Summary */}
          {summary.skillBandsSummary && summary.skillBandsSummary.length > 0 && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Skill Bands (No Scores)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {summary.skillBandsSummary.map((skill) => (
                  <div
                    key={skill.skillId}
                    style={{
                      padding: '0.75rem',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{skill.skillId}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Band: {skill.confidenceBand} | Exposures: {skill.exposures}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Next Actions */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              Suggested Next Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: calmMode ? 'column' : 'row', gap: '1rem', flexWrap: 'wrap' }}>
              <TeacherActionCard
                title="Ask 1 Question"
                description="Encourage deeper thinking"
                onAction={() => handleAction('ask_question')}
                actionLabel="Suggest: Ask 1 question"
                calmMode={calmMode}
              />
              <TeacherActionCard
                title="Do a Worked Example"
                description="Show step-by-step process"
                onAction={() => handleAction('worked_example')}
                actionLabel="Suggest: Worked example"
                calmMode={calmMode}
              />
              <TeacherActionCard
                title="Short Review"
                description="Quick recap of key points"
                onAction={() => handleAction('short_review')}
                actionLabel="Suggest: Short review"
                calmMode={calmMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!summary && !loading && (
        <div style={{ padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
          <p><strong>Instructions:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', lineHeight: '1.8' }}>
            <li>Enter a learner ID to view their dashboard</li>
            <li>Select your role (Teacher, Parent, or Institution)</li>
            <li>For adults, check &quot;Opt-in Teacher Access&quot; to allow teacher viewing</li>
            <li>Minors are visible to parents and teachers by default</li>
          </ul>
        </div>
      )}
    </div>
  )
}


