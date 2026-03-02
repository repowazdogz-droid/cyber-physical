# Kernel Framework

Domain-agnostic kernel framework for decision logic. Logic-only, deterministic, explainable.

## Architecture

### Core (`/spine/kernels/core/`)
- **KernelTypes.ts**: Core types (KernelInput, KernelDecision, DecisionTrace, Claim)
- **PolicyTypes.ts**: Policy context, decisions, override/disallow rules
- **KernelRunner.ts**: Execution engine (`runOnce()`, `runTimeline()`)
- **TraceBuilder.ts**: Deterministic trace builder (bounded, ND-calm)

### Adapters (`/spine/kernels/adapters/`)
- **AdapterTypes.ts**: Adapter interface (`IKernelAdapter`)
- **{domain}/**: Domain-specific adapters
  - Example: `uav_safe_landing/` (Safe Landing Decision Square v2.3)

### Surfaces (`/spine/kernels/surfaces/`)
- Optional UI surfaces (CLI, web, etc.)

## Constraints

- **No control algorithms**: Decision logic + assurance claims only
- **Deterministic**: Same input → identical decision + trace
- **Bounded**: All state bounded (max 100 trace nodes, max depth 5, etc.)
- **Explainable**: Structured traces for ND-calm display
- **No spine modifications**: Does not touch `/spine/expressions/**`

## Quick Start

```typescript
import { KernelRunner, KernelPolicy } from './core/KernelRunner';
import { PolicyContext, PolicyDecision } from './core/PolicyTypes';
import { KernelInput } from './core/KernelTypes';

// Create runner
const runner = new KernelRunner();

// Add policy
const myPolicy: KernelPolicy = (context, trace) => {
  const signalA = context.signals['A'] as number;
  if (signalA > 0.5) {
    return {
      outcome: 'OUTCOME_1',
      disallowed: false,
      confidence: 'High',
      rationale: 'Signal A exceeds threshold'
    };
  }
  return {
    outcome: undefined,
    disallowed: false,
    confidence: 'Low',
    rationale: 'Signal A below threshold'
  };
};

runner.addPolicy(myPolicy);

// Run
const input: KernelInput = {
  timestamp: new Date().toISOString(),
  signals: { A: 0.7 },
  uncertainty: { A: false }
};

const result = runner.runOnce(input);
console.log(result.decision.outcome); // 'OUTCOME_1'
console.log(result.trace.nodes.length); // Bounded
```

## Adding a New Kernel

See `/spine/kernels/adapters/README.md` for detailed instructions.

1. Create adapter in `/spine/kernels/adapters/{domain}/`
2. Implement `IKernelAdapter` interface
3. Define domain-specific types (outcomes, signals)
4. Implement policy functions
5. Add override/disallow rules
6. Write tests

## Testing

All kernels must pass:
- **Determinism**: Same inputs → identical decision + trace
- **Ambiguity hardening**: Oscillation/uncertainty biases toward safer outcomes
- **Override rules**: Environment/time overrides applied correctly
- **Disallow rules**: Unsafe outcomes disallowed
- **Bounded trace**: Max 100 nodes, max depth 5

## Examples

- **UAV Safe Landing**: `/spine/kernels/adapters/uav_safe_landing/`
  - Decision square mapping (A/H/E/TTC → S1-S4)
  - Override rules (E3/E4, TTC T1)
  - S1 exit conditions
  - Ambiguity hardening (H3, A2/A3 oscillation)








































