# Learning Board (XR-Ready)

## Overview

The Learning Board is a pure application/service layer component that externalizes thinking into manipulable Thought Objects. It is designed to be XR-ready from the ground up, with no UI assumptions tied to screen size or 2D rendering.

## Architecture

### Pure Data Types
- **ThoughtObjects.ts**: Defines 7 thought object types (LearnerAttempt, TutorHint, Example, Question, Evidence, Uncertainty, Reflection)
- **BoardTypes.ts**: Defines board state structure (render-agnostic, layout is abstract)

### Pure Functions
- **BoardReducer.ts**: All board operations are pure functions with no side effects
  - `initializeBoard()`: Creates new board
  - `addThoughtObject()`: Adds object (bounded, FIFO eviction)
  - `groupObjects()`: Groups objects together
  - `markUncertainty()`: Marks object as uncertain
  - `advanceStep()`: Updates current step
  - `pruneEphemeral()`: Removes ephemeral objects
  - `reorderObjects()`: Reorders objects
  - `removeObject()`: Removes object

### UI Component
- **LearningBoard.tsx**: 2D React component (default view)
  - ND-first: 3-5 visible objects max
  - One column layout
  - Clear type labels (icon + word)
  - "I'm unsure" toggle
  - No drag-and-drop yet (but structure allows it)

## XR Mapping

### Current State (2D)
- Objects rendered as cards in a single column
- Layout is abstract (order/group, not pixels)
- Objects are addressable by ID

### Future XR Mapping
The board structure is designed to map cleanly to Vision Pro / GameOS:

1. **Spatial Layout**: The abstract `layout.order` and `layout.groups` can be mapped to 3D positions
2. **Object Manipulation**: Objects are pure data structures, can be rendered as 3D cards, holograms, or spatial UI
3. **GameOS Integration**: GameOS can operate on objects via their IDs, groups, and metadata
4. **No Screen Assumptions**: All layout is abstract, no pixel coordinates or screen-size dependencies

### Example XR Mapping
```typescript
// Current (2D)
layout: { order: ['obj1', 'obj2', 'obj3'] }

// Future (XR)
// GameOS can map order to:
// - Z-depth (closer = more recent)
// - Circular arrangement
// - Spatial grouping
// - Hand tracking for manipulation
```

## Integration Points

### Session → Board
- Board observes session activity
- Session does NOT depend on board
- After each tutor turn: Convert outputs to ThoughtObjects
- After each learner input: Create LearnerAttempt object
- StyleEnforcer uncertainty → Uncertainty object

### Guided Paths
- Board shows "Step X of Y" header
- Objects tagged with `relatedStepId`
- On step completion: Show completion reflection card

### Persistence
- Board state persisted via `LearningPersist` layer
- Visibility rules from Contract 71 apply
- Minors vs adults privacy respected

## Constraints

- ❌ No modifications to `/spine/expressions/**`
- ❌ No agentic planning
- ❌ No scoring, points, ranks, gamification
- ❌ Board never initiates actions
- ✅ Deterministic state only
- ✅ Board reflects learning — never drives it

## Why Spine is Untouched

The Learning Board is a pure application/service layer component:
- It observes session activity (read-only)
- It does not modify judgment or decision logic
- It does not affect the spine's core functions
- It is a presentation/reflection layer only

The board is designed to be a "mirror" of learning activity, not a driver of it.








































