/**
 * Thought Types
 * 
 * Types for thought cards and boards.
 * Bounded, deterministic, exportable.
 * 
 * Version: 0.1
 */

export type ThoughtCardType = 
  | "Question" 
  | "Hint" 
  | "Example" 
  | "Rule" 
  | "NextStep" 
  | "LearnerAttempt"

export interface ThoughtCard {
  id: string
  type: ThoughtCardType
  text: string
  createdAtIso: string
  sourceTurnIndex?: number // Which conversation turn this came from
  stepId?: string // Which guided path step this came from
}

export interface ThoughtBoard {
  boardId: string
  cards: ThoughtCard[] // Bounded to max 60
  lastArrangedIso?: string
  createdAtIso: string
}

const MAX_CARDS = 60

/**
 * Creates a new thought board.
 */
export function createThoughtBoard(): ThoughtBoard {
  return {
    boardId: `board-${Date.now()}`,
    cards: [],
    createdAtIso: new Date().toISOString()
  }
}

/**
 * Adds a card to the board, enforcing bounds (FIFO eviction).
 */
export function addCardToBoard(board: ThoughtBoard, card: ThoughtCard): ThoughtBoard {
  const cards = [...board.cards, card]
  
  // Enforce bounds (FIFO - remove oldest if over limit)
  const boundedCards = cards.length > MAX_CARDS
    ? cards.slice(-MAX_CARDS)
    : cards
  
  return {
    ...board,
    cards: boundedCards,
    lastArrangedIso: undefined // Reset arrangement when new card added
  }
}

/**
 * Removes a card from the board.
 */
export function removeCardFromBoard(board: ThoughtBoard, cardId: string): ThoughtBoard {
  return {
    ...board,
    cards: board.cards.filter(card => card.id !== cardId),
    lastArrangedIso: undefined
  }
}

/**
 * Reorders cards in the board.
 */
export function reorderCards(board: ThoughtBoard, cardIds: string[]): ThoughtBoard {
  const cardMap = new Map(board.cards.map(card => [card.id, card]))
  const reorderedCards = cardIds
    .map(id => cardMap.get(id))
    .filter((card): card is ThoughtCard => card !== undefined)
  
  // Add any cards not in the reorder list (shouldn't happen, but safety)
  const reorderedIds = new Set(cardIds)
  const remainingCards = board.cards.filter(card => !reorderedIds.has(card.id))
  
  return {
    ...board,
    cards: [...reorderedCards, ...remainingCards],
    lastArrangedIso: new Date().toISOString()
  }
}








































