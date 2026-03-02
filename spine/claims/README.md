# Claims Registry

Canonical registry of stable claim IDs with human labels, ND-calm descriptions, severity, and domain tags.

## How to Add Claims Safely

### Step 1: Choose a Stable ID

Use format: `{domain}.{descriptive_name}`

Examples:
- `core.deterministic`
- `uav.safe_landing_decision`
- `learning.session_traceable`

### Step 2: Define Claim Descriptor

```typescript
{
  id: "your.claim_id",
  title: "Human Title (max 60 chars)",
  description: "ND-calm description (max 160 chars). No technical jargon.",
  type: ClaimType.Safety, // From contracts
  severity: "info" | "warn" | "critical",
  domains: ["your_domain", "core"],
  evidenceSchemaHint: "trace_node_ref" | "signal_value" | "policy_result" | "external_ref" | "simple_text"
}
```

### Step 3: Register in ClaimRegistry.ts

Add to `CLAIMS_REGISTRY` map.

### Step 4: Use in Kernel

Reference claim ID in kernel decision logic:

```typescript
import { getClaimDescriptor } from '../../claims/ClaimRegistry';

const descriptor = getClaimDescriptor('your.claim_id');
// Use descriptor.title and descriptor.description in claims
```

## Evidence Normalization

Always use `normalizeEvidenceForDisplay()` before displaying evidence:

```typescript
import { normalizeEvidenceForDisplay } from './EvidenceNormalizer';

const normalized = normalizeEvidenceForDisplay(claim.evidence);
// normalized.items is bounded (max 5), display-safe, no internal/system strings
```

## Rules

- **Stable IDs**: Never change claim IDs (breaking change)
- **ND-calm descriptions**: No technical jargon, max 160 chars
- **Bounded evidence**: Max 5 items, each max 120 chars
- **No internal/system**: Evidence normalizer strips these automatically
- **Deterministic**: Same evidence → same normalized output

## Examples

See `ClaimRegistry.ts` for examples of:
- Core claims (deterministic, bounded, explainable)
- Domain-specific claims (UAV, learning, XR)
- Severity levels (info, warn, critical)








































