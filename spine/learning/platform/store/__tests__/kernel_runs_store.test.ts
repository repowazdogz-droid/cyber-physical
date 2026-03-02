/**
 * Tests for kernel runs storage.
 * Covers: bounded storage, FIFO eviction, deterministic ordering.
 */

import { InMemoryLearningStore } from '../InMemoryLearningStore';
import { KernelRunRecord } from '../../../kernels/surfaces/learning/KernelSurfaceTypes';

describe('InMemoryLearningStore - Kernel Runs', () => {
  let store: InMemoryLearningStore;

  beforeEach(() => {
    store = new InMemoryLearningStore();
  });

  describe('appendKernelRun', () => {
    test('appends kernel run successfully', () => {
      const learnerId = 'learner_123';
      const run: KernelRunRecord = {
        runId: 'run_1',
        kernelId: 'test_kernel',
        adapterId: 'test_adapter',
        createdAtIso: new Date().toISOString(),
        inputHash: 'hash_1',
        decision: {
          outcomeId: 'S1',
          label: 'Continue',
          confidence: 'High',
          rationale: 'Test rationale'
        },
        claims: [],
        trace: []
      };

      store.appendKernelRun(learnerId, run);

      const runs = store.listKernelRuns(learnerId);
      expect(runs).toHaveLength(1);
      expect(runs[0].runId).toBe('run_1');
    });

    test('enforces max 50 kernel runs per learner (FIFO eviction)', () => {
      const learnerId = 'learner_123';

      // Add 51 runs
      for (let i = 1; i <= 51; i++) {
        const run: KernelRunRecord = {
          runId: `run_${i}`,
          kernelId: 'test_kernel',
          adapterId: 'test_adapter',
          createdAtIso: new Date().toISOString(),
          inputHash: `hash_${i}`,
          decision: {
            outcomeId: 'S1',
            label: 'Continue',
            confidence: 'High',
            rationale: 'Test rationale'
          },
          claims: [],
          trace: []
        };
        store.appendKernelRun(learnerId, run);
      }

      const runs = store.listKernelRuns(learnerId);
      expect(runs).toHaveLength(50);
      expect(runs[0].runId).toBe('run_51'); // Newest first
      expect(runs[49].runId).toBe('run_2'); // Oldest (run_1 evicted)
    });

    test('maintains deterministic ordering (newest first)', () => {
      const learnerId = 'learner_123';

      // Add 5 runs
      for (let i = 1; i <= 5; i++) {
        const run: KernelRunRecord = {
          runId: `run_${i}`,
          kernelId: 'test_kernel',
          adapterId: 'test_adapter',
          createdAtIso: new Date().toISOString(),
          inputHash: `hash_${i}`,
          decision: {
            outcomeId: 'S1',
            label: 'Continue',
            confidence: 'High',
            rationale: 'Test rationale'
          },
          claims: [],
          trace: []
        };
        store.appendKernelRun(learnerId, run);
      }

      const runs = store.listKernelRuns(learnerId);
      expect(runs).toHaveLength(5);
      // Should be newest first
      expect(runs[0].runId).toBe('run_5');
      expect(runs[1].runId).toBe('run_4');
      expect(runs[2].runId).toBe('run_3');
      expect(runs[3].runId).toBe('run_2');
      expect(runs[4].runId).toBe('run_1');
    });
  });

  describe('listKernelRuns', () => {
    test('returns empty array if no runs', () => {
      const runs = store.listKernelRuns('learner_123');
      expect(runs).toEqual([]);
    });

    test('respects limit parameter', () => {
      const learnerId = 'learner_123';

      // Add 10 runs
      for (let i = 1; i <= 10; i++) {
        const run: KernelRunRecord = {
          runId: `run_${i}`,
          kernelId: 'test_kernel',
          adapterId: 'test_adapter',
          createdAtIso: new Date().toISOString(),
          inputHash: `hash_${i}`,
          decision: {
            outcomeId: 'S1',
            label: 'Continue',
            confidence: 'High',
            rationale: 'Test rationale'
          },
          claims: [],
          trace: []
        };
        store.appendKernelRun(learnerId, run);
      }

      const runs = store.listKernelRuns(learnerId, 5);
      expect(runs).toHaveLength(5);
    });
  });

  describe('getKernelRun', () => {
    test('returns kernel run by ID', () => {
      const learnerId = 'learner_123';
      const run: KernelRunRecord = {
        runId: 'run_1',
        kernelId: 'test_kernel',
        adapterId: 'test_adapter',
        createdAtIso: new Date().toISOString(),
        inputHash: 'hash_1',
        decision: {
          outcomeId: 'S1',
          label: 'Continue',
          confidence: 'High',
          rationale: 'Test rationale'
        },
        claims: [],
        trace: []
      };

      store.appendKernelRun(learnerId, run);

      const retrieved = store.getKernelRun(learnerId, 'run_1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.runId).toBe('run_1');
    });

    test('returns undefined if run not found', () => {
      const retrieved = store.getKernelRun('learner_123', 'run_999');
      expect(retrieved).toBeUndefined();
    });

    test('returns undefined if learnerId mismatch', () => {
      const learnerId = 'learner_123';
      const run: KernelRunRecord = {
        runId: 'run_1',
        kernelId: 'test_kernel',
        adapterId: 'test_adapter',
        learnerId,
        createdAtIso: new Date().toISOString(),
        inputHash: 'hash_1',
        decision: {
          outcomeId: 'S1',
          label: 'Continue',
          confidence: 'High',
          rationale: 'Test rationale'
        },
        claims: [],
        trace: []
      };

      store.appendKernelRun(learnerId, run);

      const retrieved = store.getKernelRun('learner_456', 'run_1');
      expect(retrieved).toBeUndefined();
    });
  });
});








































