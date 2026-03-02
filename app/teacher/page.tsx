'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ViewerRole } from '../../spine/learning/platform/store/StoreTypes'

export default function TeacherPage() {
  const router = useRouter()
  const [learnerId, setLearnerId] = useState('')
  const [role, setRole] = useState<ViewerRole>('Teacher')
  const [optInTeacherAccess, setOptInTeacherAccess] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const response = await fetch(`/api/learning/teacher?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Teacher View</h1>
        <button
          onClick={() => router.push('/teacher/home')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#0066cc',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          Go to Dashboard
        </button>
      </div>

      {/* Search Form */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Learner ID
            </label>
            <input
              type="text"
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              placeholder="learner-1"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Viewer Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ViewerRole)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Institution">Institution</option>
              <option value="Learner">Learner</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
              borderRadius: '4px',
              whiteSpace: 'nowrap'
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
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div>
          {/* Visibility Policy */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '4px' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Visibility Policy</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Is Minor:</strong> {data.visibilityPolicy.isMinor ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Parent Can View:</strong> {data.visibilityPolicy.parentCanView ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Teacher Can View:</strong> {data.visibilityPolicy.teacherCanView ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Institution Can View:</strong> {data.visibilityPolicy.institutionCanView ? 'Yes' : 'No'}
              </div>
            </div>
            {data.learnerState.visibilityNote && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff3cd', borderRadius: '4px' }}>
                <strong>Note:</strong> {data.learnerState.visibilityNote}
              </div>
            )}
          </div>

          {/* Learner State */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Learner State</h2>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Learner ID:</strong> {data.learnerState.learnerProfile.learnerId}
            </div>
            {data.learnerState.learnerProfile.ageBand && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Age Band:</strong> {data.learnerState.learnerProfile.ageBand}
              </div>
            )}
            {data.learnerState.skillGraph && (
              <div>
                <strong>Skill Graph:</strong>
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '4px' }}>
                  {data.learnerState.skillGraph.skills && Object.keys(data.learnerState.skillGraph.skills).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                      {Object.entries(data.learnerState.skillGraph.skills).map(([skillId, state]: [string, any]) => (
                        <div key={skillId} style={{ padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 'bold' }}>{skillId}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            Band: {state.confidenceBand} | Exposures: {state.exposures}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No skills tracked</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sessions */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Sessions ({data.sessions.length})</h2>
            {data.sessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.sessions.map((session: any, i: number) => (
                  <div
                    key={session.sessionId}
                    style={{
                      padding: '1rem',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>Session {i + 1}:</strong> {session.sessionId}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {session.createdAtIso}
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Goal:</strong> {session.goal.subject} - {session.goal.topic} ({session.goal.objective})
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Turns:</strong> {session.tutorTurns.length} | <strong>Observations:</strong> {session.observations.length}
                    </div>
                    {session.visibilityNote && (
                      <div style={{ padding: '0.5rem', background: '#fff3cd', borderRadius: '4px', marginTop: '0.5rem' }}>
                        <strong>Note:</strong> {session.visibilityNote}
                      </div>
                    )}
                    {session.tutorTurns.length > 0 && (
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#666' }}>View Conversation</summary>
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f9f9f9', borderRadius: '4px' }}>
                          {session.tutorTurns.map((turn: any, j: number) => (
                            <div key={j} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: j < session.tutorTurns.length - 1 ? '1px solid #ddd' : 'none' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Turn {turn.turnNumber}</div>
                              {turn.learnerUtterance && (
                                <div style={{ marginBottom: '0.25rem', color: '#2196f3' }}>
                                  <strong>Learner:</strong> {turn.learnerUtterance}
                                </div>
                              )}
                              <div style={{ color: '#4caf50' }}>
                                <strong>Tutor:</strong> {turn.tutorMessage}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No sessions found or access denied</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!data && (
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px', color: '#666' }}>
          <p><strong>Instructions:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Enter a learner ID to view their data</li>
            <li>Select your role (Teacher, Parent, Institution, or Learner)</li>
            <li>For adults, check &quot;Opt-in Teacher Access&quot; to allow teacher viewing</li>
            <li>Minors are visible to parents and teachers by default</li>
          </ul>
        </div>
      )}
    </div>
  )
}

