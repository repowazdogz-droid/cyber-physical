import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../../spine/learning/platform/store/InMemoryStoreSingleton'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.sessionId || !body.summary) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, summary' },
        { status: 400 }
      )
    }
    
    const store = getStore()
    const session = store.getSession(body.sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Update session with summary
    const updatedSession = {
      ...session,
      sessionSummary: body.summary
    }
    
    // Re-save the session (this is a simple approach; in production might use update method)
    store.appendSession(updatedSession)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}








































