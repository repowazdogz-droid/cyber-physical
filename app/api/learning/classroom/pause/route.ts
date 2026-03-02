import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../../spine/learning/platform/store/InMemoryStoreSingleton'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, learnerId, paused } = body

    if (teacherId === undefined || learnerId === undefined || paused === undefined) {
      return NextResponse.json({ error: 'teacherId, learnerId, and paused are required' }, { status: 400 })
    }

    const store = getStore()
    const learnerState = store.getLearnerState(learnerId)

    if (!learnerState) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    // Update pause state
    const updatedState = {
      ...learnerState,
      pausedByTeacher: paused === true
    }

    store.saveLearnerState(updatedState)

    return NextResponse.json({ success: true, paused })
  } catch (error) {
    console.error('Error pausing/resuming learner:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}








































