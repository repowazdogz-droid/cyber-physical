# Adapter Toolkit

Shared toolkit for building domain adapters. Standardizes signal parsing, normalization, uncertainty mapping, and conformance checking.

## Quick Start

### 1. Parse Raw Signals

```typescript
import { parseNumber, parseEnum, parseBoolean, parseString } from './SignalParsers';

// Parse number with bounds
const altitudeResult = parseNumber(rawInput.altitude, { min: 0, max: 1000 });
if (altitudeResult.value !== undefined) {
  // Use altitudeResult.value
}

// Parse enum
const healthResult = parseEnum(rawInput.health, ['H1', 'H2', 'H3', 'H4']);
if (healthResult.value !== undefined) {
  // Use healthResult.value
}

// Parse boolean
const activeResult = parseBoolean(rawInput.isActive);

// Parse string with max length
const nameResult = parseString(rawInput.name, 100);
```

### 2. Normalize and Build Result

```typescript
import { AdapterNormalizationResult } from './SignalTypes';
import { mergeIssues } from './Normalization';

const normalized: Record<string, SignalValue> = {};
const allIssues: SignalParseIssue[] = [];

// Parse each signal
const altitudeResult = parseNumber(rawInput.altitude, { min: 0, max: 1000 });
if (altitudeResult.value !== undefined) {
  normalized.altitude = altitudeResult.value;
}
allIssues.push(...altitudeResult.issues);

// ... repeat for other signals ...

// Build normalization result
const result: AdapterNormalizationResult = {
  normalized,
  issues: mergeIssues(allIssues, [], 20), // Max 20 issues
  uncertainty: [] // Will be populated by uncertainty mapping
};
```

### 3. Map Uncertainty

```typescript
import { mapUncertainty } from './UncertaintyMapping';

const { confidenceHint, uncertaintyFlags } = mapUncertainty(result, {
  criticalSignals: ['altitude', 'health'],
  conflictGroups: [
    {
      groupId: 'health_environment',
      signals: ['health', 'environment'],
      description: 'Health and environment signals conflict'
    }
  ],
  useHLevelStyle: true // Use H1/H2/H3 instead of HIGH/MEDIUM/LOW
});
```

### 4. Build KernelInput

```typescript
import { KernelInput } from '../../core/KernelTypes';

const kernelInput: KernelInput = {
  timestamp: new Date().toISOString(),
  signals: result.normalized,
  uncertainty: Object.fromEntries(
    uncertaintyFlags.map(flag => [flag.signalKey, true])
  ),
  overrides: {}
};
```

### 5. Validate Conformance (Optional)

```typescript
import { validateAdapterOutput } from './AdapterConformance';

const issues = validateAdapterOutput(
  'my_adapter',
  'my_kernel',
  kernelInput,
  { throwOnError: process.env.NODE_ENV === 'development' }
);

if (issues.length > 0) {
  // Log or handle issues
}
```

## Bounds & Rules

### Signal Parsing
- **Issues per parse**: Max 10
- **String length**: Max 500 chars (configurable)
- **Number bounds**: Enforced via min/max options

### Normalization Result
- **Normalized signals**: Max 50 keys
- **Issues**: Max 20 total
- **Uncertainty flags**: Max 20 total

### Conformance
- **Max signals**: 50
- **Max string length**: 500 chars
- **No undefined values**: Use null for missing
- **Deterministic key ordering**: Keys should be sorted

## Determinism

All toolkit functions are deterministic:
- Same inputs → same outputs
- No time-based logic
- No randomness
- Stable sorting of issues/flags

## Example: Complete Adapter

```typescript
import { IKernelAdapter } from '../AdapterTypes';
import { parseNumber, parseEnum } from './toolkit/SignalParsers';
import { mergeIssues } from './toolkit/Normalization';
import { mapUncertainty } from './toolkit/UncertaintyMapping';
import { validateAdapterOutput } from './toolkit/AdapterConformance';

export class MyAdapter implements IKernelAdapter {
  adapt(raw: Record<string, unknown>): KernelInput {
    const normalized: Record<string, SignalValue> = {};
    const allIssues: SignalParseIssue[] = [];

    // Parse signals
    const altitudeResult = parseNumber(raw.altitude, { min: 0, max: 1000 });
    if (altitudeResult.value !== undefined) {
      normalized.altitude = altitudeResult.value;
    }
    allIssues.push(...altitudeResult.issues);

    const healthResult = parseEnum(raw.health, ['H1', 'H2', 'H3', 'H4']);
    if (healthResult.value !== undefined) {
      normalized.health = healthResult.value;
    }
    allIssues.push(...healthResult.issues);

    // Build normalization result
    const result: AdapterNormalizationResult = {
      normalized,
      issues: mergeIssues(allIssues, [], 20),
      uncertainty: []
    };

    // Map uncertainty
    const { uncertaintyFlags } = mapUncertainty(result, {
      criticalSignals: ['altitude', 'health']
    });

    // Build KernelInput
    const kernelInput: KernelInput = {
      timestamp: new Date().toISOString(),
      signals: result.normalized,
      uncertainty: Object.fromEntries(
        uncertaintyFlags.map(flag => [flag.signalKey, true])
      ),
      overrides: {}
    };

    // Validate (optional, throws in dev)
    validateAdapterOutput('my_adapter', 'my_kernel', kernelInput, {
      throwOnError: process.env.NODE_ENV === 'development'
    });

    return kernelInput;
  }

  // ... other IKernelAdapter methods ...
}
```








































