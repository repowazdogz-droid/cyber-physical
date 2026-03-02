export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import { ViewerRole } from '../../../../../spine/learning/platform/store/StoreTypes'
import { getVisibilityPolicy, filterSessionForViewer, filterLearnerStateForViewer } from '../../../../../spine/learning/platform/store/VisibilityFilters'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const learnerId = searchParams.get('learnerId')
    const role = searchParams.get('role') as ViewerRole
    const optInTeacherAccess = searchParams.get('optInTeacherAccess') === 'true'

    if (!learnerId) {
      return NextResponse.json({ error: 'learnerId is required' }, { status: 400 })
    }

    if (!role || !['Teacher', 'Parent', 'Institution'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const store = getStore()
    const learnerState = store.getLearnerState(learnerId)

    if (!learnerState) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    // Get visibility policy
    const visibilityPolicy = getVisibilityPolicy(learnerState.learnerProfile, optInTeacherAccess)

    // Check access
    let hasAccess = false
    switch (role) {
      case 'Parent':
        hasAccess = visibilityPolicy.parentCanView
        break
      case 'Teacher':
        hasAccess = visibilityPolicy.teacherCanView
        break
      case 'Institution':
        hasAccess = visibilityPolicy.institutionCanView
        break
    }

    if (!hasAccess) {
      return NextResponse.json({
        visibilityNote: 'Access denied for this role. For adult learners, teacher access requires opt-in from the learner.'
      })
    }

    // Filter learner state
    const filteredState = filterLearnerStateForViewer(learnerState, role, visibilityPolicy)

    // Get last 5 sessions
    const allSessions = store.listSessions(learnerId, 5)
    const filteredSessions = allSessions.map(session =>
      filterSessionForViewer(session, role, visibilityPolicy)
    )

    // Build summary
    const latestContext = filteredSessions.length > 0
      ? {
          subject: filteredSessions[0].goal.subject,
          topic: filteredSessions[0].goal.topic,
          objective: filteredSessions[0].goal.objective
        }
      : undefined

    // Extract session summaries, checkpoints, and self-checks
    const lastSessions = filteredSessions.map(session => {
      // Get last checkpoint (from session summary or last step)
      const lastCheckpoint = session.sessionSummary
        ? session.sessionSummary.find(s => s.includes('Step') || s.includes('checkpoint'))
        : undefined

      // Get last self-check from session
      const selfCheck = session.selfChecks && session.selfChecks.length > 0
        ? session.selfChecks[session.selfChecks.length - 1]
        : undefined

      return {
        sessionId: session.sessionId,
        goal: session.goal,
        sessionSummary: session.sessionSummary,
        lastCheckpoint: lastCheckpoint,
        selfCheck: selfCheck ? {
          timestamp: selfCheck.timestamp,
          status: selfCheck.status
        } : undefined,
        createdAtIso: session.createdAtIso
      }
    })

    // Build self-check trend (last 5)
    const selfCheckTrend: Array<{ timestamp: string; status: "Ready" | "NotYet" | "Unsure" }> = []
    for (const session of filteredSessions) {
      if (session.selfChecks) {
        for (const check of session.selfChecks) {
          selfCheckTrend.push({
            timestamp: check.timestamp,
            status: check.status
          })
        }
      }
    }
    selfCheckTrend.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const last5SelfChecks = selfCheckTrend.slice(0, 5)

    // Build skill bands summary (no raw signals)
    const skillBandsSummary: Array<{ skillId: string; confidenceBand: "Low" | "Medium" | "High"; exposures: number }> = []
    if (filteredState.skillGraph && filteredState.skillGraph.skills) {
      for (const [skillId, skillState] of filteredState.skillGraph.skills.entries()) {
        skillBandsSummary.push({
          skillId,
          confidenceBand: skillState.confidenceBand,
          exposures: skillState.exposures
        })
      }
    }

    return NextResponse.json({
      latestContext,
      lastSessions,
      skillBandsSummary,
      selfCheckTrend: last5SelfChecks.length > 0 ? last5SelfChecks : undefined
    })
  } catch (error) {
    console.error('Error in teacher summary API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}













