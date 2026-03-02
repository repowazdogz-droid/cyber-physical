export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton'
import { LearningBoard } from '../../../learning/board/BoardTypes'
import { ThoughtObject, extractText } from '../../../learning/board/ThoughtObjects'
import { loadPersistedState } from '../../../learning/persist/LearningPersist'

/**
 * GET /api/learning/thoughtObjects?learnerId=...
 * 
 * Returns ThoughtObjects for the given learner in JSON format.
 * Used by Unity/Vision Pro for live sync.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')

    if (!learnerId) {
      return NextResponse.json({ error: 'learnerId is required' }, { status: 400 })
    }

    // Load persisted state to get learning board
    // In a real implementation, you'd load from the store
    // For now, we'll return an empty array or demo data
    const persisted = loadPersistedState()
    
    if (!persisted?.learningBoard) {
      return NextResponse.json({ objects: [] })
    }

    const board = persisted.learningBoard

    // Convert ThoughtObjects to DTO format
    const objects = board.objects.map(obj => {
      const contentText = typeof obj.content === 'string' 
        ? obj.content 
        : extractText(obj.content)

      return {
        id: obj.id,
        type: obj.type,
        contentText: contentText,
        source: obj.source,
        confidence: obj.confidence || 'unknown',
        relatedStepId: obj.relatedStepId,
        timestampIso: obj.timestamp,
        ephemeral: obj.ephemeral || false
      }
    })

    return NextResponse.json({ objects })
  } catch (error) {
    console.error('Error fetching ThoughtObjects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}













