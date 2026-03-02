export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import { loadPersistedState } from '../../../learning/persist/LearningPersist'
import { LearningBoard } from '../../../learning/board/BoardTypes'
import { ThoughtObject, extractText } from '../../../learning/board/ThoughtObjects'
import { AgeBand } from '../../../../spine/learning/platform/LearnerTypes'

/**
 * GET /api/learning/explainBack?learnerId=...&thoughtId=...
 * 
 * Returns a calm, age/ND-tuned explain-back prompt for a ThoughtObject.
 * Never "grades," just guides.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')
    const thoughtId = searchParams.get('thoughtId')

    if (!learnerId || !thoughtId) {
      return NextResponse.json({ error: 'learnerId and thoughtId are required' }, { status: 400 })
    }

    // Load persisted state to get learning board
    const persisted = loadPersistedState()
    
    if (!persisted?.learningBoard) {
      return NextResponse.json({ error: 'Learning board not found' }, { status: 404 })
    }

    const board = persisted.learningBoard
    const thoughtObject = board.objects.find(obj => obj.id === thoughtId)

    if (!thoughtObject) {
      return NextResponse.json({ error: 'Thought object not found' }, { status: 404 })
    }

    // Get learner profile for age/ND tuning
    const store = getStore()
    const learnerState = store.getLearnerState(learnerId)
    const ageBand = learnerState?.learnerProfile.ageBand || AgeBand.ADULT
    const isMinor = learnerState?.learnerProfile.safety.minor || false

    // Generate age/ND-tuned prompt (calm, short, guiding)
    const prompt = generateExplainBackPrompt(thoughtObject, ageBand, isMinor)

    return NextResponse.json({
      prompt,
      thoughtId,
      ageBand,
      isMinor
    })
  } catch (error) {
    console.error('Error generating explain-back prompt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generates an age/ND-tuned explain-back prompt.
 * Short, calm, guiding. Never "grades."
 */
function generateExplainBackPrompt(
  thoughtObject: ThoughtObject,
  ageBand: AgeBand,
  isMinor: boolean
): string {
  const type = thoughtObject.type
  const contentText = typeof thoughtObject.content === 'string'
    ? thoughtObject.content
    : extractText(thoughtObject.content)

  // Age/ND tuning: shorter for younger, calmer for all
  const isYoung = ageBand === AgeBand.SIX_TO_NINE || ageBand === AgeBand.TEN_TO_TWELVE

  switch (type) {
    case "Question":
      return isYoung
        ? "Can you tell me what this question is asking?"
        : "Can you explain what this question is asking?"

    case "Example":
      return isYoung
        ? "Can you tell me about this example in your own words?"
        : "Can you explain this example in your own words?"

    case "LearnerAttempt":
      return isYoung
        ? "Can you tell me more about what you were thinking?"
        : "Can you explain your thinking here?"

    case "Uncertainty":
      return isYoung
        ? "What would help you feel better about this?"
        : "What would help you feel more sure about this?"

    case "TutorHint":
      return isYoung
        ? "Can you tell me what this hint means?"
        : "Can you explain what this hint means?"

    case "Evidence":
      return isYoung
        ? "Can you tell me what this shows?"
        : "Can you explain what this evidence shows?"

    case "Reflection":
      return isYoung
        ? "Can you tell me what you learned?"
        : "Can you explain what you learned?"

    default:
      return isYoung
        ? "Can you tell me about this in your own words?"
        : "Can you explain this in your own words?"
  }
}













