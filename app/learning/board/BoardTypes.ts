/**
 * Board Types
 * 
 * Types for the Learning Board state.
 * Render-agnostic, XR-ready.
 * 
 * Version: 0.1
 */

import { ThoughtObject } from './ThoughtObjects'

/**
 * Simple layout ordering (not spatial yet, but XR-ready).
 */
export interface BoardLayout {
  order: string[] // Array of ThoughtObject IDs in display order
  groups?: Array<{
    groupId: string
    label?: string
    objectIds: string[]
  }>
}

/**
 * Learning Board state.
 * Derived from session activity, persisted, render-agnostic.
 */
export interface LearningBoard {
  boardId: string
  sessionId: string
  pathId?: string
  currentStepId?: string
  objects: ThoughtObject[]
  layout: BoardLayout
  lastUpdated: string
  createdAt: string
}

/**
 * Session context for initializing a board.
 */
export interface BoardSessionContext {
  sessionId: string
  pathId?: string
  currentStepId?: string
  learnerId: string
}

/**
 * Creates a new empty board.
 */
export function createEmptyBoard(context: BoardSessionContext): LearningBoard {
  return {
    boardId: `board-${Date.now()}-${context.sessionId}`,
    sessionId: context.sessionId,
    pathId: context.pathId,
    currentStepId: context.currentStepId,
    objects: [],
    layout: {
      order: []
    },
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
}








































