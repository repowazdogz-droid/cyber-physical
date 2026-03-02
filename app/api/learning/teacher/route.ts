import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import {
  getVisibilityPolicy,
  filterSessionForViewer,
  filterLearnerStateForViewer
} from '../../../../spine/learning/platform/store/VisibilityFilters'
import { ViewerRole } from '../../../../spine/learning/platform/store/StoreTypes'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const learnerId = searchParams.get('learnerId')
    const role = searchParams.get('role') as ViewerRole
    const optInTeacherAccess = searchParams.get('optInTeacherAccess') === 'true'
    
    if (!learnerId || !role) {
      return NextResponse.json(
        { error: 'Missing learnerId or role parameter' },
        { status: 400 }
      )
    }
    
    const store = getStore()
    const learnerState = store.getLearnerState(learnerId)
    
    if (!learnerState) {
      return NextResponse.json(
        { error: 'Learner not found' },
        { status: 404 }
      )
    }
    
    // Get visibility policy
    const policy = getVisibilityPolicy(learnerState.learnerProfile, optInTeacherAccess)
    
    // Filter learner state
    const filteredState = filterLearnerStateForViewer(learnerState, role, policy)
    
    // Get and filter sessions
    const sessions = store.listSessions(learnerId, 50)
    const filteredSessions = sessions.map(session =>
      filterSessionForViewer(session, role, policy)
    )
    
    return NextResponse.json({
      learnerId,
      role,
      visibilityPolicy: policy,
      learnerState: filteredState,
      sessions: filteredSessions
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}








































