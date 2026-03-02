# Kernel Framework Architecture

## Where Things Live

```
Omega Architecture Layers:

┌─────────────────────────────────────────────────────────────┐
│ SPINES (Long-lived domain engines)                          │
│ - RoomOS: Spatial learning orchestration                    │
│ - GameOS: Game-based learning orchestration                 │
│ - Learning Platform: Session orchestration, skill graphs   │
│ - Expressions: Frozen judgment authoring (immutable)       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KERNELS (Domain-agnostic decision primitives)               │
│ - Core: KernelRunner, TraceBuilder, PolicyTypes             │
│ - Policy Pack: Composable safety primitives                 │
│ - Logic-only: No control algorithms, no state management   │
│ - Deterministic: Same input → same output                  │
│ - Bounded: All outputs have size limits                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ADAPTERS (Domain mapping)                                   │
│ - uav_safe_landing/: UAV signals → KernelInput              │
│ - {domain}/: Domain signals → KernelInput                   │
│ - Registry: Adapter lookup and registration                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ SURFACES (Joins to learning platform)                      │
│ - Learning: KernelRunRecord → ThoughtObjects                │
│ - Store: Bounded persistence (max 50 runs/learner)          │
│ - Visibility: Privacy filtering (Contract 71)               │
│ - Recap: Demo-friendly replay                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ APPS (ND-first demo surfaces)                               │
│ - /kernels/uav: Talk-ready demo page                        │
│ - /pair: XR handoff                                         │
│ - /learning/recap: Teacher-friendly replay                 │
└─────────────────────────────────────────────────────────────┘
```

## When to Create: Spine vs Kernel vs Adapter

**Create a NEW SPINE when:**
- You need a long-lived domain engine (e.g., RoomOS, GameOS)
- You need orchestration across multiple sessions
- You need state management over time
- You need integration with external systems (XR, Unity, etc.)

**Create a NEW KERNEL when:**
- You need decision logic for a specific domain
- You need assurance claims and traceability
- You need deterministic, bounded decision-making
- You DON'T need control algorithms or state management

**Create a NEW ADAPTER when:**
- You have domain-specific signals to map
- You need to bridge between domain and kernel framework
- You want to reuse existing kernel infrastructure
- You need calibration or signal transformation

**Use EXISTING KERNEL + NEW ADAPTER when:**
- Domain signals differ but decision logic is similar
- You want to reuse policy pack primitives
- You need quick domain integration

**Use POLICY PACK when:**
- You need common safety primitives (bias, ambiguity, disallow, override)
- You want composable, reusable decision helpers
- You need domain-agnostic safety patterns

**DO NOT create a kernel for:**
- Control algorithms (use spine or application layer)
- State management over time (use spine)
- Learning/adaptation (use learning platform spine)
- UI orchestration (use application layer)

## Folder Layout

```
spine/kernels/
├── core/
│   ├── KernelTypes.ts          # Core types (KernelInput, KernelDecision, DecisionTrace, Claim)
│   ├── PolicyTypes.ts          # Policy context, decisions, override/disallow rules
│   ├── KernelRunner.ts         # Execution engine (runOnce, runTimeline)
│   ├── TraceBuilder.ts         # Deterministic trace builder (bounded, ND-calm)
│   └── README.md               # Core documentation
├── adapters/
│   ├── AdapterTypes.ts         # Adapter interface (IKernelAdapter)
│   ├── README.md               # Adapter documentation
│   └── uav_safe_landing/
│       ├── SafeLandingTypes.ts      # A/H/E/TTC enums, outcomes S1-S4
│       ├── SafeLandingKernel.ts     # Decision square mapping + overrides + S1 exit
│       ├── SafeLandingAdapter.ts    # Maps UAV signals → KernelInput
│       ├── helpers.ts               # Utility functions (hashing, etc.)
│       └── __tests__/
│           ├── safe_landing_kernel.test.ts
│           └── safe_landing_adapter.test.ts
├── surfaces/                   # Optional UI surfaces (CLI, web, etc.)
│   └── (future)
└── README.md                   # Framework overview
```

## Architecture Summary

### Core Components

1. **KernelTypes**: Domain-agnostic input/output types
   - `KernelInput`: Signals + uncertainty + overrides
   - `KernelDecision`: Outcome + confidence + rationale
   - `DecisionTrace`: Bounded trace nodes + claims
   - `Claim`: Assurance claims (Safety, Determinism, Bounded, etc.)

2. **PolicyTypes**: Policy evaluation framework
   - `PolicyContext`: Context for policy evaluation
   - `PolicyDecision`: Allowed/disallowed outcome
   - `OverrideRule`: Environment/time overrides
   - `DisallowRule`: Safety disallowance rules

3. **KernelRunner**: Execution engine
   - `runOnce(input)`: Single decision
   - `runTimeline(inputs)`: Multiple decisions over time
   - Policy evaluation: Ordered, first non-disallowed outcome wins
   - Override rules: Applied before policies (priority-ordered)
   - Disallow rules: Checked first (priority-ordered)

4. **TraceBuilder**: Deterministic trace construction
   - Bounded: Max 100 nodes, max depth 5, max 10 data keys per node
   - Deterministic: Same input → same trace structure
   - ND-calm: Human-readable labels, short descriptions

### Adapter Pattern

1. **IKernelAdapter**: Interface for domain-specific adapters
   - `adapt(signals)`: Maps domain signals → KernelInput
   - `run(input)`: Runs kernel with adapted input
   - `getMetadata()`: Returns adapter metadata

2. **UAV Safe Landing Adapter**: Example implementation
   - Maps A/H/E/TTC to S1-S4 outcomes
   - Implements decision square v2.3
   - Override rules: E3/E4, TTC T1
   - S1 exit conditions
   - Ambiguity hardening: H3, A2/A3 oscillation

## Design Principles

1. **Logic-Only**: Decision logic + assurance claims. No control algorithms.
2. **Deterministic**: Same input → identical decision + trace.
3. **Bounded**: All state bounded (arrays, traces, etc.).
4. **Explainable**: Structured traces for ND-calm display.
5. **Domain-Agnostic**: Core framework independent of domain.

## Constraints

- **No control algorithms**: Decision logic only
- **No spine modifications**: Does not touch `/spine/expressions/**`
- **No RoomOS/GameOS changes**: Factory/Examples layer only
- **Bounded state**: Max 100 trace nodes, max depth 5, max 10 data keys per node
- **Deterministic**: No randomness, no time-based logic

## Testing Requirements

All kernels must pass:
- **Determinism**: Same inputs → identical decision + trace
- **Ambiguity hardening**: Oscillation/uncertainty biases toward safer outcomes
- **Override rules**: Environment/time overrides applied correctly
- **Disallow rules**: Unsafe outcomes disallowed
- **Bounded trace**: Max 100 nodes, max depth 5
- **Composite fault handling**: Worst credible A/H dominates

## Usage Example

```typescript
import { SafeLandingAdapter } from './adapters/uav_safe_landing/SafeLandingAdapter';
import { UAVSignals } from './adapters/uav_safe_landing/SafeLandingTypes';

const adapter = new SafeLandingAdapter();

const signals: UAVSignals = {
  altitude: 30,
  healthStatus: 'H1',
  environment: 'E1',
  timeToContact: 20
};

const input = adapter.adapt(signals);
const result = adapter.run(input);

console.log(result.decision.outcome); // S1, S2, S3, or S4
console.log(result.trace.nodes.length); // Bounded
```

## Adding a New Kernel

1. Create domain folder: `/spine/kernels/adapters/{domain}/`
2. Define types: `{Domain}Types.ts`
3. Implement kernel: `{Domain}Kernel.ts`
4. Implement adapter: `{Domain}Adapter.ts` (implements `IKernelAdapter`)
5. Add tests: `__tests__/{domain}_kernel.test.ts` and `__tests__/{domain}_adapter.test.ts`
6. Document in adapter README

