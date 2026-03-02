import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const learnerId = searchParams.get('learnerId')
    
    if (!learnerId) {
      return NextResponse.json(
        { error: 'Missing learnerId parameter' },
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
    
    // Return skill graph summary (bands and audit info)
    const skillSummary = Array.from(learnerState.skillGraph.skills.entries()).map(([skillId, state]) => ({
      skillId,
      exposures: state.exposures,
      confidenceBand: state.confidenceBand,
      recentSignalsCount: state.recentSignals.length,
      lastEvidenceTimestamp: state.lastEvidenceTimestamp
    }))
    
    return NextResponse.json({
      learnerId,
      skills: skillSummary,
      lastUpdated: learnerState.skillGraph.lastUpdated
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








































