'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AgeBand } from '../../spine/learning/platform/LearnerTypes'
import { TutorMode } from '../../spine/learning/platform/dialogue/DialogTypes'
import { AssessmentType } from '../../spine/learning/platform/assessment/AssessmentTypes'
import { deriveStyleProfile, getNextBestStep, LearningStyleProfile } from './styles/LearningStyleProfile'
import { getGuidedPath, GuidedPath } from './paths/pathLibrary'
import { 
  createPathProgress, 
  PathProgress, 
  getCurrentStep, 
  advanceStep as advancePathStep, 
  getProgressSummary,
  generateSessionSummary,
  shouldTriggerTeachBack,
  buildTeachBackUtterance
} from './paths/GuidedPathRunner'
import CheckpointCard from './components/CheckpointCard'
import TeachBackModal from './components/TeachBackModal'
import { 
  loadPersistedState, 
  savePersistedState, 
  updateLastTurns,
  AccessibilityPreferences
} from './persist/LearningPersist'
import { LearningContext } from './types'
import { isVoiceSupported, startListening, stopListening } from './input/VoiceInput'
import UiCard from './ui/UiCard'
import PrimaryActionBar from './ui/PrimaryActionBar'
import ReadingModeToggle from './ui/ReadingModeToggle'
import { ReadingMode } from './ui/uiTokens'
import { TAP_MIN_PX, CHIP_ROWS_MAX, MAX_LINE_WIDTH } from './ui/uiTokens'
import { ThoughtBoard, ThoughtCard, createThoughtBoard, addCardToBoard, reorderCards } from './thoughts/ThoughtTypes'
import { extractThoughtCardsFromTutorTurn, createLearnerAttemptCard, createCheckpointCard } from './thoughts/ThoughtExtractors'
import { arrangeBoard } from './thoughts/ThoughtArranger'
import { LearningBoard } from './board/BoardTypes'
import { initializeBoard, addThoughtObject, markUncertainty, removeObject, advanceStep as advanceBoardStep } from './board/BoardReducer'
import { ThoughtObject } from './board/ThoughtObjects'
import LearningBoardComponent from './board/LearningBoard'

interface SessionOutput {
  tutorTurn: {
    message: string
    questions: string[]
    shouldRefuse: boolean
    refusalReason?: string
  }
  assessment?: any
  observations: any[]
  skillGraphDelta: {
    updates: any[]
  }
  sessionTrace: {
    turnCount: number
    skillUpdatesCount: number
  }
}

const ACTION_CHIPS = [
  "Ask me a question",
  "Give me a hint",
  "Let me try",
  "Show an example",
  "I'm stuck"
]

function LearningPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [context, setContext] = useState<LearningContext | null>(null)
  const [learnerId] = useState('learner-1')
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, message: string}>>([])
  const [output, setOutput] = useState<SessionOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skills, setSkills] = useState<any>(null)
  const [showTypeDrawer, setShowTypeDrawer] = useState(false)
  const [typeInput, setTypeInput] = useState('')
  const [requestAssessment, setRequestAssessment] = useState(false)
  const [autoStarted, setAutoStarted] = useState(false)
  const [calmMode, setCalmMode] = useState(true) // Default true, will be set based on minor status
  const [lastAction, setLastAction] = useState<string | undefined>()
  const [showMoreChips, setShowMoreChips] = useState(false)
  const [showSkillsPanel, setShowSkillsPanel] = useState(false)
  const [path, setPath] = useState<GuidedPath | null>(null)
  const [pathProgress, setPathProgress] = useState<PathProgress | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showPathCompletion, setShowPathCompletion] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceCleanup, setVoiceCleanup] = useState<(() => void) | null>(null)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [showTeachBackModal, setShowTeachBackModal] = useState(false)
  const [showCheckpointCard, setShowCheckpointCard] = useState(false)
  const [selfCheckStatus, setSelfCheckStatus] = useState<"Ready" | "NotYet" | "Unsure" | null>(null)
  const [readingMode, setReadingMode] = useState<ReadingMode>('standard')
  const [focusMode, setFocusMode] = useState(true) // Default ON for minors + calm mode
  const [pausedByTeacher, setPausedByTeacher] = useState(false)
  const [teacherNudges, setTeacherNudges] = useState<Array<{text: string, timestampIso: string}>>([])
  const [linkedTeacherId, setLinkedTeacherId] = useState<string | undefined>()
  const [thoughtBoard, setThoughtBoard] = useState<ThoughtBoard | null>(null)
  const [showBoard, setShowBoard] = useState(false) // Collapsed by default (calm mode)
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [learningBoard, setLearningBoard] = useState<LearningBoard | null>(null)
  const [showLearningBoard, setShowLearningBoard] = useState(false) // Hidden by default in calm mode

  // Derive style profile from context
  const styleProfile: LearningStyleProfile | null = useMemo(() => {
    if (!context) return null
    return deriveStyleProfile(
      context.ageBand,
      context.missionId as any,
      calmMode
    )
  }, [context, calmMode])

  // Set calm mode default based on minor status and load accessibility preferences
  useEffect(() => {
    if (context) {
      const persisted = loadPersistedState()
      if (persisted?.accessibility) {
        setCalmMode(persisted.accessibility.calmMode)
        setHighContrast(persisted.accessibility.highContrast)
        setReducedMotion(persisted.accessibility.reducedMotion)
        setReadingMode(persisted.accessibility.readingMode || 'standard')
        setFocusMode(persisted.accessibility.focusMode !== undefined ? persisted.accessibility.focusMode : (context.isMinor || persisted.accessibility.calmMode))
      } else {
        setCalmMode(context.isMinor) // Default to true for minors
        setFocusMode(context.isMinor) // Default ON for minors
      }
      
      // Load teacher-linked state
      if (persisted?.lastContext?.linkedTeacherId) {
        setLinkedTeacherId(persisted.lastContext.linkedTeacherId)
      }
      
      // Load thought board
      if (persisted?.thoughtBoard) {
        setThoughtBoard(persisted.thoughtBoard)
      } else {
        // Create new board
        const newBoard = createThoughtBoard()
        setThoughtBoard(newBoard)
      }
    }
    
    // Check voice support
    setVoiceSupported(isVoiceSupported())
  }, [context])
  
  // Poll for teacher controls (every 2s if linked to teacher)
  useEffect(() => {
    if (!linkedTeacherId || !learnerId) return
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/learning/teacher?learnerId=${learnerId}&role=Teacher&optInTeacherAccess=true`)
        if (response.ok) {
          const data = await response.json()
          if (data.learnerState) {
            setPausedByTeacher(data.learnerState.pausedByTeacher || false)
            setTeacherNudges(data.learnerState.teacherNudges || [])
          }
        }
      } catch (err) {
        // Silently fail
      }
    }, 2000)
    
    return () => clearInterval(pollInterval)
  }, [linkedTeacherId, learnerId])
  
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
    const persisted = loadPersistedState()
    if (persisted) {
      savePersistedState({
        ...persisted,
        accessibility: {
          calmMode,
          highContrast,
          reducedMotion,
          readingMode,
          focusMode
        }
      })
    }
  }, [calmMode, highContrast, reducedMotion, readingMode, focusMode])
  
  // Save thought board when it changes (legacy)
  useEffect(() => {
    const persisted = loadPersistedState()
    if (persisted && thoughtBoard) {
      savePersistedState({
        ...persisted,
        thoughtBoard,
        boardId: thoughtBoard.boardId
      })
    }
  }, [thoughtBoard])
  
  // Save learning board when it changes (new XR-ready)
  useEffect(() => {
    const persisted = loadPersistedState()
    if (persisted && learningBoard) {
      savePersistedState({
        ...persisted,
        learningBoard
      })
    }
  }, [learningBoard])
  
  // Cleanup voice input on unmount
  useEffect(() => {
    return () => {
      if (voiceCleanup) {
        stopListening(voiceCleanup)
      }
    }
  }, [voiceCleanup])

  // Load guided path based on context
  useEffect(() => {
    if (context && context.missionId) {
      // Map topic name to topicId (simplified - in production would be more robust)
      const topicIdMap: Record<string, string> = {
        "Addition": "addition",
        "Fractions": "fractions",
        "Algebra": "algebra",
        "Calculus": "calculus",
        "Programming Basics": "programming-basics"
      }
      const topicId = topicIdMap[context.topic] || context.topic.toLowerCase().replace(/\s+/g, '-')
      
      const foundPath = getGuidedPath(context.ageBand, context.missionId as any, topicId)
      if (foundPath) {
        setPath(foundPath)
        setPathProgress(createPathProgress(foundPath))
      }
    }
  }, [context])

  // Load context from persisted state
  useEffect(() => {
    const persisted = loadPersistedState()
    if (persisted) {
      setContext(persisted.lastContext)
      setSessionId(persisted.lastSessionId)
      
      // Load last turns into conversation history
      if (persisted.lastTurns && persisted.lastTurns.length > 0) {
        setConversationHistory(persisted.lastTurns.map(turn => ({
          role: turn.role,
          message: turn.message
        })))
      }
      
      // Load path progress if available
      if (persisted.pathProgress) {
        setPathProgress(persisted.pathProgress)
      }
    } else {
      // Check for old localStorage format (backward compatibility)
      const oldContext = localStorage.getItem('learning:lastContext')
      if (oldContext) {
        try {
          const parsed = JSON.parse(oldContext)
          setContext(parsed)
          // Migrate to new format
          savePersistedState({
            lastContext: parsed,
            lastSessionId: `session-${Date.now()}`,
            lastTurns: [],
            lastUpdated: new Date().toISOString()
          })
        } catch (e) {
          // Invalid, redirect to start
          router.push('/learning/start')
        }
      } else {
        // No persisted state, redirect to start
        router.push('/learning/start')
      }
    }
  }, [router])

  const loadSkills = useCallback(async () => {
    try {
      const response = await fetch(`/api/learning/skills?learnerId=${learnerId}`)
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      }
    } catch (err) {
      // Silently fail
    }
  }, [learnerId])

  // Auto-start first session when context is loaded
  useEffect(() => {
    if (context && !autoStarted && conversationHistory.length === 0 && styleProfile) {
      const startSession = async () => {
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/learning/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              learner: {
                learnerId,
                ageBand: context.ageBand,
                safety: {
                  minor: context.isMinor,
                  institutionMode: false
                }
              },
              goal: {
                subject: context.subject,
                topic: context.topic,
                objective: context.objective
              },
              mode: context.tutorMode,
              utterance: context.starterUtterance,
              responseStyleHint: styleProfile.responseStyleHint // Pass hint to API
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Session failed')
          }

          const data = await response.json()
          setOutput(data)
          const initialHistory = [
            { role: 'learner' as const, message: context.starterUtterance },
            { role: 'tutor' as const, message: data.tutorTurn.message }
          ]
          setConversationHistory(initialHistory)
          
          // Persist initial state
          const persisted = loadPersistedState()
          if (persisted) {
            savePersistedState({
              ...persisted,
              lastContext: context,
              lastSessionId: sessionId,
              lastTurns: initialHistory.map(entry => ({
                role: entry.role,
                message: entry.message,
                timestamp: new Date().toISOString()
              }))
            })
          }
          
          if (styleProfile.showSkillsPanel) {
            await loadSkills()
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to start session')
        } finally {
          setLoading(false)
          setAutoStarted(true)
        }
      }
      startSession()
    }
  }, [context, autoStarted, conversationHistory.length, sessionId, learnerId, styleProfile, loadSkills])

  useEffect(() => {
    if (styleProfile?.showSkillsPanel && learnerId) {
      loadSkills()
    }
  }, [styleProfile?.showSkillsPanel, learnerId, loadSkills])

  const handleSend = async (utteranceText?: string, isAutoStart = false) => {
    if (!context || !styleProfile) return
    
    // Block if paused by teacher
    if (pausedByTeacher) {
      setError('Session is paused by teacher')
      return
    }

    const text = utteranceText || typeInput.trim()
    if (!text && conversationHistory.length === 0) {
      setError('Please enter a message or use an action chip')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/learning/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          learner: {
            learnerId,
            ageBand: context.ageBand,
            safety: {
              minor: context.isMinor,
              institutionMode: false
            }
          },
          goal: {
            subject: context.subject,
            topic: context.topic,
            objective: context.objective
          },
          mode: context.tutorMode,
          utterance: text || undefined,
          requestedAssessment: requestAssessment ? AssessmentType.TeachBack : null,
          responseStyleHint: styleProfile.responseStyleHint // Pass hint to API
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Session failed')
      }

      const data = await response.json()
      setOutput(data)

      // Update conversation history
      let updatedHistory = [...conversationHistory]
      if (text) {
        updatedHistory.push({ role: 'learner', message: text })
        
        // Add learner attempt to thought board (legacy)
        if (thoughtBoard && styleProfile) {
          const attemptCard = createLearnerAttemptCard(text, updatedHistory.length - 1)
          const updatedBoard = addCardToBoard(thoughtBoard, attemptCard)
          setThoughtBoard(updatedBoard)
        }
        
        // Add learner attempt to learning board (new XR-ready)
        if (learningBoard) {
          const attemptObj: ThoughtObject = {
            id: `obj-${Date.now()}-attempt`,
            type: 'LearnerAttempt',
            content: text,
            source: 'learner',
            timestamp: new Date().toISOString(),
            relatedStepId: pathProgress?.currentStepIndex !== undefined ? String(pathProgress.currentStepIndex) : undefined
          }
          setLearningBoard(addThoughtObject(learningBoard, attemptObj))
        }
      }
      updatedHistory.push({ role: 'tutor', message: data.tutorTurn.message })
      setConversationHistory(updatedHistory)
      
      // Extract thought cards from tutor turn (legacy)
      if (thoughtBoard && styleProfile) {
        const extractedCards = extractThoughtCardsFromTutorTurn(
          data.tutorTurn.message,
          updatedHistory.length - 1,
          styleProfile
        )
        let updatedBoard = thoughtBoard
        for (const card of extractedCards) {
          updatedBoard = addCardToBoard(updatedBoard, card)
        }
        setThoughtBoard(updatedBoard)
      }
      
      // Convert tutor turn to ThoughtObjects (new XR-ready board)
      if (learningBoard) {
        const tutorMessage = data.tutorTurn.message
        let updatedBoard = learningBoard
        
        // Extract questions
        const questions = tutorMessage.split(/[.!?]+/).filter((s: string) => s.trim().endsWith('?'))
        if (questions.length > 0) {
          const questionObj: ThoughtObject = {
            id: `obj-${Date.now()}-q`,
            type: 'Question',
            content: questions[0].trim(),
            source: 'tutor',
            timestamp: new Date().toISOString(),
            relatedStepId: pathProgress?.currentStepIndex !== undefined ? String(pathProgress.currentStepIndex) : undefined
          }
          updatedBoard = addThoughtObject(updatedBoard, questionObj)
        }
        
        // Extract hints
        const hintKeywords = ['hint', 'try', 'consider', 'think about', 'remember']
        const hintSentences = tutorMessage.split(/[.!?]+/).filter((s: string) =>
          hintKeywords.some(kw => s.toLowerCase().includes(kw))
        )
        if (hintSentences.length > 0) {
          const hintObj: ThoughtObject = {
            id: `obj-${Date.now()}-h`,
            type: 'TutorHint',
            content: hintSentences[0].trim(),
            source: 'tutor',
            timestamp: new Date().toISOString(),
            relatedStepId: pathProgress?.currentStepIndex !== undefined ? String(pathProgress.currentStepIndex) : undefined
          }
          updatedBoard = addThoughtObject(updatedBoard, hintObj)
        }
        
        // Extract examples
        const exampleKeywords = ['example', 'for instance', 'like', 'such as']
        const exampleSentences = tutorMessage.split(/[.!?]+/).filter((s: string) =>
          exampleKeywords.some(kw => s.toLowerCase().includes(kw))
        )
        if (exampleSentences.length > 0) {
          const exampleObj: ThoughtObject = {
            id: `obj-${Date.now()}-ex`,
            type: 'Example',
            content: exampleSentences[0].trim(),
            source: 'tutor',
            timestamp: new Date().toISOString(),
            relatedStepId: pathProgress?.currentStepIndex !== undefined ? String(pathProgress.currentStepIndex) : undefined
          }
          updatedBoard = addThoughtObject(updatedBoard, exampleObj)
        }
        
        // Check for uncertainty markers from StyleEnforcer
        if (data.tutorTurn.uncertaintyNotes && data.tutorTurn.uncertaintyNotes.length > 0) {
          const uncertaintyObj: ThoughtObject = {
            id: `obj-${Date.now()}-uncertain`,
            type: 'Uncertainty',
            content: data.tutorTurn.uncertaintyNotes.join(', '),
            source: 'tutor',
            timestamp: new Date().toISOString(),
            confidence: 'unknown',
            relatedStepId: pathProgress?.currentStepIndex !== undefined ? String(pathProgress.currentStepIndex) : undefined
          }
          updatedBoard = addThoughtObject(updatedBoard, uncertaintyObj)
        }
        
        setLearningBoard(updatedBoard)
      }
      
      // Clear input
      setTypeInput('')
      setShowTypeDrawer(false)
      
      // Persist last turns
      updateLastTurns(updatedHistory.map(entry => ({
        role: entry.role as 'learner' | 'tutor',
        message: entry.message,
        timestamp: new Date().toISOString()
      })))

      // Check path step completion
      if (path && pathProgress) {
        const currentStep = getCurrentStep(pathProgress, path)
        if (currentStep) {
          const hasMessage = !!text
          const newProgress = advancePathStep(pathProgress, path, lastAction || '', hasMessage)
          
          if (newProgress.currentStepIndex !== pathProgress.currentStepIndex) {
            // Step completed
            setPathProgress(newProgress)
            
            // Add checkpoint card to thought board
            if (thoughtBoard && currentStep) {
              const checkpointCard = createCheckpointCard(
                currentStep.title,
                currentStep.expectedArtifact,
                currentStep.id
              )
              const updatedBoard = addCardToBoard(thoughtBoard, checkpointCard)
              setThoughtBoard(updatedBoard)
            }
            
            // Check if teach-back should be triggered
            const nextStep = getCurrentStep(newProgress, path)
            if (shouldTriggerTeachBack(nextStep, newProgress, path)) {
              // Show checkpoint card with teach-back option
              setShowCheckpointCard(true)
            } else {
              // Show regular completion modal
              setShowCompletionModal(true)
            }
            
            // If path completed, generate summary
            if (newProgress.pathCompleted) {
              const summary = generateSessionSummary(path, newProgress, context.topic)
              // Store summary locally for display
              localStorage.setItem(`learning:sessionSummary:${sessionId}`, JSON.stringify(summary))
              // Persist to store via API
              try {
                await fetch('/api/learning/session/summary', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId,
                    summary
                  })
                })
              } catch (err) {
                // Silently fail - summary stored locally
              }
              setShowPathCompletion(true)
            }
            
            // Persist path progress
            if (path && newProgress) {
              const persisted = loadPersistedState()
              if (persisted) {
                savePersistedState({
                  ...persisted,
                  pathProgress: newProgress
                })
              }
            }
          } else {
            setPathProgress(newProgress)
          }
        }
      }

      // Clear inputs
      setTypeInput('')
      setShowTypeDrawer(false)
      setRequestAssessment(false)
      setShowMoreChips(false)

      // Refresh skills if panel is visible
      if (styleProfile.showSkillsPanel) {
        await loadSkills()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleActionChip = (action: string) => {
    setLastAction(action)
    // Map action chips to utterances
    const actionMap: Record<string, string> = {
      "Ask me a question": "Can you ask me a question about this?",
      "Give me a hint": "Can you give me a hint?",
      "Let me try": "Let me try to explain what I think",
      "Show an example": "Can you show me an example?",
      "I'm stuck": "I'm stuck and need help"
    }
    const utterance = actionMap[action] || action
    handleSend(utterance)
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      // Stop listening
      if (voiceCleanup) {
        stopListening(voiceCleanup)
        setVoiceCleanup(null)
        setIsListening(false)
        
        // Submit transcript if available
        if (voiceTranscript.trim()) {
          handleSend(voiceTranscript.trim())
          setVoiceTranscript('')
        }
      }
    } else {
      // Start listening
      setVoiceTranscript('')
      const cleanup = startListening(
        (transcript) => {
          setVoiceTranscript(transcript)
        },
        (error) => {
          setError(error)
          setIsListening(false)
          setVoiceCleanup(null)
        },
        () => {
          setIsListening(false)
          setVoiceCleanup(null)
          // Auto-submit on end if transcript exists
          if (voiceTranscript.trim()) {
            handleSend(voiceTranscript.trim())
            setVoiceTranscript('')
          }
        }
      )
      
      if (cleanup) {
        setVoiceCleanup(cleanup)
        setIsListening(true)
      }
    }
  }

  const handleNewSession = () => {
    router.push('/learning/start')
  }

  const handleSaveAndStop = () => {
    // Persist current state
    const persisted = loadPersistedState()
    if (persisted && context) {
      savePersistedState({
        ...persisted,
        lastContext: context,
        lastSessionId: sessionId,
        pathProgress: pathProgress || persisted.pathProgress,
        lastTurns: conversationHistory.map(entry => ({
          role: entry.role as 'learner' | 'tutor',
          message: entry.message,
          timestamp: new Date().toISOString()
        }))
      })
    }
    
    // Route to home
    router.push('/learning/home')
  }

  const handleTeachBackSubmit = async (userText: string) => {
    if (!context || !path) return
    
    // Build teach-back utterance
    const teachBackUtterance = buildTeachBackUtterance(
      userText,
      context.topic,
      context.objective
    )
    
    // Send as learner utterance
    await handleSend(teachBackUtterance, false)
    
    // Close modal
    setShowTeachBackModal(false)
    setShowCheckpointCard(false)
  }

  const handleSelfCheck = async (status: "Ready" | "NotYet" | "Unsure") => {
    setSelfCheckStatus(status)
    
    // Store self-check (append to learner utterance as metadata)
    const selfCheckNote = `[SELF_CHECK:${status}]`
    const utterance = `Self-check: ${status}`
    
    // Send to API (will be stored in session)
    try {
      await fetch('/api/learning/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          learner: {
            learnerId,
            ageBand: context?.ageBand,
            safety: {
              minor: context?.isMinor || false,
              institutionMode: false
            }
          },
          goal: context ? {
            subject: context.subject,
            topic: context.topic,
            objective: context.objective
          } : undefined,
          mode: context?.tutorMode,
          utterance: utterance,
          responseStyleHint: styleProfile?.responseStyleHint || ""
        })
      })
    } catch (err) {
      // Silently fail
    }
  }

  // Redirect if no context (handled by useEffect, but show loading while redirecting)
  if (!context || !styleProfile) {
    // Check if we should redirect to home instead
    const persisted = loadPersistedState()
    if (persisted && conversationHistory.length === 0 && !autoStarted) {
      // Has persisted state but no active session - redirect to home
      router.push('/learning/home')
      return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      )
    }
    
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // Get visible chips based on style profile and focus mode
  const maxChips = focusMode ? 1 : (calmMode ? 3 : styleProfile.optionsCountMax)
  const visibleChips = ACTION_CHIPS.slice(0, maxChips)
  const hiddenChips = ACTION_CHIPS.slice(maxChips)

  return (
    <div style={{ padding: calmMode ? '1.5rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Paused by Teacher Banner */}
      {pausedByTeacher && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#856404',
          textAlign: 'center'
        }}>
          ⏸️ Paused by teacher
        </div>
      )}

      {/* Teacher Nudge Card */}
      {teacherNudges.length > 0 && teacherNudges[teacherNudges.length - 1] && (
        <UiCard readingMode={readingMode} calmMode={calmMode} style={{ marginBottom: '1.5rem', background: '#e3f2fd', border: '2px solid #2196f3' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
            Message from teacher:
          </div>
          <div style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            {teacherNudges[teacherNudges.length - 1].text}
          </div>
          <PrimaryActionBar
            primaryLabel="Respond"
            onPrimary={() => {
              // Open type drawer with nudge context
              setShowTypeDrawer(true)
              setTypeInput(`Re: ${teacherNudges[teacherNudges.length - 1].text} `)
            }}
            readingMode={readingMode}
            calmMode={calmMode || focusMode}
          />
        </UiCard>
      )}

      {/* Guardrail Banner */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: context.isMinor ? '#e3f2fd' : '#f5f5f5',
        border: `1px solid ${context.isMinor ? '#90caf9' : '#ddd'}`,
        borderRadius: '6px',
        fontSize: '0.9rem',
        color: '#333'
      }}>
        {context.isMinor ? (
          <span>🔒 <strong>Minor mode:</strong> Parent/Teacher can view sessions</span>
        ) : (
          <span>🔒 <strong>Privacy:</strong> Teacher view is limited unless you opt in</span>
        )}
      </div>

      {/* Checkpoint Card (shown when step completes and teach-back should trigger) */}
      {showCheckpointCard && path && pathProgress && (
        <CheckpointCard
          title={getCurrentStep(pathProgress, path)?.title || "Checkpoint"}
          why="Teaching it back helps you remember and understand better."
          primaryLabel="Teach it back"
          onPrimary={() => {
            setShowTeachBackModal(true)
          }}
          secondaryLabel="Skip for now"
          onSecondary={() => {
            setShowCheckpointCard(false)
            setShowCompletionModal(true)
          }}
          calmMode={calmMode}
        />
      )}

      {/* Path Progress Banner */}
      {path && pathProgress && !pathProgress.pathCompleted && !showCheckpointCard && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f0f7ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                {getProgressSummary(pathProgress, path)}
              </div>
              {getCurrentStep(pathProgress, path) && (
                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {getCurrentStep(pathProgress, path)?.title}
                </div>
              )}
            </div>
            {getCurrentStep(pathProgress, path) && (
              <button
                onClick={() => {
                  const step = getCurrentStep(pathProgress, path)!
                  handleSend(step.prompt)
                }}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading ? '#ccc' : '#0066cc',
                  color: '#fff',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                {loading ? 'Loading...' : 'Next step'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Self-Check UI (shown after tutor responses, hidden if checkpoint card is showing in calm mode) */}
      {conversationHistory.length > 0 && 
       conversationHistory[conversationHistory.length - 1].role === 'tutor' && 
       !(calmMode && showCheckpointCard) && (
        <div style={{
          marginBottom: '1rem',
          padding: calmMode ? '0.75rem' : '1rem',
          background: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#666' }}>
            How do you feel about this?
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(["Ready", "NotYet", "Unsure"] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleSelfCheck(status)}
                style={{
                  padding: calmMode ? '0.5rem 0.875rem' : '0.625rem 1rem',
                  background: selfCheckStatus === status ? '#0066cc' : '#fff',
                  color: selfCheckStatus === status ? '#fff' : '#0066cc',
                  border: `1px solid ${selfCheckStatus === status ? '#0066cc' : '#0066cc'}`,
                  cursor: 'pointer',
                  borderRadius: '16px',
                  fontSize: calmMode ? '0.8rem' : '0.85rem',
                  fontWeight: selfCheckStatus === status ? 'bold' : 'normal'
                }}
              >
                {status === "NotYet" ? "Not yet" : status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: calmMode ? '1.5rem' : '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: calmMode ? '1.3rem' : '1.5rem' }}>
            Today: {context.subject} → {context.topic}
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>{context.objective}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Accessibility toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSaveAndStop}
              style={{
                padding: '0.5rem 1rem',
                background: '#666',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              Save & Stop
            </button>
            <button
              onClick={handleNewSession}
              style={{
                padding: '0.5rem 1rem',
                background: '#666',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div style={{ marginBottom: calmMode ? '1.5rem' : '2rem' }}>
        <div style={{
          minHeight: calmMode ? '350px' : '400px',
          maxHeight: calmMode ? '500px' : '600px',
          overflowY: 'auto',
          padding: calmMode ? '1.25rem' : '1.5rem',
          background: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {conversationHistory.length === 0 && (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Starting your learning session...
            </p>
          )}
          {conversationHistory.map((entry, i) => (
            <div key={i} style={{ marginBottom: calmMode ? '1.25rem' : '1.5rem' }}>
              <div
                style={{
                  padding: calmMode ? '0.875rem' : '1rem',
                  background: entry.role === 'learner' ? '#e3f2fd' : '#f1f8e9',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${entry.role === 'learner' ? '#2196f3' : '#4caf50'}`,
                  marginBottom: entry.role === 'tutor' ? '1rem' : '0'
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  {entry.role === 'learner' ? 'You' : 'Tutor'}:
                </strong>
                <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>{entry.message}</div>
              </div>
              
              {/* Learning Board below tutor response */}
              {entry.role === 'tutor' && learningBoard && i === conversationHistory.length - 1 && (
                <div style={{ marginTop: '1rem' }}>
                  {!showLearningBoard ? (
                    <button
                      onClick={() => setShowLearningBoard(true)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#fff',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        minHeight: `${TAP_MIN_PX}px`
                      }}
                    >
                      Show Thinking Board ({learningBoard.objects.length} objects)
                    </button>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Thinking Board</h3>
                        <button
                          onClick={() => setShowLearningBoard(false)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          Hide
                        </button>
                      </div>
                      <LearningBoardComponent
                        board={learningBoard}
                        calmMode={calmMode}
                        onToggleUncertainty={(objectId) => {
                          if (learningBoard) {
                            setLearningBoard(markUncertainty(learningBoard, objectId))
                          }
                        }}
                        onRemoveObject={(objectId) => {
                          if (learningBoard) {
                            setLearningBoard(removeObject(learningBoard, objectId))
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Next best step guidance after tutor messages */}
              {entry.role === 'tutor' && i === conversationHistory.length - 1 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#fff3cd',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#856404',
                  fontStyle: 'italic'
                }}>
                  💡 {getNextBestStep(styleProfile, lastAction, entry.message)}
                </div>
              )}
              
              {/* Action chips after tutor messages */}
              {entry.role === 'tutor' && i === conversationHistory.length - 1 && (
                <div style={{ marginTop: '1rem' }}>
                  {/* Voice-first input (primary) */}
                  {voiceSupported ? (
                    <PrimaryActionBar
                      primaryLabel={isListening ? '🎤 Listening...' : '🎤 Speak'}
                      onPrimary={handleVoiceToggle}
                      secondaryLabel={visibleChips.length > 0 ? visibleChips[0] : undefined}
                      onSecondary={visibleChips.length > 0 ? () => handleActionChip(visibleChips[0]) : undefined}
                      tertiary={
                        <button
                          onClick={() => setShowTypeDrawer(true)}
                          disabled={loading}
                          style={{
                            minHeight: `${TAP_MIN_PX}px`,
                            padding: '0.5rem 1rem',
                            background: '#f5f5f5',
                            color: '#666',
                            border: '1px solid #ddd',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                          }}
                        >
                          Type
                        </button>
                      }
                      readingMode={readingMode}
                      calmMode={calmMode || focusMode}
                      primaryDisabled={loading}
                    />
                  ) : (
                    <PrimaryActionBar
                      primaryLabel={visibleChips.length > 0 ? visibleChips[0] : 'Type'}
                      onPrimary={visibleChips.length > 0 ? () => handleActionChip(visibleChips[0]) : () => setShowTypeDrawer(true)}
                      secondaryLabel={visibleChips.length > 1 ? visibleChips[1] : undefined}
                      onSecondary={visibleChips.length > 1 ? () => handleActionChip(visibleChips[1]) : undefined}
                      readingMode={readingMode}
                      calmMode={calmMode || focusMode}
                      primaryDisabled={loading}
                    />
                  )}
                  
                  {/* Live transcript preview */}
                  {isListening && voiceTranscript && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#856404',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {voiceTranscript}
                    </div>
                  )}
                  
                  {/* Additional chips (hidden in focus mode, shown behind "More" otherwise) */}
                  {!focusMode && visibleChips.slice(voiceSupported ? 1 : 2).map((chip, chipIndex) => (
                    <button
                      key={chipIndex}
                      onClick={() => handleActionChip(chip)}
                      disabled={loading}
                      style={{
                        padding: calmMode ? '0.625rem 1rem' : '0.75rem 1.25rem',
                        border: '2px solid #ddd',
                        background: loading ? '#f5f5f5' : '#fff',
                        color: loading ? '#999' : '#000',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        borderRadius: '20px',
                        fontSize: calmMode ? '0.85rem' : '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = '#000'
                          e.currentTarget.style.background = '#f5f5f5'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = '#ddd'
                          e.currentTarget.style.background = '#fff'
                        }
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                  
                  {/* More chips button if there are hidden chips */}
                  {hiddenChips.length > 0 && !showMoreChips && (
                    <button
                      onClick={() => setShowMoreChips(true)}
                      disabled={loading}
                      style={{
                        padding: calmMode ? '0.625rem 1rem' : '0.75rem 1.25rem',
                        border: '2px solid #ddd',
                        background: loading ? '#f5f5f5' : '#fff',
                        color: loading ? '#999' : '#000',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        borderRadius: '20px',
                        fontSize: calmMode ? '0.85rem' : '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      More...
                    </button>
                  )}
                  
                  {/* Show hidden chips when "More" is clicked */}
                  {showMoreChips && hiddenChips.map((chip, chipIndex) => (
                    <button
                      key={`hidden-${chipIndex}`}
                      onClick={() => handleActionChip(chip)}
                      disabled={loading}
                      style={{
                        padding: calmMode ? '0.625rem 1rem' : '0.75rem 1.25rem',
                        border: '2px solid #ddd',
                        background: loading ? '#f5f5f5' : '#fff',
                        color: loading ? '#999' : '#000',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        borderRadius: '20px',
                        fontSize: calmMode ? '0.85rem' : '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setShowTypeDrawer(true)}
                    disabled={loading}
                    style={{
                      padding: calmMode ? '0.625rem 1rem' : '0.75rem 1.25rem',
                      border: '2px solid #ddd',
                      background: loading ? '#f5f5f5' : '#fff',
                      color: loading ? '#999' : '#000',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      borderRadius: '20px',
                      fontSize: calmMode ? '0.85rem' : '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    Type
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Type Drawer */}
        {showTypeDrawer && (
          <div style={{
            padding: '1rem',
            background: '#fff',
            border: '2px solid #ddd',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Type your message</h3>
              <button
                onClick={() => {
                  setShowTypeDrawer(false)
                  setTypeInput('')
                }}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            
            {/* One-line input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                placeholder="Say it or type it…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !typeInput.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading || !typeInput.trim() ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: loading || !typeInput.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
            
            {/* Quick inserts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {["I'm not sure", "Give me a hint", "Can you ask 1 question"].map((quickText) => (
                <button
                  key={quickText}
                  onClick={() => {
                    setTypeInput(quickText)
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    fontSize: '0.85rem'
                  }}
                >
                  {quickText}
                </button>
              ))}
            </div>
            
            {/* Voice not supported message (if applicable) */}
            {!voiceSupported && (
              <div style={{
                padding: '0.5rem',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '0.85rem',
                color: '#666',
                fontStyle: 'italic'
              }}>
                Voice input not supported in this browser
              </div>
            )}
            
            {!focusMode && !calmMode && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={requestAssessment}
                  onChange={(e) => setRequestAssessment(e.target.checked)}
                />
                Request Assessment
              </label>
            )}
          </div>
        )}
      </div>

      {/* Learning Board (XR-Ready) - Hidden by default in calm mode */}
      {learningBoard && (
        <div style={{ marginBottom: '2rem' }}>
          {!showLearningBoard ? (
            <button
              onClick={() => setShowLearningBoard(true)}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#f5f5f5',
                border: '2px solid #ddd',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                textAlign: 'left',
                minHeight: `${TAP_MIN_PX}px`
              }}
            >
              Show Thinking Board ({learningBoard.objects.length} objects)
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Thinking Board</h2>
                <button
                  onClick={() => setShowLearningBoard(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  Hide
                </button>
              </div>
              <LearningBoardComponent
                board={learningBoard}
                calmMode={calmMode}
                onToggleUncertainty={(objectId) => {
                  if (learningBoard) {
                    setLearningBoard(markUncertainty(learningBoard, objectId))
                  }
                }}
                onRemoveObject={(objectId) => {
                  if (learningBoard) {
                    setLearningBoard(removeObject(learningBoard, objectId))
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Thought Board Panel (Legacy) */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowBoard(!showBoard)}
          style={{
            width: '100%',
            padding: '1rem',
            background: showBoard ? '#f0f7ff' : '#f5f5f5',
            border: '2px solid #ddd',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: `${TAP_MIN_PX}px`
          }}
        >
          <span>Thought Board ({thoughtBoard?.cards.length || 0} cards)</span>
          <span>{showBoard ? '−' : '+'}</span>
        </button>
        
        {showBoard && thoughtBoard && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            {/* Board Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (conversationHistory.length > 0) {
                    const lastLearnerMessage = conversationHistory
                      .filter(e => e.role === 'learner')
                      .slice(-1)[0]?.message
                    if (lastLearnerMessage) {
                      const attemptCard = createLearnerAttemptCard(
                        lastLearnerMessage,
                        conversationHistory.length - 1
                      )
                      const updatedBoard = addCardToBoard(thoughtBoard, attemptCard)
                      setThoughtBoard(updatedBoard)
                    }
                  }
                }}
                disabled={conversationHistory.length === 0}
                style={{
                  minHeight: `${TAP_MIN_PX}px`,
                  padding: '0.75rem 1rem',
                  background: conversationHistory.length === 0 ? '#ccc' : '#0066cc',
                  color: '#fff',
                  border: 'none',
                  cursor: conversationHistory.length === 0 ? 'not-allowed' : 'pointer',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                Add My Attempt
              </button>
              <button
                onClick={() => {
                  const arranged = arrangeBoard(thoughtBoard)
                  setThoughtBoard(arranged)
                }}
                style={{
                  minHeight: `${TAP_MIN_PX}px`,
                  padding: '0.75rem 1rem',
                  background: '#fff',
                  color: '#0066cc',
                  border: '1px solid #0066cc',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                Arrange
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(thoughtBoard, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `thought-board-${thoughtBoard.boardId}-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{
                  minHeight: `${TAP_MIN_PX}px`,
                  padding: '0.75rem 1rem',
                  background: '#fff',
                  color: '#0066cc',
                  border: '1px solid #0066cc',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                Export
              </button>
            </div>
            
            {/* Cards */}
            {thoughtBoard.cards.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                No cards yet. Cards will appear as you learn.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {thoughtBoard.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardId(card.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedCardId && draggedCardId !== card.id) {
                        const cardIds = thoughtBoard.cards.map(c => c.id)
                        const draggedIndex = cardIds.indexOf(draggedCardId)
                        const targetIndex = cardIds.indexOf(card.id)
                        if (draggedIndex !== -1 && targetIndex !== -1) {
                          cardIds.splice(draggedIndex, 1)
                          cardIds.splice(targetIndex, 0, draggedCardId)
                          const reordered = reorderCards(thoughtBoard, cardIds)
                          setThoughtBoard(reordered)
                        }
                      }
                      setDraggedCardId(null)
                    }}
                    style={{
                      padding: '1rem',
                      background: card.type === 'Question' ? '#e3f2fd' :
                                  card.type === 'Example' ? '#f1f8e9' :
                                  card.type === 'Hint' ? '#fff3e0' :
                                  card.type === 'Rule' ? '#f3e5f5' :
                                  card.type === 'NextStep' ? '#e0f2f1' :
                                  '#f5f5f5',
                      border: `2px solid ${card.type === 'Question' ? '#2196f3' :
                                              card.type === 'Example' ? '#4caf50' :
                                              card.type === 'Hint' ? '#ff9800' :
                                              card.type === 'Rule' ? '#9c27b0' :
                                              card.type === 'NextStep' ? '#009688' :
                                              '#ddd'}`,
                      borderRadius: '8px',
                      cursor: 'move',
                      minHeight: `${TAP_MIN_PX}px`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                        {card.type}
                      </span>
                      <button
                        onClick={() => {
                          const updatedCards = thoughtBoard.cards.filter(c => c.id !== card.id)
                          setThoughtBoard({ ...thoughtBoard, cards: updatedCards })
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          color: '#999'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {card.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Skills Summary - Hidden in calm mode unless requested */}
      {!focusMode && (!calmMode || showSkillsPanel) && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Skill Graph Summary</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {calmMode && (
                <button
                  onClick={() => setShowSkillsPanel(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#666',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  Hide
                </button>
              )}
              <button
                onClick={loadSkills}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Refresh
              </button>
            </div>
          </div>
          {skills ? (
            <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
              {skills.skills && skills.skills.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {skills.skills.map((skill: any) => (
                    <div
                      key={skill.skillId}
                      style={{
                        padding: '0.75rem',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{skill.skillId}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Band: <strong>{skill.confidenceBand}</strong>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Exposures: {skill.exposures}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No skills tracked yet.</p>
              )}
            </div>
          ) : (
            <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px', color: '#666' }}>
              Skills will appear as you learn
            </div>
          )}
        </div>
      )}

      {/* Show Skills button in calm mode (hidden in focus mode) */}
      {!focusMode && calmMode && !showSkillsPanel && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              setShowSkillsPanel(true)
              loadSkills()
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            Show Skills
          </button>
        </div>
      )}

      {/* Teach-Back Modal */}
      {showTeachBackModal && context && (
        <TeachBackModal
          isOpen={showTeachBackModal}
          onClose={() => {
            setShowTeachBackModal(false)
            setShowCheckpointCard(false)
          }}
          onSubmit={handleTeachBackSubmit}
          topic={context.topic}
          microTopic={context.objective}
          calmMode={calmMode}
        />
      )}

      {/* Step Completion Modal */}
      {showCompletionModal && path && pathProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
              Nice — you did it! ✨
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              You completed this step. What would you like to do next?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  if (pathProgress.pathCompleted) {
                    setShowPathCompletion(true)
                  } else {
                    const nextStep = getCurrentStep(pathProgress, path)
                    if (nextStep) {
                      handleSend(nextStep.prompt)
                    }
                  }
                }}
                style={{
                  padding: '1rem',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                {pathProgress.pathCompleted ? 'View Summary' : 'Continue to Next Step'}
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  handleSend("Can you explain this back to me?")
                }}
                style={{
                  padding: '1rem',
                  background: '#f5f5f5',
                  color: '#000',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '1rem'
                }}
              >
                Explain it back
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  router.push('/learning/start')
                }}
                style={{
                  padding: '1rem',
                  background: '#fff',
                  color: '#666',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                Save & stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Path Completion Summary */}
      {showPathCompletion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
              Path Complete! 🎉
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Session Summary:
            </p>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              {(() => {
                const summaryJson = localStorage.getItem(`learning:sessionSummary:${sessionId}`)
                const summary = summaryJson ? JSON.parse(summaryJson) : []
                return summary.map((bullet: string, i: number) => (
                  <li key={i} style={{ marginBottom: '0.5rem', color: '#333' }}>
                    {bullet}
                  </li>
                ))
              })()}
            </ul>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPathCompletion(false)
                  router.push('/learning/start')
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontWeight: 'bold'
                }}
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
export default function LearningPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LearningPageContent />
    </Suspense>
  )
}
