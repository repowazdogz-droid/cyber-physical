/**
 * Tests for Policy Pack Application.
 * Ensures: deterministic application, no mutation, disallow/override behavior.
 */

import { applyPolicyPack } from '../applyPolicyPack';
import { PolicyPack } from '../PolicyPackTypes';
import { KernelRunContract } from '../../contracts/KernelContracts';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

describe('Policy Pack Application', () => {
  function createTestRun(outcome: string): KernelRunContract {
    return {
      contractVersion: CONTRACT_VERSION,
      runId: 'test_run_1',
      kernelId: 'test_kernel',
      adapterId: 'test_adapter',
      input: {
        contractVersion: CONTRACT_VERSION,
        timestamp: '2024-01-01T00:00:00Z',
        signals: { testSignal: 'value' },
        uncertainty: {},
        overrides: {}
      },
      decision: {
        contractVersion: CONTRACT_VERSION,
        outcome,
        confidence: 'High',
        rationale: 'Test rationale',
        assumptions: [],
        uncertainties: [],
        kernelId: 'test_kernel',
        adapterId: 'test_adapter'
      },
      trace: {
        contractVersion: CONTRACT_VERSION,
        traceId: 'test_trace_1',
        nodes: [],
        claims: [],
        summary: 'Test trace',
        kernelVersion: '1.0'
      },
      createdAtIso: '2024-01-01T00:00:00Z',
      inputHash: 'test_hash'
    };
  }

  test('does not mutate input run', () => {
    const run = createTestRun('S1');
    const pack: PolicyPack = {
      contractVersion: CONTRACT_VERSION,
      descriptor: {
        id: 'test_pack',
        version: '1.0.0',
        description: 'Test pack',
        domains: ['test']
      },
      overrides: [],
      disallows: []
    };

    const result = applyPolicyPack(run, pack);
    
    // Original run should be unchanged
    expect(run.decision.outcome).toBe('S1');
    // Result should be a new object
    expect(result.run).not.toBe(run);
  });

  test('applies disallow rule', () => {
    const run = createTestRun('S1');
    const pack: PolicyPack = {
      contractVersion: CONTRACT_VERSION,
      descriptor: {
        id: 'test_pack',
        version: '1.0.0',
        description: 'Test pack',
        domains: ['test']
      },
      overrides: [],
      disallows: [
        {
          id: 'disallow_s1',
          outcome: 'S1',
          reason: 'S1 is disallowed by policy',
          priority: 100
        }
      ]
    };

    const result = applyPolicyPack(run, pack);
    
    expect(result.run.decision.outcome).toBe('REFUSE_TO_DECIDE');
    expect(result.disallowedOutcomes).toContain('S1');
    expect(result.policyNotes.length).toBeGreaterThan(0);
  });

  test('applies override rule', () => {
    const run = createTestRun('S1');
    const pack: PolicyPack = {
      contractVersion: CONTRACT_VERSION,
      descriptor: {
        id: 'test_pack',
        version: '1.0.0',
        description: 'Test pack',
        domains: ['test']
      },
      overrides: [
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_1',
          forcedOutcome: 'S4',
          reason: 'Override applied',
          priority: 90,
          condition: 'testSignal === value'
        }
      ],
      disallows: []
    };

    const result = applyPolicyPack(run, pack);
    
    expect(result.run.decision.outcome).toBe('S4');
    expect(result.appliedOverrides).toContain('override_1');
    expect(result.policyNotes.length).toBeGreaterThan(0);
  });

  test('prioritizes disallow over override', () => {
    const run = createTestRun('S1');
    const pack: PolicyPack = {
      contractVersion: CONTRACT_VERSION,
      descriptor: {
        id: 'test_pack',
        version: '1.0.0',
        description: 'Test pack',
        domains: ['test']
      },
      overrides: [
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_1',
          forcedOutcome: 'S2',
          reason: 'Override',
          priority: 50,
          condition: 'testSignal === value'
        }
      ],
      disallows: [
        {
          id: 'disallow_s1',
          outcome: 'S1',
          reason: 'Disallowed',
          priority: 100
        }
      ]
    };

    const result = applyPolicyPack(run, pack);
    
    // Disallow should win (checked first)
    expect(result.run.decision.outcome).toBe('REFUSE_TO_DECIDE');
  });

  test('bounds policy notes to max 3', () => {
    const run = createTestRun('S1');
    const pack: PolicyPack = {
      contractVersion: CONTRACT_VERSION,
      descriptor: {
        id: 'test_pack',
        version: '1.0.0',
        description: 'Test pack',
        domains: ['test']
      },
      overrides: [
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_1',
          forcedOutcome: 'S2',
          reason: 'A'.repeat(200), // Long reason
          priority: 90,
          condition: 'testSignal === value'
        },
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_2',
          forcedOutcome: 'S3',
          reason: 'Another override',
          priority: 80,
          condition: 'testSignal === value'
        },
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_3',
          forcedOutcome: 'S4',
          reason: 'Third override',
          priority: 70,
          condition: 'testSignal === value'
        },
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_4',
          forcedOutcome: 'S4',
          reason: 'Fourth override',
          priority: 60,
          condition: 'testSignal === value'
        }
      ],
      disallows: []
    };

    const result = applyPolicyPack(run, pack);
    
    // Should only show first override (highest priority)
    expect(result.policyNotes.length).toBeLessThanOrEqual(3);
  });

  test('is deterministic', () => {
    const run = createTestRun('S1');
    const pack: PolicyPack = {
      contractVersion: CONTRACT_VERSION,
      descriptor: {
        id: 'test_pack',
        version: '1.0.0',
        description: 'Test pack',
        domains: ['test']
      },
      overrides: [
        {
          contractVersion: CONTRACT_VERSION,
          overrideId: 'override_1',
          forcedOutcome: 'S2',
          reason: 'Override',
          priority: 90,
          condition: 'testSignal === value'
        }
      ],
      disallows: []
    };

    const result1 = applyPolicyPack(run, pack);
    const result2 = applyPolicyPack(run, pack);
    
    expect(result1.run.decision.outcome).toBe(result2.run.decision.outcome);
    expect(result1.policyNotes).toEqual(result2.policyNotes);
  });
});








































