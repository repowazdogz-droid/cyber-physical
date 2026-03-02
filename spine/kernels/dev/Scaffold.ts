/**
 * Kernel Scaffold Generator
 * 
 * Generates ready-to-write file content templates for new kernel adapters.
 * Domain-agnostic, matches existing patterns.
 * 
 * Usage: Call functions to get file content, then write to disk.
 * 
 * Version: 0.1
 */

/**
 * Scaffolds adapter types file.
 */
export function scaffoldAdapterTypes(domainId: string): Record<string, string> {
  const domainUpper = domainId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const domainPascal = domainId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return {
    [`${domainId}/Types.ts`]: `/**
 * ${domainPascal} Types
 * 
 * Domain-specific types for ${domainId} kernel adapter.
 */

/**
 * ${domainPascal} Signals: Raw signals from domain.
 */
export interface ${domainPascal}Signals {
  // TODO: Define your domain-specific signal fields
  [key: string]: number | string | boolean | undefined;
}

/**
 * ${domainPascal} Input: Mapped input for kernel.
 */
export interface ${domainPascal}Input {
  // TODO: Map signals to kernel input structure
  signals: Record<string, any>;
  uncertainty: Record<string, boolean>;
}

/**
 * ${domainPascal} Outcome enum.
 */
export enum ${domainPascal}Outcome {
  // TODO: Define your outcome enums
  OUTCOME_1 = "OUTCOME_1",
  OUTCOME_2 = "OUTCOME_2",
  REFUSE_TO_DECIDE = "REFUSE_TO_DECIDE"
}
`
  };
}

/**
 * Scaffolds kernel implementation.
 */
export function scaffoldKernel(domainId: string, kernelId: string): Record<string, string> {
  const domainUpper = domainId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const domainPascal = domainId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  const kernelUpper = kernelId.toUpperCase().replace(/[^A-Z0-9]/g, '_');

  return {
    [`${domainId}/${kernelId}Kernel.ts`]: `/**
 * ${domainPascal} Kernel: Decision logic for ${kernelId}.
 * Logic-only, deterministic, explainable. No control algorithms.
 */

import { KernelConfig, KernelRunner } from '../../core/KernelRunner';
import { PolicyContext, DisallowRule, OverrideRule, CorePolicy } from '../../core/PolicyTypes';
import { ${domainPascal}Input, ${domainPascal}Outcome } from './Types';
import { ConfidenceLevel, ClaimType } from '../../core/KernelTypes';

const DOMAIN = "${domainUpper}";
const SUB_DOMAIN = "${kernelUpper}";
const KERNEL_VERSION = "1.0";

// Helper to get ${domainPascal}Input from KernelInput
function get${domainPascal}Input(context: PolicyContext): ${domainPascal}Input {
  return context.input.signals as ${domainPascal}Input;
}

// --- Disallow Rules ---
const disallowRule: DisallowRule = {
  id: "DISALLOW_${kernelUpper}",
  priority: 10,
  evaluate: (context: PolicyContext) => {
    // TODO: Add disallow logic
    return null;
  }
};

// --- Override Rules ---
const overrideRule: OverrideRule = {
  id: "OVERRIDE_${kernelUpper}",
  priority: 20,
  evaluate: (context: PolicyContext) => {
    // TODO: Add override logic
    return null;
  }
};

// --- Core Policies ---
const corePolicy: CorePolicy = {
  id: "${kernelUpper}",
  priority: 30,
  evaluate: (context: PolicyContext) => {
    const input = get${domainPascal}Input(context);
    
    // TODO: Implement decision logic
    const outcome = ${domainPascal}Outcome.REFUSE_TO_DECIDE;
    const reason = "Decision logic not yet implemented";
    const confidence = ConfidenceLevel.Unknown;
    
    return {
      outcome,
      reason,
      confidence,
      claims: []
    };
  }
};

const kernelConfig: KernelConfig = {
  domain: DOMAIN,
  subDomain: SUB_DOMAIN,
  disallowRules: [disallowRule],
  overrideRules: [overrideRule],
  corePolicies: [corePolicy],
  defaultOutcome: ${domainPascal}Outcome.REFUSE_TO_DECIDE,
  defaultConfidence: ConfidenceLevel.Unknown,
  kernelVersion: KERNEL_VERSION,
};

export const ${domainId}KernelRunner = new KernelRunner(kernelConfig);
`
  };
}

/**
 * Scaffolds adapter implementation.
 */
export function scaffoldAdapter(domainId: string): Record<string, string> {
  const domainUpper = domainId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const domainPascal = domainId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return {
    [`${domainId}/${domainPascal}Adapter.ts`]: `/**
 * ${domainPascal} Adapter: Maps ${domainId} signals to KernelInput.
 */

import { IKernelAdapter, AdapterMetadata, CalibrationProfile } from '../AdapterTypes';
import { KernelInput, KernelResult } from '../../core/KernelTypes';
import { ${domainId}KernelRunner } from './${domainId}Kernel';
import { ${domainPascal}Signals, ${domainPascal}Input } from './Types';

const ADAPTER_ID = "${domainUpper}_ADAPTER_V1";
const DOMAIN = "${domainUpper}";
const ADAPTER_VERSION = "1.0";

export class ${domainPascal}Adapter implements IKernelAdapter {
  private calibrationProfile?: CalibrationProfile;

  constructor(calibrationProfile?: CalibrationProfile) {
    this.calibrationProfile = calibrationProfile;
  }

  /**
   * Adapts ${domainId} signals to KernelInput.
   */
  adapt(signals: ${domainPascal}Signals): KernelInput {
    // TODO: Map signals to kernel input structure
    const uncertainty: Record<string, boolean> = {};
    
    return {
      timestamp: new Date().toISOString(),
      signals: {
        // TODO: Map your signals here
      },
      uncertainty,
      overrides: {}
    };
  }

  /**
   * Runs kernel with adapted input.
   */
  run(input: KernelInput): KernelResult {
    return ${domainId}KernelRunner.runOnce(input);
  }

  /**
   * Gets adapter metadata.
   */
  getMetadata(): AdapterMetadata {
    return {
      name: '${domainPascal} Adapter',
      version: ADAPTER_VERSION,
      domain: DOMAIN,
      supportedSignals: [], // TODO: List your signal keys
      calibrationProfile: this.calibrationProfile
    };
  }
}
`
  };
}

/**
 * Scaffolds test files.
 */
export function scaffoldTests(domainId: string): Record<string, string> {
  const domainPascal = domainId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return {
    [`${domainId}/__tests__/${domainId}_kernel.test.ts`]: `/**
 * Tests for ${domainPascal} Kernel.
 * Covers: determinism, bounds, privacy-safe trace output.
 */

import { ${domainId}KernelRunner } from '../${domainId}Kernel';
import { KernelInput } from '../../core/KernelTypes';

describe('${domainPascal} Kernel', () => {
  test('produces deterministic output', () => {
    const input: KernelInput = {
      timestamp: '2024-01-01T00:00:00Z',
      signals: {},
      uncertainty: {},
      overrides: {}
    };

    const result1 = ${domainId}KernelRunner.runOnce(input);
    const result2 = ${domainId}KernelRunner.runOnce(input);

    expect(result1.decision.outcome).toBe(result2.decision.outcome);
    expect(result1.trace.traceId).toBe(result2.trace.traceId);
  });

  test('trace is bounded', () => {
    const input: KernelInput = {
      timestamp: '2024-01-01T00:00:00Z',
      signals: {},
      uncertainty: {},
      overrides: {}
    };

    const result = ${domainId}KernelRunner.runOnce(input);
    
    // Trace should have bounded nodes
    expect(result.trace.nodes.length).toBeLessThanOrEqual(100);
  });

  test('no internal/system strings in trace', () => {
    const input: KernelInput = {
      timestamp: '2024-01-01T00:00:00Z',
      signals: {},
      uncertainty: {},
      overrides: {}
    };

    const result = ${domainId}KernelRunner.runOnce(input);
    
    const traceText = JSON.stringify(result.trace);
    expect(traceText.toLowerCase()).not.toContain('internal');
    expect(traceText.toLowerCase()).not.toContain('system');
  });
});
`,
    [`${domainId}/__tests__/${domainId}_adapter.test.ts`]: `/**
 * Tests for ${domainPascal} Adapter.
 */

import { ${domainPascal}Adapter } from '../${domainPascal}Adapter';
import { ${domainPascal}Signals } from '../Types';

describe('${domainPascal} Adapter', () => {
  test('adapts signals correctly', () => {
    const adapter = new ${domainPascal}Adapter();
    const signals: ${domainPascal}Signals = {
      // TODO: Add test signals
    };

    const input = adapter.adapt(signals);
    
    expect(input.signals).toBeDefined();
    expect(input.uncertainty).toBeDefined();
  });

  test('runs kernel successfully', () => {
    const adapter = new ${domainPascal}Adapter();
    const signals: ${domainPascal}Signals = {
      // TODO: Add test signals
    };

    const result = adapter.run(adapter.adapt(signals));
    
    expect(result.decision).toBeDefined();
    expect(result.trace).toBeDefined();
  });
});
`
  };
}

/**
 * Scaffolds README for domain.
 */
export function scaffoldReadme(domainId: string): string {
  const domainPascal = domainId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return `# ${domainPascal} Kernel

Domain-specific kernel adapter for ${domainId}.

## Files

- \`Types.ts\`: Domain-specific types and enums
- \`${domainId}Kernel.ts\`: Decision logic (uses KernelRunner)
- \`${domainPascal}Adapter.ts\`: Signal mapping adapter
- \`__tests__/\`: Unit tests

## Usage

\`\`\`typescript
import { ${domainPascal}Adapter } from './${domainPascal}Adapter';
import { ${domainPascal}Signals } from './Types';

const adapter = new ${domainPascal}Adapter();
const signals: ${domainPascal}Signals = {
  // Your signals
};

const result = adapter.run(adapter.adapt(signals));
\`\`\`

## Testing

Run tests:
\`\`\`bash
npm test -- ${domainId}
\`\`\`

## Notes

- Logic-only: No control algorithms
- Deterministic: Same input → same output
- Bounded: All outputs have size limits
- Privacy-safe: No internal/system strings in traces
`;
}








































