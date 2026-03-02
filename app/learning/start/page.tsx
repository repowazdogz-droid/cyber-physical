'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadPersistedState, savePersistedState } from '../persist/LearningPersist'
import {
  AgeBandId,
  MissionId,
  SubjectId,
  PortalId,
  TOPIC_LIBRARY,
  getAgeBand,
  getMission,
  getSubject,
  getTopic,
  getMicroTopic
} from '../topics/topicLibrary'
import { AgeBand } from '../../../spine/learning/platform/LearnerTypes'
import { TutorMode } from '../../../spine/learning/platform/dialogue/DialogTypes'
import { getGuidedPath } from '../paths/pathLibrary'
import { createPathProgress } from '../paths/GuidedPathRunner'

interface WizardContext {
  ageBandId?: AgeBandId
  missionId?: MissionId
  portalId?: PortalId
  subjectId?: SubjectId
  topicId?: string
  microTopicId?: string
  selectedPrompt?: {
    objective: string
    starterUserUtterances: string[]
  }
  optionalDetails?: string
}

const MAX_OPTIONS_PER_STEP = 12

export default function StartWizard() {
  const router = useRouter()
  const [context, setContext] = useState<WizardContext>({})
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({})
  const [showOptionalDetails, setShowOptionalDetails] = useState(false)

  const updateContext = (updates: Partial<WizardContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }

  const toggleShowMore = (key: string) => {
    setShowMore(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getBreadcrumb = () => {
    const parts: string[] = []
    if (context.ageBandId) {
      const ageBand = getAgeBand(context.ageBandId)
      parts.push(ageBand?.label || context.ageBandId)
    }
    if (context.missionId) {
      const mission = context.ageBandId && context.missionId
        ? getMission(context.ageBandId, context.missionId)
        : undefined
      parts.push(mission?.label || context.missionId)
    }
    if (context.subjectId) {
      const subject = context.ageBandId && context.missionId && context.subjectId
        ? getSubject(context.ageBandId, context.missionId, context.subjectId)
        : undefined
      parts.push(subject?.label || context.subjectId)
    }
    if (context.topicId) {
      const topic = context.ageBandId && context.missionId && context.subjectId && context.topicId
        ? getTopic(context.ageBandId, context.missionId, context.subjectId, context.topicId)
        : undefined
      parts.push(topic?.label || context.topicId)
    }
    return parts.join(' › ')
  }

  const handleBack = () => {
    if (context.microTopicId) {
      updateContext({ microTopicId: undefined, selectedPrompt: undefined })
    } else if (context.topicId) {
      updateContext({ topicId: undefined })
    } else if (context.subjectId || context.portalId) {
      updateContext({ subjectId: undefined, portalId: undefined })
    } else if (context.missionId) {
      updateContext({ missionId: undefined })
    } else if (context.ageBandId) {
      updateContext({ ageBandId: undefined })
    }
  }

  const handleComplete = (starterUtterance: string) => {
    if (!context.ageBandId || !context.missionId || !context.subjectId || !context.topicId || !context.microTopicId) {
      return
    }

    const microTopic = getMicroTopic(
      context.ageBandId,
      context.missionId,
      context.subjectId,
      context.topicId,
      context.microTopicId
    )

    if (!microTopic || !microTopic.prompts[0]) {
      return
    }

    const prompt = microTopic.prompts[0]
    const subject = getSubject(context.ageBandId, context.missionId, context.subjectId)
    const topic = getTopic(context.ageBandId, context.missionId, context.subjectId, context.topicId)

    // Map age band IDs to AgeBand enum
    const ageBandMap: Record<AgeBandId, AgeBand> = {
      "6-9": AgeBand.SIX_TO_NINE,
      "10-12": AgeBand.TEN_TO_TWELVE,
      "13-15": AgeBand.THIRTEEN_TO_FIFTEEN,
      "16-18": AgeBand.SIXTEEN_TO_EIGHTEEN,
      "adult": AgeBand.ADULT
    }

    // Determine tutor mode based on age
    let tutorMode: TutorMode = TutorMode.Socratic
    if (context.ageBandId === "6-9" || context.ageBandId === "10-12") {
      tutorMode = TutorMode.Coach
    }

    // Store context in localStorage
    const learningContext = {
      ageBand: ageBandMap[context.ageBandId],
      isMinor: context.ageBandId !== "adult",
      subject: subject?.label || context.subjectId,
      topic: topic?.label || context.topicId,
      objective: prompt.objective,
      tutorMode,
      starterUtterance: context.optionalDetails || starterUtterance,
      missionId: context.missionId
    }

    // Persist context and initialize path progress
    // Map topic name to topicId (simplified - in production would be more robust)
    const topicNameToId: Record<string, string> = {
      "Addition": "addition",
      "Fractions": "fractions",
      "Algebra": "algebra",
      "Calculus": "calculus",
      "Programming Basics": "programming-basics"
    }
    const topicId = topicNameToId[topic?.label || context.topicId] || context.topicId.toLowerCase().replace(/\s+/g, '-')
    const foundPath = getGuidedPath(ageBandMap[context.ageBandId], context.missionId as any, topicId)
    
    const pathProgress = foundPath ? createPathProgress(foundPath) : undefined
    
    // Save to persistence
    const persistedState = {
      lastContext: learningContext,
      pathProgress,
      lastSessionId: `session-${Date.now()}`,
      lastTurns: [],
      lastUpdated: new Date().toISOString()
    }
    
    // Also save to old location for backward compatibility
    localStorage.setItem('learning:lastContext', JSON.stringify(learningContext))
    
    // Save persisted state
    localStorage.setItem('learning:persistedState', JSON.stringify(persistedState))

    // Navigate to home (not directly into chat)
    router.push('/learning/home')
  }

  const [showJoinClass, setShowJoinClass] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoinClass = async () => {
    if (!inviteCode.trim() || inviteCode.length < 4) {
      return
    }

    setJoining(true)
    try {
      const response = await fetch('/api/learning/classroom/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Invalid invite code')
        return
      }

      const data = await response.json()
      
      // Store teacher-linked context
      const persisted = loadPersistedState()
      if (persisted) {
        savePersistedState({
          ...persisted,
          lastContext: {
            ...persisted.lastContext,
            linkedTeacherId: data.teacherId
          }
        })
      } else {
        // Create new persisted state with teacher link
        // Use default values - learner will complete wizard after joining
        savePersistedState({
          lastContext: {
            ageBand: AgeBand.ADULT, // Default, will be updated when wizard completes
            isMinor: false,
            subject: 'Learning',
            topic: 'Getting Started',
            objective: 'Join your class session',
            tutorMode: TutorMode.Socratic,
            starterUtterance: 'Hello, I joined the class',
            linkedTeacherId: data.teacherId
          },
          lastSessionId: `session-${Date.now()}`,
          lastTurns: [],
          lastUpdated: new Date().toISOString()
        })
      }

      // Navigate to home
      router.push('/learning/home')
    } catch (err) {
      alert('Failed to join class')
    } finally {
      setJoining(false)
    }
  }

  // Step 0: Join a class option
  if (!context.ageBandId && !showJoinClass) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Get Started</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <button
            onClick={() => setShowJoinClass(true)}
            style={{
              minHeight: '120px',
              padding: '1.5rem',
              border: '2px solid #0066cc',
              borderRadius: '12px',
              background: '#f0f7ff',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            Join a class
          </button>
          <button
            onClick={() => updateContext({ ageBandId: '6-9' })}
            style={{
              minHeight: '120px',
              padding: '1.5rem',
              border: '2px solid #ddd',
              borderRadius: '12px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            Start learning on my own
          </button>
        </div>
      </div>
    )
  }

  // Join class form
  if (showJoinClass) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => setShowJoinClass(false)}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Join a class</h1>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Enter invite code (4-6 characters)
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              textTransform: 'uppercase'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJoinClass()
              }
            }}
            autoFocus
          />
        </div>
        <button
          onClick={handleJoinClass}
          disabled={joining || inviteCode.length < 4}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '1rem',
            background: joining || inviteCode.length < 4 ? '#ccc' : '#0066cc',
            color: '#fff',
            border: 'none',
            cursor: joining || inviteCode.length < 4 ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          {joining ? 'Joining...' : 'Join Class'}
        </button>
      </div>
    )
  }

  // Step 1: Choose age band
  if (!context.ageBandId) {
    const ageBands = TOPIC_LIBRARY.ageBands
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Choose your age</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {ageBands.map(band => (
            <button
              key={band.id}
              onClick={() => updateContext({ ageBandId: band.id })}
              style={{
                padding: '2rem 1rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#000'
                e.currentTarget.style.background = '#f5f5f5'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.background = '#fff'
              }}
            >
              {band.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: Choose mission
  if (!context.missionId) {
    const ageBand = getAgeBand(context.ageBandId)
    const missions = ageBand?.missions || []
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {getBreadcrumb()}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>What do you want to do?</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {missions.map(mission => (
            <button
              key={mission.id}
              onClick={() => updateContext({ missionId: mission.id })}
              style={{
                minHeight: '120px',
                padding: '1.5rem',
                border: '2px solid #ddd',
                borderRadius: '12px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0066cc'
                e.currentTarget.style.background = '#f0f7ff'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.background = '#fff'
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>{mission.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', lineHeight: '1.4' }}>
                {mission.description.split('.')[0]} {/* Limit to first sentence */}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 3: Choose portal or subject
  if (!context.portalId && !context.subjectId) {
    const ageBand = getAgeBand(context.ageBandId)
    const mission = getMission(context.ageBandId, context.missionId)
    const portals: { id: PortalId; label: string }[] = [
      { id: 'homework', label: "I have homework" },
      { id: 'curious', label: "I'm curious" },
      { id: 'stuck', label: "I feel stuck" }
    ]
    const subjects = mission?.subjects || []
    const allOptions = [...portals, ...subjects.map(s => ({ id: s.id, label: s.label, type: 'subject' as const }))]
    const visibleOptions = allOptions.slice(0, MAX_OPTIONS_PER_STEP)
    const hasMore = allOptions.length > MAX_OPTIONS_PER_STEP

    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {getBreadcrumb()}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>How do you want to start?</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {visibleOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                if ('type' in option && option.type === 'subject') {
                  updateContext({ subjectId: option.id as SubjectId })
                } else {
                  updateContext({ portalId: option.id as PortalId })
                }
              }}
              style={{
                padding: '2rem 1rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#000'
                e.currentTarget.style.background = '#f5f5f5'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.background = '#fff'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {hasMore && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => toggleShowMore('step3')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #ddd',
                background: '#f5f5f5',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              {showMore.step3 ? 'Show Less' : 'More Options'}
            </button>
            {showMore.step3 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {allOptions.slice(MAX_OPTIONS_PER_STEP).map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      if ('type' in option && option.type === 'subject') {
                        updateContext({ subjectId: option.id as SubjectId })
                      } else {
                        updateContext({ portalId: option.id as PortalId })
                      }
                    }}
                    style={{
                      padding: '2rem 1rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Step 4: Choose topic (from portal or subject)
  if (!context.topicId) {
    const ageBand = getAgeBand(context.ageBandId)
    const mission = getMission(context.ageBandId, context.missionId)
    let topics: Array<{ id: string; label: string }> = []

    if (context.portalId && ageBand) {
      const portal = ageBand.portalTopics[context.portalId]
      if (portal && mission) {
        topics = mission.subjects
          .filter(s => portal.subjectIds.includes(s.id))
          .flatMap(s => s.topics.map(t => ({ id: t.id, label: t.label })))
          .filter(t => !portal.topicIds.length || portal.topicIds.includes(t.id))
      }
    } else if (context.subjectId && mission) {
      const subject = getSubject(context.ageBandId, context.missionId, context.subjectId)
      topics = subject?.topics.map(t => ({ id: t.id, label: t.label })) || []
    }

    const visibleTopics = topics.slice(0, MAX_OPTIONS_PER_STEP)
    const hasMore = topics.length > MAX_OPTIONS_PER_STEP

    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {getBreadcrumb()}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Choose a topic</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {visibleTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => updateContext({ topicId: topic.id })}
              style={{
                minHeight: '100px',
                padding: '1.5rem',
                border: '2px solid #ddd',
                borderRadius: '12px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0066cc'
                e.currentTarget.style.background = '#f0f7ff'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.background = '#fff'
              }}
            >
              {topic.label}
            </button>
          ))}
          {/* "I don't know" option */}
          <button
            onClick={() => {
              // Auto-pick first topic as gentle default
              if (visibleTopics.length > 0) {
                updateContext({ topicId: visibleTopics[0].id })
              }
            }}
            style={{
              minHeight: '100px',
              padding: '1.5rem',
              border: '2px solid #ddd',
              borderRadius: '12px',
              background: '#f9f9f9',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'normal',
              color: '#666',
              fontStyle: 'italic',
              textAlign: 'left'
            }}
          >
            I don&apos;t know
          </button>
        </div>
        {hasMore && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => toggleShowMore('step4')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #ddd',
                background: '#f5f5f5',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              {showMore.step4 ? 'Show Less' : 'More Options'}
            </button>
            {showMore.step4 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {topics.slice(MAX_OPTIONS_PER_STEP).map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => updateContext({ topicId: topic.id })}
                    style={{
                      padding: '2rem 1rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Step 5: Choose micro-topic and starter utterance
  if (!context.microTopicId) {
    const topic = getTopic(context.ageBandId, context.missionId, context.subjectId!, context.topicId)
    const microTopics = topic?.microTopics || []
    const visibleMicroTopics = microTopics.slice(0, MAX_OPTIONS_PER_STEP)
    const hasMore = microTopics.length > MAX_OPTIONS_PER_STEP

    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {getBreadcrumb()}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>What specifically do you want to learn?</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {visibleMicroTopics.map(micro => (
            <button
              key={micro.id}
              onClick={() => {
                const prompt = micro.prompts[0]
                updateContext({
                  microTopicId: micro.id,
                  selectedPrompt: prompt ? {
                    objective: prompt.objective,
                    starterUserUtterances: prompt.starterUserUtterances
                  } : undefined
                })
              }}
              style={{
                minHeight: '100px',
                padding: '1.5rem',
                border: '2px solid #ddd',
                borderRadius: '12px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0066cc'
                e.currentTarget.style.background = '#f0f7ff'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.background = '#fff'
              }}
            >
              {micro.label}
            </button>
          ))}
          {/* "I don't know" option */}
          <button
            onClick={() => {
              // Auto-pick first micro-topic as gentle default
              if (visibleMicroTopics.length > 0) {
                const micro = visibleMicroTopics[0]
                const prompt = micro.prompts[0]
                updateContext({
                  microTopicId: micro.id,
                  selectedPrompt: prompt ? {
                    objective: prompt.objective,
                    starterUserUtterances: prompt.starterUserUtterances
                  } : undefined
                })
              }
            }}
            style={{
              minHeight: '100px',
              padding: '1.5rem',
              border: '2px solid #ddd',
              borderRadius: '12px',
              background: '#f9f9f9',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'normal',
              color: '#666',
              fontStyle: 'italic',
              textAlign: 'left'
            }}
          >
            I don&apos;t know
          </button>
        </div>
        {hasMore && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => toggleShowMore('step5')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #ddd',
                background: '#f5f5f5',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              {showMore.step5 ? 'Show Less' : 'More Options'}
            </button>
            {showMore.step5 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {microTopics.slice(MAX_OPTIONS_PER_STEP).map(micro => (
                  <button
                    key={micro.id}
                    onClick={() => {
                      const prompt = micro.prompts[0]
                      updateContext({
                        microTopicId: micro.id,
                        selectedPrompt: prompt ? {
                          objective: prompt.objective,
                          starterUserUtterances: prompt.starterUserUtterances
                        } : undefined
                      })
                    }}
                    style={{
                      padding: '1.5rem 1rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {micro.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Final step: Choose starter utterance
  if (context.microTopicId && context.selectedPrompt) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {getBreadcrumb()}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>How would you like to start?</h1>
        
        <div style={{ marginBottom: '2rem' }}>
          {context.selectedPrompt.starterUserUtterances.map((utterance, i) => (
            <button
              key={i}
              onClick={() => handleComplete(utterance)}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: '1rem',
                padding: '1.5rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '1rem',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#000'
                e.currentTarget.style.background = '#f5f5f5'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.background = '#fff'
              }}
            >
              {utterance}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <button
            onClick={() => setShowOptionalDetails(!showOptionalDetails)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              borderRadius: '4px',
              marginBottom: showOptionalDetails ? '1rem' : '0'
            }}
          >
            {showOptionalDetails ? 'Hide' : 'Add'} Optional Details
          </button>
          {showOptionalDetails && (
            <div>
              <textarea
                value={context.optionalDetails || ''}
                onChange={(e) => updateContext({ optionalDetails: e.target.value })}
                placeholder="Add any additional context or questions..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  marginTop: '0.5rem'
                }}
              />
              <button
                onClick={() => {
                  if (context.optionalDetails) {
                    handleComplete(context.optionalDetails)
                  }
                }}
                disabled={!context.optionalDetails}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: context.optionalDetails ? '#000' : '#ccc',
                  color: '#fff',
                  cursor: context.optionalDetails ? 'pointer' : 'not-allowed',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                Start with my details
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

