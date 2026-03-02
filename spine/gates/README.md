# Gate Engine

Unified capability and consent gating system. One policy primitive that makes everything easier.

## Overview

The Gate Engine provides a single, reusable way to gate actions across all surfaces:
- Learning board
- XR/VR
- Web recap
- Teacher recap
- Kernel/orchestrator demos
- Export/import

## Key Features

### Unified Handling
- **Adult opt-in vs minor default**: Automatic handling based on viewer role and consent state
- **Viewer roles**: Learner, Teacher, Parent, System
- **Spotlight dismissible**: Enforced constraint
- **Reduce motion**: XR comfort constraint
- **No grading surfaces**: Automatic redaction of scoring-like fields
- **Kernel/orchestrator visibility**: Controlled access with constraints

### Deterministic & Bounded
- **Pure rules**: No IO, no time-based logic
- **Bounded constraints**: Max trace nodes, max items, max redact fields (10)
- **Deterministic**: Same input → same decision

## Usage

### Basic Evaluation

```typescript
import { evaluateGate } from './GateEngine';
import { GateAction, ViewerRole, Surface, ConsentState } from './GateTypes';

const decision = evaluateGate(GateAction.VIEW_TEACHER_RECAP, {
  viewerRole: ViewerRole.Teacher,
  isMinor: false,
  consentState: ConsentState.NotOptedIn,
  surface: Surface.TeacherRecap
});

if (!decision.allowed) {
  // Action denied
  console.log(decision.reason);
} else {
  // Action allowed, apply constraints
  if (decision.constraints?.maxItems) {
    // Limit items to maxItems
  }
  if (decision.constraints?.redactFields) {
    // Redact specified fields
  }
}
```

### Gate Actions

- `VIEW_KERNEL_RUNS`: View kernel run records
- `VIEW_ORCHESTRATOR_RUNS`: View orchestrator run records
- `VIEW_TEACHER_RECAP`: View teacher recap
- `EXPORT_BUNDLE`: Export bundle
- `IMPORT_BUNDLE`: Import bundle
- `ENABLE_PRESENCE`: Enable presence mode (XR)
- `SHOW_SPOTLIGHT`: Show spotlight
- `RUN_KERNEL`: Run kernel
- `RUN_ORCHESTRATOR`: Run orchestrator
- `ATTACH_TO_BOARD`: Attach to learning board
- `SHOW_REASONING_TRACE`: Show reasoning trace

### Gate Decisions

```typescript
interface GateDecision {
  allowed: boolean;
  constraints?: GateConstraints;
  reason: string;
}
```

### Constraints

- `maxTraceNodes`: Maximum trace nodes to show
- `redactFields`: Fields to redact (max 10)
- `requireReduceMotion`: Require reduce motion
- `requireDismissible`: Require dismissible (spotlight)
- `maxItems`: Maximum items to show
- `denyIfAdultNoOptIn`: Deny if adult has not opted in

## Default Rules

1. **Adult opt-in**: Teacher/Parent viewing adult data requires opt-in
2. **Minors**: Allow teacher/parent viewing with constraints (max 12 items, redact internal fields)
3. **Spotlight**: Must be dismissible
4. **Reduce motion**: XR surfaces require reduce motion if requested or unknown
5. **No grading**: Teacher recap and recap surfaces redact scoring-like fields

## Rule Application Order

1. **Non-negotiables**: Dismissible spotlight, no grading surfaces
2. **Consent/visibility**: Adult opt-in vs minor default
3. **Comfort constraints**: Reduce motion
4. **Surface bounds**: Max trace nodes, max items

## Gate Packs

Optional domain-specific gate packs can be registered:

```typescript
import { registerGatePack } from './GateRegistry';

registerGatePack({
  id: 'custom',
  version: '1.0.0',
  description: 'Custom rules',
  rules: [
    (action, ctx) => {
      // Custom rule logic
      return null; // No match
    }
  ]
});
```

## Integration Points

- **Visibility filters**: Use gate for kernel/orchestrator run filtering
- **Teacher recap routes**: Gate access before returning data
- **Kernel/orchestrator run routes**: Gate actions before execution
- **XR pairing routes**: Gate presence mode enablement
- **Export/import routes**: Gate bundle operations

## Bounds & Rules

1. **Redact fields**: Max 10 per constraint
2. **Max trace nodes**: 12 for minors, 20 for adults
3. **Max items**: 12 for minors, 50 for adults
4. **Reason length**: Max 200 chars
5. **Deterministic**: Same input → same output








































