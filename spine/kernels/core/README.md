# Kernel Framework Core

Domain-agnostic kernel framework for decision logic. Logic-only, deterministic, explainable.

## Architecture

### KernelRunner
- `runOnce(input)`: Single decision
- `runTimeline(inputs)`: Multiple decisions over time
- Policies: Ordered evaluation, first non-disallowed outcome wins
- Override rules: Applied before policies (priority-ordered)
- Disallow rules: Checked first (priority-ordered)

### TraceBuilder
- Bounded: Max 100 nodes, max depth 5, max 10 data keys per node
- Deterministic: Same input → same trace structure
- ND-calm: Human-readable labels, short descriptions

### Types
- `KernelInput`: Domain-agnostic signals + uncertainty + overrides
- `KernelDecision`: Outcome + confidence + rationale + assumptions
- `DecisionTrace`: Bounded trace nodes + claims
- `PolicyContext`: Context for policy evaluation
- `PolicyDecision`: Allowed/disallowed outcome

## Usage Example

```typescript
import { KernelRunner, KernelPolicy } from './KernelRunner';
import { PolicyContext, PolicyDecision } from './PolicyTypes';
import { KernelInput } from './KernelTypes';

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

1. Create adapter in `/spine/kernels/adapters/{domain}/`
2. Implement `IKernelAdapter` interface
3. Define domain-specific types (outcomes, signals)
4. Implement policy functions
5. Add override/disallow rules
6. Write tests

## Constraints

- **No control algorithms**: Decision logic only
- **Deterministic**: Same input → same output
- **Bounded**: All state bounded (arrays, traces, etc.)
- **Explainable**: Structured traces for ND-calm display
- **No spine modifications**: Does not touch `/spine/expressions/**`








































