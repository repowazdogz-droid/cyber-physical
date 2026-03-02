import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import { runSessionAndPersist } from '../../../../spine/learning/platform/session/SessionRunner'
import { LearningSessionRequest } from '../../../../spine/learning/platform/session/SessionTypes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.sessionId || !body.learner || !body.goal || !body.mode) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, learner, goal, mode' },
        { status: 400 }
      )
    }
    
    // Build request
    const sessionRequest: LearningSessionRequest = {
      sessionId: body.sessionId,
      learner: body.learner,
      contextFlags: body.contextFlags || {},
      goal: body.goal,
      mode: body.mode,
      utterance: body.utterance,
      requestedAssessment: body.requestedAssessment || null,
      timestampIso: body.timestampIso || new Date().toISOString(),
      responseStyleHint: body.responseStyleHint || undefined
    }
    
    // Get store instance
    const store = getStore()
    
    // Run session and persist
    const output = runSessionAndPersist(sessionRequest, store)
    
    // Return output (excluding dialogueState for API response - it's internal)
    return NextResponse.json({
      tutorTurn: output.tutorTurn,
      assessment: output.assessment,
      observations: output.observations,
      skillGraphDelta: output.skillGraphDelta,
      sessionTrace: output.sessionTrace
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'refused'
      },
      { status: 500 }
    )
  }
}

