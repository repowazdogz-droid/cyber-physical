/**
 * Board Reducer
 * 
 * Pure functions for managing board state.
 * NO side effects, NO async, NO API calls.
 * XR-safe by design.
 * 
 * Version: 0.1
 */

import { LearningBoard, BoardLayout } from './BoardTypes'
import { ThoughtObject } from './ThoughtObjects'

const MAX_OBJECTS = 50 // Bounded to prevent unbounded growth

/**
 * Initializes a new board from session context.
 */
export function initializeBoard(context: {
  sessionId: string
  pathId?: string
  currentStepId?: string
  learnerId: string
}): LearningBoard {
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

/**
 * Adds a thought object to the board.
 * Enforces bounds (FIFO eviction if over limit).
 */
export function addThoughtObject(
  board: LearningBoard,
  object: ThoughtObject
): LearningBoard {
  // Check if object already exists (by ID)
  const existingIndex = board.objects.findIndex(o => o.id === object.id)
  if (existingIndex !== -1) {
    // Update existing object
    const updatedObjects = [...board.objects]
    updatedObjects[existingIndex] = object
    
    return {
      ...board,
      objects: updatedObjects,
      layout: {
        ...board.layout,
        order: board.layout.order.includes(object.id)
          ? board.layout.order
          : [...board.layout.order, object.id]
      },
      lastUpdated: new Date().toISOString()
    }
  }
  
  // Add new object
  let objects = [...board.objects, object]
  
  // Enforce bounds (FIFO - remove oldest ephemeral objects first, then oldest overall)
  if (objects.length > MAX_OBJECTS) {
    // First, try to remove ephemeral objects
    const ephemeralObjects = objects.filter(o => o.ephemeral)
    const nonEphemeralObjects = objects.filter(o => !o.ephemeral)
    
    if (ephemeralObjects.length > 0) {
      // Remove oldest ephemeral
      ephemeralObjects.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      ephemeralObjects.shift()
      objects = [...ephemeralObjects, ...nonEphemeralObjects]
    }
    
    // If still over limit, remove oldest overall
    if (objects.length > MAX_OBJECTS) {
      objects.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      objects = objects.slice(-MAX_OBJECTS)
    }
  }
  
  // Update layout order
  const order = board.layout.order.includes(object.id)
    ? board.layout.order
    : [...board.layout.order, object.id]
  
  // Remove any order entries for objects that no longer exist
  const validOrder = order.filter(id => objects.some(o => o.id === id))
  
  return {
    ...board,
    objects,
    layout: {
      ...board.layout,
      order: validOrder
    },
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Groups objects together.
 */
export function groupObjects(
  board: LearningBoard,
  groupId: string,
  objectIds: string[],
  label?: string
): LearningBoard {
  const existingGroups = board.layout.groups || []
  
  // Remove objects from other groups
  const updatedGroups = existingGroups.map(group => ({
    ...group,
    objectIds: group.objectIds.filter(id => !objectIds.includes(id))
  })).filter(group => group.objectIds.length > 0)
  
  // Add or update group
  const groupIndex = updatedGroups.findIndex(g => g.groupId === groupId)
  if (groupIndex !== -1) {
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      objectIds: [...updatedGroups[groupIndex].objectIds, ...objectIds],
      label
    }
  } else {
    updatedGroups.push({
      groupId,
      label,
      objectIds
    })
  }
  
  return {
    ...board,
    layout: {
      ...board.layout,
      groups: updatedGroups
    },
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Marks an object as uncertain (updates confidence to low/unknown).
 */
export function markUncertainty(
  board: LearningBoard,
  objectId: string
): LearningBoard {
  const objects = board.objects.map(obj => {
    if (obj.id === objectId) {
      function coerceConfidence(x: unknown): "low" | "medium" | "high" | "unknown" {
        return (x === "low" || x === "medium" || x === "high" || x === "unknown")
          ? x
          : "unknown";
      }
      const confidenceValue = obj.type === 'Uncertainty' ? 'unknown' : 'low';
      return {
        ...obj,
        confidence: coerceConfidence(confidenceValue)
      }
    }
    return obj
  })
  
  return {
    ...board,
    objects,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Advances to the next step (updates currentStepId).
 */
export function advanceStep(
  board: LearningBoard,
  nextStepId: string
): LearningBoard {
  return {
    ...board,
    currentStepId: nextStepId,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Prunes ephemeral objects (removes objects marked as ephemeral).
 */
export function pruneEphemeral(board: LearningBoard): LearningBoard {
  const objects = board.objects.filter(obj => !obj.ephemeral)
  
  // Update layout order to remove pruned objects
  const order = board.layout.order.filter(id => objects.some(o => o.id === id))
  
  // Update groups to remove pruned objects
  const groups = board.layout.groups?.map(group => ({
    ...group,
    objectIds: group.objectIds.filter(id => objects.some(o => o.id === id))
  })).filter(group => group.objectIds.length > 0)
  
  return {
    ...board,
    objects,
    layout: {
      order,
      groups
    },
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Reorders objects in the layout.
 */
export function reorderObjects(
  board: LearningBoard,
  newOrder: string[]
): LearningBoard {
  // Validate that all IDs in newOrder exist
  const validOrder = newOrder.filter(id => board.objects.some(o => o.id === id))
  
  // Add any missing objects to the end
  const missingIds = board.objects
    .filter(o => !validOrder.includes(o.id))
    .map(o => o.id)
  
  return {
    ...board,
    layout: {
      ...board.layout,
      order: [...validOrder, ...missingIds]
    },
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Removes an object from the board.
 */
export function removeObject(
  board: LearningBoard,
  objectId: string
): LearningBoard {
  const objects = board.objects.filter(o => o.id !== objectId)
  const order = board.layout.order.filter(id => id !== objectId)
  const groups = board.layout.groups?.map(group => ({
    ...group,
    objectIds: group.objectIds.filter(id => id !== objectId)
  })).filter(group => group.objectIds.length > 0)
  
  return {
    ...board,
    objects,
    layout: {
      order,
      groups
    },
    lastUpdated: new Date().toISOString()
  }
}




