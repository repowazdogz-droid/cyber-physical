import { NextRequest, NextResponse } from 'next/server'
import { resolveInviteCode } from '../../../../../spine/learning/platform/store/SessionLinks'
import { getStore } from '../../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import { getVisibilityPolicy } from '../../../../../spine/learning/platform/store/VisibilityFilters'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json({ error: 'inviteCode is required' }, { status: 400 })
    }

    const invite = resolveInviteCode(inviteCode)

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
    }

    const store = getStore()
    const learnerState = store.getLearnerState(invite.learnerId)

    if (!learnerState) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    // Get visibility policy for teacher
    const visibilityPolicy = getVisibilityPolicy(learnerState.learnerProfile, true) // Opt-in assumed for linked teacher

    // Determine allowed controls
    const allowedControls = {
      canPause: visibilityPolicy.teacherCanView,
      canNudge: visibilityPolicy.teacherCanView,
      canViewSessions: visibilityPolicy.teacherCanView
    }

    return NextResponse.json({
      learnerId: invite.learnerId,
      teacherId: invite.teacherId,
      visibilityPolicy: {
        isMinor: visibilityPolicy.isMinor,
        teacherCanView: visibilityPolicy.teacherCanView
      },
      allowedControls
    })
  } catch (error) {
    console.error('Error resolving invite code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}








































