/**
 * Learning Persistence
 * 
 * Handles persistence of learning state using localStorage.
 * Deterministic keys, bounded storage.
 * 
 * Version: 0.1
 */

import { LearningContext } from '../types'
import { PathProgress } from '../paths/GuidedPathRunner'
import { ThoughtBoard } from '../thoughts/ThoughtTypes'
import { LearningBoard } from '../board/BoardTypes'

export interface AccessibilityPreferences {
  calmMode: boolean
  highContrast: boolean
  reducedMotion: boolean
  readingMode?: 'calm' | 'standard' | 'dense'
  focusMode?: boolean
}

export interface PersistedLearningState {
  lastContext: LearningContext
  pathProgress?: PathProgress
  lastSessionId: string
  lastTurns: Array<{
    role: 'learner' | 'tutor'
    message: string
    timestamp: string
  }>
  lastUpdated: string
  accessibility?: AccessibilityPreferences
  thoughtBoard?: ThoughtBoard // Bounded to max 60 cards (legacy)
  boardId?: string
  learningBoard?: LearningBoard // New XR-ready board
}

const STORAGE_KEY = 'learning:persistedState'
const MAX_LAST_TURNS = 10

/**
 * Loads persisted learning state from localStorage.
 */
export function loadPersistedState(): PersistedLearningState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }
    
    const parsed = JSON.parse(stored)
    
    // Validate structure
    if (!parsed.lastContext || !parsed.lastSessionId) {
      return null
    }
    
    return parsed as PersistedLearningState
  } catch (e) {
    // Invalid or corrupted data
    return null
  }
}

/**
 * Saves learning state to localStorage.
 */
export function savePersistedState(state: PersistedLearningState): void {
  try {
    // Enforce bounds on lastTurns
    const boundedState: PersistedLearningState = {
      ...state,
      lastTurns: state.lastTurns.slice(-MAX_LAST_TURNS),
      lastUpdated: new Date().toISOString()
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boundedState))
  } catch (e) {
    // Silently fail if storage is unavailable
    console.warn('Failed to persist learning state:', e)
  }
}

/**
 * Updates lastTurns in persisted state.
 */
export function updateLastTurns(
  turns: Array<{ role: 'learner' | 'tutor'; message: string; timestamp: string }>
): void {
  const state = loadPersistedState()
  if (state) {
    savePersistedState({
      ...state,
      lastTurns: turns.slice(-MAX_LAST_TURNS)
    })
  }
}

/**
 * Clears persisted state.
 */
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    // Silently fail
  }
}

/**
 * Appends ThoughtObjects to Learning Board.
 * Bounded (board max 50 objects), deterministic order append.
 */
export async function appendThoughtObjectsToBoard(
  thoughtObjects: Array<{
    id: string;
    type: string;
    content: string | { title: string; body: string };
    source: string;
    timestamp: string;
    confidence?: string;
  }>,
  sessionId?: string
): Promise<void> {
  try {
    const state = loadPersistedState();
    if (!state) {
      // Initialize if no state exists
      const newState: PersistedLearningState = {
        lastContext: {
          ageBand: 'adult' as any,
          isMinor: false,
          subject: 'uav',
          topic: 'safe-landing',
          objective: 'decision-kernel-demo',
          tutorMode: 'Socratic' as any,
          starterUtterance: 'UAV decision kernel demo'
        },
        lastSessionId: sessionId || `uav-demo-${Date.now()}`,
        lastTurns: [],
        lastUpdated: new Date().toISOString(),
        learningBoard: {
          boardId: `board-uav-${Date.now()}`,
          sessionId: sessionId || `uav-demo-${Date.now()}`,
          objects: [],
          layout: { order: [] },
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      };
      savePersistedState(newState);
      return appendThoughtObjectsToBoard(thoughtObjects, sessionId);
    }

    // Get or create learning board
    let board = state.learningBoard;
    if (!board) {
      board = {
        boardId: `board-${Date.now()}`,
        sessionId: sessionId || state.lastSessionId,
        objects: [],
        layout: { order: [] },
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    }

    // Import reducer function (dynamic to avoid circular deps)
    const { addThoughtObject } = await import('../board/BoardReducer');
    
    // Add each thought object (reducer handles bounds)
    let updatedBoard = board;
    for (const obj of thoughtObjects) {
      updatedBoard = addThoughtObject(updatedBoard, obj as any);
    }

    // Save updated state
    savePersistedState({
      ...state,
      learningBoard: updatedBoard
    });
  } catch (e) {
    console.warn('Failed to append thought objects to board:', e);
    throw e;
  }
}

