/**
 * Tests for Spec Validator.
 * Ensures: structural validation, bounds enforcement, calm error messages.
 */

import { validateKernelSpec } from '../SpecValidator';
import { KernelSpec } from '../SpecTypes';

describe('Spec Validator', () => {
  test('validates minimal valid spec', () => {
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

    const result = validateKernelSpec(spec);

    expect(result.ok).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('rejects spec without required fields', () => {
    const spec: any = {
      version: '1.0.0'
      // Missing kernelId, adapterId, name, outcomes
    };

    const result = validateKernelSpec(spec);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.code === 'MISSING_KERNEL_ID')).toBe(true);
  });

  test('rejects spec with too many outcomes', () => {
    const spec: KernelSpec = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: Array.from({ length: 25 }, (_, i) => ({
        outcomeId: `S${i}`,
        label: `Outcome ${i}`,
        conditions: [
          {
            signalKey: 'signal1',
            operator: 'eq',
            value: i
          }
        ],
        confidence: 'High',
        rationale: 'Test'
      }))
    };

    const result = validateKernelSpec(spec);

    expect(result.ok).toBe(true); // Still valid, just warning
    expect(result.warnings.some(w => w.code === 'TOO_MANY_OUTCOMES')).toBe(true);
  });

  test('rejects invalid condition operator', () => {
    const spec: any = {
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
              operator: 'invalid_operator',
              value: 100
            }
          ],
          confidence: 'High',
          rationale: 'Test'
        }
      ]
    };

    const result = validateKernelSpec(spec);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_OPERATOR')).toBe(true);
  });

  test('rejects outcome without conditions', () => {
    const spec: any = {
      version: '1.0.0',
      kernelId: 'test-kernel',
      adapterId: 'test-adapter',
      name: 'Test Kernel',
      description: 'A test kernel',
      outcomes: [
        {
          outcomeId: 'S1',
          label: 'Safe',
          conditions: [],
          confidence: 'High',
          rationale: 'Test'
        }
      ]
    };

    const result = validateKernelSpec(spec);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === 'MISSING_CONDITIONS')).toBe(true);
  });
});








































