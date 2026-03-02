# Kernel Adapters

Domain-specific adapters that implement `IKernelAdapter` interface.

## Structure

- `AdapterTypes.ts`: Adapter interface and metadata types
- `{domain}/`: Domain-specific adapter implementation
  - `{Domain}Types.ts`: Domain-specific types
  - `{Domain}Kernel.ts`: Kernel decision logic
  - `{Domain}Adapter.ts`: Signal mapping adapter
  - `__tests__/`: Unit tests

## UAV Safe Landing Adapter

Implements "SAFE LANDING DECISION SQUARE v2.3" as a kernel instance.

### Files
- `SafeLandingTypes.ts`: A/H/E/TTC enums, outcomes S1-S4
- `SafeLandingKernel.ts`: Decision square mapping + overrides + S1 exit conditions
- `SafeLandingAdapter.ts`: Maps UAV signals → KernelInput
- `helpers.ts`: Utility functions (hashing, etc.)

### Usage

```typescript
import { SafeLandingAdapter } from './uav_safe_landing/SafeLandingAdapter';
import { UAVSignals } from './uav_safe_landing/SafeLandingTypes';

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
```

## Adding a New Adapter

1. Create domain folder: `/spine/kernels/adapters/{domain}/`
2. Define types: `{Domain}Types.ts`
3. Implement kernel: `{Domain}Kernel.ts`
4. Implement adapter: `{Domain}Adapter.ts` (implements `IKernelAdapter`)
5. Add tests: `__tests__/{domain}_kernel.test.ts` and `__tests__/{domain}_adapter.test.ts`
6. Export from adapter index (if needed)

### Example Structure

```
adapters/
  {domain}/
    {Domain}Types.ts
    {Domain}Kernel.ts
    {Domain}Adapter.ts
    helpers.ts (optional)
    __tests__/
      {domain}_kernel.test.ts
      {domain}_adapter.test.ts
```








































