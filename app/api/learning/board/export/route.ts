export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { loadPersistedState } from '../../../../learning/persist/LearningPersist'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const learnerId = searchParams.get('learnerId')
    
    if (!learnerId) {
      return NextResponse.json({ error: 'learnerId is required' }, { status: 400 })
    }
    
    // Load persisted state (client-side would use localStorage, but for API we'd need store lookup)
    // For now, return a message that client should use localStorage
    // In production, this would look up from the store
    
    return NextResponse.json({
      message: 'Please use client-side export (localStorage)',
      note: 'Board export is available via the UI Export button'
    })
  } catch (error) {
    console.error('Error exporting board:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}













