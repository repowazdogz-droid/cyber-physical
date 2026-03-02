/**
 * Tests for Spec Compiler.
 * Ensures: determinism, bounds, correct outcome selection.
 */

import { compileKernelSpec } from '../KernelSpecCompiler';
import { KernelSpec } from '../SpecTypes';
import { KernelInput } from '../../kernels/core/KernelTypes';

describe('Spec Compiler', () => {
  test('compiles spec and runs deterministically', () => {
    const spec: KernelSpec = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: [
        {
          outcomeId: 'S1',
          label: 'Safe',
          conditions: [
            {
              signalKey: 'altitude',
              operator: 'gt',
              value: 100
            }
          ],
          confidence: 'High',
          rationale: 'Altitude is safe'
        }
      ]
    };

    const compiled = compileKernelSpec(spec);

    const input: KernelInput = {
      contractVersion: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      signals: { altitude: 150 },
      uncertainty: {},
      adapterId: 'test-adapter'
    };

    const result1 = compiled(input);
    const result2 = compiled(input);

    expect(result1).toEqual(result2);
    expect(result1.outcome).toBe('S1');
  });

  test('selects first matching outcome', () => {
    const spec: KernelSpec = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: [
        {
          outcomeId: 'S1',
          label: 'Safe',
          conditions: [
            {
              signalKey: 'altitude',
              operator: 'gt',
              value: 100
            }
          ],
          confidence: 'High',
          rationale: 'Altitude is safe'
        },
        {
          outcomeId: 'S2',
          label: 'Caution',
          conditions: [
            {
              signalKey: 'altitude',
              operator: 'gt',
              value: 50
            }
          ],
          confidence: 'Medium',
          rationale: 'Altitude is moderate'
        }
      ]
    };

    const compiled = compileKernelSpec(spec);

    const input: KernelInput = {
      contractVersion: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      signals: { altitude: 150 },
      uncertainty: {},
      adapterId: 'test-adapter'
    };

    const result = compiled(input);

    // Should match S1 (first match)
    expect(result.outcome).toBe('S1');
  });

  test('applies override before outcome matching', () => {
    const spec: KernelSpec = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: [
        {
          outcomeId: 'S1',
          label: 'Safe',
          conditions: [
            {
              signalKey: 'altitude',
              operator: 'gt',
              value: 100
            }
          ],
          confidence: 'High',
          rationale: 'Altitude is safe'
        }
      ],
      overrides: [
        {
          overrideId: 'override-1',
          name: 'Emergency Override',
          conditions: [
            {
              signalKey: 'emergency',
              operator: 'eq',
              value: true
            }
          ],
          forcedOutcome: 'S1',
          reason: 'Emergency mode'
        }
      ]
    };

    const compiled = compileKernelSpec(spec);

    const input: KernelInput = {
      contractVersion: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      signals: { altitude: 50, emergency: true },
      uncertainty: {},
      adapterId: 'test-adapter'
    };

    const result = compiled(input);

    expect(result.outcome).toBe('S1');
    expect(result.overridesApplied).toContain('override-1');
  });

  test('disallows outcome when disallow rule matches', () => {
    const spec: KernelSpec = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: [
        {
          outcomeId: 'S1',
          label: 'Safe',
          conditions: [
            {
              signalKey: 'altitude',
              operator: 'gt',
              value: 100
            }
          ],
          confidence: 'High',
          rationale: 'Altitude is safe'
        }
      ],
      disallows: [
        {
          disallowId: 'disallow-1',
          name: 'Disallow Safe',
          conditions: [
            {
              signalKey: 'blocked',
              operator: 'eq',
              value: true
            }
          ],
          disallowedOutcome: 'S1',
          reason: 'Safe outcome is blocked'
        }
      ]
    };

    const compiled = compileKernelSpec(spec);

    const input: KernelInput = {
      contractVersion: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      signals: { altitude: 150, blocked: true },
      uncertainty: {},
      adapterId: 'test-adapter'
    };

    const result = compiled(input);

    // Should return UNKNOWN because S1 is disallowed
    expect(result.outcome).toBe('UNKNOWN');
    expect(result.rationale).toContain('disallowed');
  });

  test('returns UNKNOWN when no outcome matches', () => {
    const spec: KernelSpec = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: [
        {
          outcomeId: 'S1',
          label: 'Safe',
          conditions: [
            {
              signalKey: 'altitude',
              operator: 'gt',
              value: 100
            }
          ],
          confidence: 'High',
          rationale: 'Altitude is safe'
        }
      ]
    };

    const compiled = compileKernelSpec(spec);

    const input: KernelInput = {
      contractVersion: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      signals: { altitude: 50 },
      uncertainty: {},
      adapterId: 'test-adapter'
    };

    const result = compiled(input);

    expect(result.outcome).toBe('UNKNOWN');
    expect(result.confidence).toBe('Unknown');
  });
});








































