# Interface Contracts

Formal, versioned interface contracts that connect Spine → Kernels → Policies → Artifacts → Surfaces.

## Why Contracts Exist

Contracts provide:
- **Stability**: Frozen interfaces prevent breaking changes
- **Interoperability**: Different systems can plug in without refactors
- **Versioning**: Clear breaking vs non-breaking change rules
- **Validation**: Structural guards ensure contract compliance
- **Documentation**: Explicit bounds and constraints

## Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│ SPINES (Long-lived domain engines)                          │
│ - RoomOS, GameOS, Learning Platform                          │
│ - Produce: KernelInputContract                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KERNELS (Domain-agnostic decision primitives)               │
│ - Consume: KernelInputContract                              │
│ - Produce: KernelDecisionContract + KernelTraceContract    │
│ - Use: PolicyDecisionContract, ClaimContract                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ARTIFACTS (Immutable records)                                │
│ - SessionArtifactContract                                    │
│ - ReplayArtifactContract                                     │
│ - ExportBundleContract                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ SURFACES (Learning platform joins)                           │
│ - ThoughtObjectContract                                      │
│ - VisibilityContracts (ViewerRole, ConsentState)             │
│ - Consume: KernelRunContract                                 │
└─────────────────────────────────────────────────────────────┘
```

## Contract Structure

### Core Contracts
- **KernelContracts**: Input, decision, trace, run
- **PolicyContracts**: Context, decision, override
- **ClaimContracts**: Assurance claims and evidence

### Artifact Contracts
- **ArtifactContracts**: Session, replay, export bundle

### Surface Contracts
- **ThoughtObjectContracts**: Learning board objects
- **VisibilityContracts**: Privacy and consent rules

### Utilities
- **ContractVersion**: Central versioning
- **ContractGuards**: Pure validation helpers

## How Future Systems Plug In

1. **Implement contract interfaces**: Your system must produce/consume contract types
2. **Declare contract version**: Set `contractVersion: "1.0.0"` in all outputs
3. **Use contract guards**: Validate inputs with `isKernelDecisionContract()`, etc.
4. **Respect bounds**: All arrays, strings, and nested structures have documented limits

## Versioning Rules

### Breaking Changes (require v2.0.0)
- Removing required fields
- Changing field types
- Changing enum values
- Removing enum values
- Making array bounds stricter

### Non-Breaking Changes (v1.0.x)
- Adding optional fields
- Adding new enum values
- Relaxing array bounds
- Adding new contract types
- Documentation updates

## Usage Example

```typescript
import { KernelInputContract, KernelDecisionContract } from './KernelContracts';
import { isKernelDecisionContract } from './ContractGuards';
import { CONTRACT_VERSION } from './ContractVersion';

// Your kernel must produce KernelDecisionContract
function myKernel(input: KernelInputContract): KernelDecisionContract {
  return {
    contractVersion: CONTRACT_VERSION,
    outcome: "S1",
    confidence: "High",
    rationale: "Nominal conditions",
    assumptions: [],
    uncertainties: [],
    kernelId: "my_kernel",
    adapterId: "my_adapter"
  };
}

// Validate with guards
const decision = myKernel(input);
if (isKernelDecisionContract(decision)) {
  // Safe to use
}
```

## Bounds Summary

- **Arrays**: Max 5-10 items (varies by contract)
- **Strings**: Max 100-500 chars (varies by field)
- **Trace nodes**: Max 100 nodes, max depth 5
- **Claims**: Max 10 per trace
- **Kernel runs**: Max 50 per session

## Future Breaking Changes (v2.0.0)

Potential v2 changes (not implemented):
- Add support for probabilistic confidence
- Add support for multi-outcome decisions
- Add support for temporal constraints
- Add support for distributed kernel execution








































