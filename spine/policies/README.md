# Policy Packs

Named collections of overrides, disallows, and constraints that can be applied to kernel runs and surfaces consistently.

## What Are Policy Packs?

Policy packs are **domain-agnostic constraints and overrides**. They:
- Describe permission, never control
- Can be applied post-decision (opt-in)
- Are composable and reusable
- Follow contract v1.0.0

## How to Add Policy Packs

### Step 1: Create Pack File

Create `/spine/policies/packs/{pack_id}.ts`:

```typescript
import { PolicyPack } from '../PolicyPackTypes';
import { PolicyOverrideContract } from '../../contracts/PolicyContracts';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

export const yourPack: PolicyPack = {
  contractVersion: CONTRACT_VERSION,
  descriptor: {
    id: "your_pack_id",
    version: "1.0.0",
    description: "Your pack description (max 200 chars)",
    domains: ["your_domain"]
  },
  overrides: [
    // PolicyOverrideContract[] (max 10)
  ],
  disallows: [
    // { id, outcome, reason, priority }[] (max 10)
  ],
  constraints: [
    // PolicyConstraint[] (optional, max 5)
  ]
};
```

### Step 2: Register Pack

Add to `/spine/policies/packs/index.ts`:

```typescript
import { yourPack } from './your_pack';
registerPolicyPack(yourPack);
```

### Step 3: Use in API/Surfaces

Pass `policyPackId` to kernel run API or apply manually:

```typescript
import { getPolicyPack } from '../PolicyPackRegistry';
import { applyPolicyPack } from '../applyPolicyPack';

const pack = getPolicyPack('your_pack_id');
if (pack) {
  const result = applyPolicyPack(kernelRun, pack);
  // result.run is modified (new object, not mutated)
  // result.policyNotes contains applied policy notes
}
```

## Default Packs

- **uav_safety_conservative**: Emergency overrides and disallows for UAV
- **learning_privacy_default**: Adult opt-in, internal marker stripping
- **xr_comfort_default**: Reduce motion, motion intensity clamping

## Rules

- **No mutation**: `applyPolicyPack()` returns new object
- **Deterministic**: Same pack + run → same result
- **Bounded**: Max 10 overrides, max 10 disallows, max 5 constraints
- **Priority-ordered**: Higher priority checked first
- **Opt-in**: Only applied if `policyPackId` provided

## Policy Pack vs Kernel Logic

- **Kernel logic**: Domain-specific decision rules (e.g., decision square)
- **Policy packs**: Domain-agnostic constraints/overrides (e.g., safety, privacy, comfort)

Policy packs can override kernel decisions but should be used sparingly (safety/privacy/comfort only).








































