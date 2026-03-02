'use client'

import { useState, useEffect } from 'react'
import PrimaryActionBar from '../../learning/ui/PrimaryActionBar'
import UiCard from '../../learning/ui/UiCard'
import { TAP_MIN_PX } from '../../learning/ui/uiTokens'

interface LearnerSession {
  learnerId: string
  sessionId: string
  goal: {
    subject: string
    topic: string
    objective: string
  }
  lastTurn?: {
    role: string
    message: string
  }
  paused: boolean
  createdAtIso: string
}

const PRESET_NUDGES = [
  "Try thinking about this step by step",
  "What do you think the next step might be?",
  "Can you explain what you understand so far?",
  "Take your time, there's no rush"
]

export default function ClassroomPage() {
  const [teacherId, setTeacherId] = useState('teacher-1')
  const [learnerId, setLearnerId] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [learnerSession, setLearnerSession] = useState<LearnerSession | null>(null)
  const [paused, setPaused] = useState(false)
  const [nudgeText, setNudgeText] = useState('')
  const [sendingNudge, setSendingNudge] = useState(false)
  const [calmMode, setCalmMode] = useState(true)

  // Poll for learner session (every 2s)
  useEffect(() => {
    if (!learnerId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/learning/teacher?learnerId=${learnerId}&role=Teacher&optInTeacherAccess=true`)
        if (response.ok) {
          const data = await response.json()
          if (data.sessions && data.sessions.length > 0) {
            const latestSession = data.sessions[0]
            setLearnerSession({
              learnerId,
              sessionId: latestSession.sessionId,
              goal: latestSession.goal,
              lastTurn: latestSession.tutorTurns && latestSession.tutorTurns.length > 0
                ? latestSession.tutorTurns[latestSession.tutorTurns.length - 1]
                : undefined,
              paused: data.learnerState?.pausedByTeacher || false,
              createdAtIso: latestSession.createdAtIso
            })
            setPaused(data.learnerState?.pausedByTeacher || false)
          }
        }
      } catch (err) {
        // Silently fail
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [learnerId])

  const handleCreateInvite = async () => {
    if (!teacherId || !learnerId) {
      alert('Please enter teacher ID and learner ID')
      return
    }

    setCreatingInvite(true)
    try {
      const response = await fetch('/api/learning/classroom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          learnerId,
          ttlMinutes: 60
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to create invite')
        return
      }

      const data = await response.json()
      setInviteCode(data.inviteCode)
    } catch (err) {
      alert('Failed to create invite')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handlePauseResume = async () => {
    if (!teacherId || !learnerId) return

    const newPaused = !paused
    try {
      const response = await fetch('/api/learning/classroom/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          learnerId,
          paused: newPaused
        })
      })

      if (response.ok) {
        setPaused(newPaused)
      }
    } catch (err) {
      alert('Failed to pause/resume')
    }
  }

  const handleSendNudge = async (text: string) => {
    if (!teacherId || !learnerId || !text.trim()) return

    setSendingNudge(true)
    try {
      const response = await fetch('/api/learning/classroom/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          learnerId,
          nudgeText: text.trim()
        })
      })

      if (response.ok) {
        setNudgeText('')
        alert('Nudge sent!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send nudge')
      }
    } catch (err) {
      alert('Failed to send nudge')
    } finally {
      setSendingNudge(false)
    }
  }

  const handleExportSummary = async () => {
    if (!learnerId) return

    try {
      const response = await fetch(`/api/learning/teacher/summary?learnerId=${learnerId}&role=Teacher&optInTeacherAccess=true`)
      if (response.ok) {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `learner-${learnerId}-summary-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      alert('Failed to export summary')
    }
  }

  return (
    <div style={{ padding: calmMode ? '1.5rem' : '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: calmMode ? '1.5rem' : '1.8rem', margin: 0 }}>Classroom Control</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={calmMode}
            onChange={(e) => setCalmMode(e.target.checked)}
          />
          Calm Mode
        </label>
      </div>

      {/* Setup Section */}
      <UiCard readingMode="standard" calmMode={calmMode}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Setup</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Teacher ID
            </label>
            <input
              type="text"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Learner ID
            </label>
            <input
              type="text"
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>
        <PrimaryActionBar
          primaryLabel={creatingInvite ? 'Creating...' : 'Create Invite Code'}
          onPrimary={handleCreateInvite}
          readingMode="standard"
          calmMode={calmMode}
          primaryDisabled={creatingInvite || !teacherId || !learnerId}
        />
        {inviteCode && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f0f7ff',
            border: '2px solid #0066cc',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#666' }}>Invite Code:</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.5rem', color: '#0066cc' }}>
              {inviteCode}
            </div>
          </div>
        )}
      </UiCard>

      {/* Live Session View */}
      {learnerSession && (
        <UiCard readingMode="standard" calmMode={calmMode}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Live Session</h2>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              <strong>Subject:</strong> {learnerSession.goal.subject} → {learnerSession.goal.topic}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              <strong>Objective:</strong> {learnerSession.goal.objective}
            </div>
            {learnerSession.lastTurn && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#f9f9f9',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                <strong>{learnerSession.lastTurn.role === 'learner' ? 'Learner' : 'Tutor'}:</strong> {learnerSession.lastTurn.message.substring(0, 100)}...
              </div>
            )}
          </div>
          <PrimaryActionBar
            primaryLabel={paused ? 'Resume' : 'Pause'}
            onPrimary={handlePauseResume}
            secondaryLabel="Export Summary"
            onSecondary={handleExportSummary}
            readingMode="standard"
            calmMode={calmMode}
          />
        </UiCard>
      )}

      {/* Send Nudge */}
      {learnerSession && (
        <UiCard readingMode="standard" calmMode={calmMode}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Send Nudge</h2>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {PRESET_NUDGES.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleSendNudge(preset)}
                  disabled={sendingNudge}
                  style={{
                    minHeight: `${TAP_MIN_PX}px`,
                    padding: '0.75rem 1rem',
                    background: sendingNudge ? '#ccc' : '#f5f5f5',
                    border: '1px solid #ddd',
                    cursor: sendingNudge ? 'not-allowed' : 'pointer',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Custom message
              </label>
              <input
                type="text"
                value={nudgeText}
                onChange={(e) => setNudgeText(e.target.value)}
                placeholder="Type a custom message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendNudge(nudgeText)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  marginBottom: '0.75rem'
                }}
              />
            </div>
          </div>
          <PrimaryActionBar
            primaryLabel={sendingNudge ? 'Sending...' : 'Send Custom Nudge'}
            onPrimary={() => handleSendNudge(nudgeText)}
            readingMode="standard"
            calmMode={calmMode}
            primaryDisabled={sendingNudge || !nudgeText.trim()}
          />
        </UiCard>
      )}
    </div>
  )
}








































