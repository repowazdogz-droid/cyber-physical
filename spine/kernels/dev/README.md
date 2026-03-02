# Kernel Development Guide

How to add a new kernel adapter in 10 minutes.

## Quick Start

1. **Generate scaffold files** using `Scaffold.ts`:
   ```typescript
   import { scaffoldAdapterTypes, scaffoldKernel, scaffoldAdapter, scaffoldTests, scaffoldReadme } from './Scaffold';
   
   const domainId = 'my_domain';
   const kernelId = 'my_kernel';
   
   // Get file contents
   const types = scaffoldAdapterTypes(domainId);
   const kernel = scaffoldKernel(domainId, kernelId);
   const adapter = scaffoldAdapter(domainId);
   const tests = scaffoldTests(domainId);
   const readme = scaffoldReadme(domainId);
   
   // Write files to disk
   // (implementation depends on your environment)
   ```

2. **Implement your logic**:
   - Fill in `Types.ts` with your domain signals
   - Implement decision logic in `{kernelId}Kernel.ts`
   - Map signals in `{Domain}Adapter.ts`
   - Register adapter in `AdapterRegistry.ts`

3. **Add tests**:
   - Determinism: same input → same output
   - Bounds: trace nodes ≤ 100, claims ≤ 10
   - Privacy: no "internal/system" strings in traces

## File Structure

```
spine/kernels/adapters/{domainId}/
├── Types.ts                    # Domain-specific types
├── {kernelId}Kernel.ts         # Decision logic
├── {Domain}Adapter.ts          # Signal mapping
├── __tests__/
│   ├── {domainId}_kernel.test.ts
│   └── {domainId}_adapter.test.ts
└── README.md                   # Domain docs
```

## Naming Conventions

- **domainId**: lowercase, underscores (e.g., `uav_safe_landing`)
- **kernelId**: lowercase, underscores (e.g., `safe_landing_decision_square_v2_3`)
- **Adapter class**: PascalCase (e.g., `SafeLandingAdapter`)
- **Types file**: `Types.ts` (always)
- **Kernel file**: `{kernelId}Kernel.ts`

## Required Tests Checklist

- [ ] Determinism: Same input produces identical decision + trace
- [ ] Bounds: Trace nodes ≤ 100, claims ≤ 10
- [ ] Privacy: No "internal/system" strings in trace output
- [ ] Adapter: Correctly maps signals to KernelInput
- [ ] Kernel: Produces valid KernelDecision + DecisionTrace

## Policy Pack Usage

Use shared primitives from `PolicyPack.ts`:

```typescript
import { biasTowardHarderOutcome, treatAmbiguityAsWorst, disallowOutcomes } from '../../core/PolicyPack';

// Bias toward safer outcomes
const effectiveOutcome = biasTowardHarderOutcome(['S1', 'S2', 'S3', 'S4'], currentOutcome);

// Treat ambiguity as worst case
const effectiveAuthority = treatAmbiguityAsWorst({
  authorityKey: 'altitudeBand',
  confidenceKey: 'altitudeConfidence'
}, input);

// Disallow unsafe outcomes
const disallowRule = disallowOutcomes(['S4'], 'Safety policy violation');
```

## No Control Algorithms

**Important**: Kernels are decision logic only. They:
- ✅ Evaluate conditions
- ✅ Produce decisions with reasoning
- ✅ Generate assurance claims
- ❌ Do NOT execute actions
- ❌ Do NOT control hardware
- ❌ Do NOT manage state over time

## Integration Points

After creating your kernel:

1. **Register adapter** in `AdapterRegistry.ts`:
   ```typescript
   import { MyDomainAdapter } from './my_domain/MyDomainAdapter';
   adapters.set('my_domain', () => new MyDomainAdapter());
   ```

2. **Add to API** (if needed) in `/app/api/kernels/run/route.ts`

3. **Create demo surface** (optional) in `/app/kernels/{domainId}/page.tsx`

## Examples

See `uav_safe_landing/` for a complete example:
- Types with enums
- Kernel with disallow/override/core policies
- Adapter with signal mapping
- Tests covering all requirements








































