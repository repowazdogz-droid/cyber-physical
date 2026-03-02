/**
 * Thought Arranger
 * 
 * Deterministic grouping and ordering of thought cards.
 * No randomness, stable results.
 * 
 * Version: 0.1
 */

import { ThoughtBoard, ThoughtCard, ThoughtCardType } from './ThoughtTypes'

/**
 * Type priority for ordering (lower = earlier).
 */
const TYPE_PRIORITY: Record<ThoughtCardType, number> = {
  Question: 1,
  Hint: 2,
  Example: 3,
  Rule: 4,
  NextStep: 5,
  LearnerAttempt: 6
}

/**
 * Arranges a thought board deterministically.
 * Groups by type, orders by priority, then by timestamp.
 */
export function arrangeBoard(board: ThoughtBoard): ThoughtBoard {
  // Group by type
  const grouped = new Map<ThoughtCardType, ThoughtCard[]>()
  
  for (const card of board.cards) {
    if (!grouped.has(card.type)) {
      grouped.set(card.type, [])
    }
    grouped.get(card.type)!.push(card)
  }
  
  // Sort within each group by timestamp (oldest first)
  for (const [type, cards] of grouped.entries()) {
    cards.sort((a, b) => 
      new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime()
    )
  }
  
  // Order groups by type priority
  const orderedTypes = Array.from(grouped.keys()).sort(
    (a, b) => TYPE_PRIORITY[a] - TYPE_PRIORITY[b]
  )
  
  // Flatten into ordered array
  const arrangedCards: ThoughtCard[] = []
  for (const type of orderedTypes) {
    arrangedCards.push(...grouped.get(type)!)
  }
  
  return {
    ...board,
    cards: arrangedCards,
    lastArrangedIso: new Date().toISOString()
  }
}

/**
 * Gets cards grouped by type (for display).
 */
export function getCardsByType(board: ThoughtBoard): Map<ThoughtCardType, ThoughtCard[]> {
  const grouped = new Map<ThoughtCardType, ThoughtCard[]>()
  
  for (const card of board.cards) {
    if (!grouped.has(card.type)) {
      grouped.set(card.type, [])
    }
    grouped.get(card.type)!.push(card)
  }
  
  return grouped
}








































