import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import { TeacherNudge } from '../../../../../spine/learning/platform/store/StoreTypes'

const MAX_NUDGES = 10 // Bounded to 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, learnerId, nudgeText } = body

    if (!teacherId || !learnerId || !nudgeText) {
      return NextResponse.json({ error: 'teacherId, learnerId, and nudgeText are required' }, { status: 400 })
    }

    const store = getStore()
    const learnerState = store.getLearnerState(learnerId)

    if (!learnerState) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    // Create nudge
    const nudge: TeacherNudge = {
      text: nudgeText,
      timestampIso: new Date().toISOString(),
      teacherId
    }

    // Add to learner state (bounded to 10)
    const existingNudges = learnerState.teacherNudges || []
    const updatedNudges = [...existingNudges, nudge].slice(-MAX_NUDGES)

    const updatedState = {
      ...learnerState,
      teacherNudges: updatedNudges
    }

    store.saveLearnerState(updatedState)

    return NextResponse.json({ success: true, nudge })
  } catch (error) {
    console.error('Error sending nudge:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}








































