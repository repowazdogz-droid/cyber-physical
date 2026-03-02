# Learning Store + Privacy/Visibility Filters

Implementation of the Learning Store with privacy/visibility filtering per Contracts 68 and 71.

## Overview

The Learning Store provides:
- Bounded storage for learner state and sessions
- Privacy/visibility filtering based on age bands
- Integration with SessionOrchestrator

## Key Features

### Bounded Storage
- Max 200 sessions per learner (FIFO eviction)
- Max 50 turns per session
- Max 200 observations per session
- Max 10 assessments per session

### Privacy Rules (Contract 71)
- **Minors (6-9, 10-12)**: Parents and teachers can view by default
- **Adults**: Private by default; teachers can view only if opted-in
- **Institution mode**: Institution can view if enabled
- **Learners**: Always can view their own data

### Internal Mechanics Hiding
- System internals (guardrails, refusal mechanics) are hidden from all viewers
- User-facing information only

## Usage

### Basic Store Operations

```typescript
import { InMemoryLearningStore } from "./store/InMemoryLearningStore";
import { runSessionAndPersist } from "../session/SessionRunner";

const store = new InMemoryLearningStore();

// Run session and persist
const request: LearningSessionRequest = {
  sessionId: "session-1",
  learner: {
    learnerId: "learner-123",
    ageBand: AgeBand.ADULT,
    safety: { minor: false, institutionMode: false }
  },
  goal: {
    subject: "mathematics",
    topic: "fractions",
    objective: "understand how to add fractions"
  },
  mode: TutorMode.Socratic
};

const output = runSessionAndPersist(request, store);

// Retrieve learner state
const state = store.getLearnerState("learner-123");

// List sessions
const sessions = store.listSessions("learner-123", 10);
```

### Visibility Filtering

```typescript
import {
  getVisibilityPolicy,
  filterSessionForViewer,
  filterLearnerStateForViewer
} from "./store/VisibilityFilters";

const profile = {
  learnerId: "learner-123",
  ageBand: AgeBand.SIX_TO_NINE,
  safety: { minor: true, institutionMode: false }
};

// Get visibility policy
const policy = getVisibilityPolicy(profile);

// Filter session for parent
const session = store.getSession("session-1");
const filteredSession = filterSessionForViewer(session!, "Parent", policy);

// Filter learner state for teacher
const state = store.getLearnerState("learner-123");
const filteredState = filterLearnerStateForViewer(state!, "Teacher", policy);
```

## Files

- `StoreTypes.ts` - Type definitions
- `ILearningStore.ts` - Store interface
- `InMemoryLearningStore.ts` - Map-based implementation
- `VisibilityFilters.ts` - Privacy/visibility filtering
- `SessionRunner.ts` - Integration with SessionOrchestrator

## Testing

Run tests with:
```bash
npm test -- spine/learning/platform/store/__tests__/
```

Tests cover:
- Bounded storage enforcement
- FIFO eviction
- Visibility filtering for minors vs adults
- Parent/teacher access rules
- Internal mechanics hiding








































