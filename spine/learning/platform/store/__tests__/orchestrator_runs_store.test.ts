/**
 * Tests for Orchestrator Runs Store.
 * Ensures: FIFO eviction at 20, newest-first list.
 */

import { InMemoryLearningStore } from '../InMemoryLearningStore';
import { OrchestratorRunRecord } from '../OrchestratorRunTypes';

describe('Orchestrator Runs Store', () => {
  let store: InMemoryLearningStore;

  beforeEach(() => {
    store = new InMemoryLearningStore();
  });

  function createRunRecord(runId: string, graphId: string = 'test_graph'): OrchestratorRunRecord {
    return {
      runId,
      graphId,
      createdAtIso: new Date().toISOString(),
      terminalOutcome: 'S1',
      summaryClaims: [],
      traceHighlights: [],
      nodeRunIds: []
    };
  }

  test('appends orchestrator run', () => {
    const learnerId = 'learner_1';
    const run = createRunRecord('run_1');

    store.appendOrchestratorRun(learnerId, run);

    const runs = store.listOrchestratorRuns(learnerId);
    expect(runs.length).toBe(1);
    expect(runs[0].runId).toBe('run_1');
  });

  test('lists orchestrator runs in newest-first order', () => {
    const learnerId = 'learner_1';
    
    for (let i = 1; i <= 5; i++) {
      const run = createRunRecord(`run_${i}`);
      store.appendOrchestratorRun(learnerId, run);
    }

    const runs = store.listOrchestratorRuns(learnerId);
    expect(runs.length).toBe(5);
    expect(runs[0].runId).toBe('run_5'); // Newest first
    expect(runs[4].runId).toBe('run_1'); // Oldest last
  });

  test('enforces FIFO eviction at 20', () => {
    const learnerId = 'learner_1';
    
    // Add 25 runs (more than max 20)
    for (let i = 1; i <= 25; i++) {
      const run = createRunRecord(`run_${i}`);
      store.appendOrchestratorRun(learnerId, run);
    }

    const runs = store.listOrchestratorRuns(learnerId);
    expect(runs.length).toBe(20); // Should be capped at 20
    expect(runs[0].runId).toBe('run_25'); // Newest
    expect(runs[19].runId).toBe('run_6'); // Oldest (run_1 through run_5 evicted)
  });

  test('gets orchestrator run by ID', () => {
    const learnerId = 'learner_1';
    const run = createRunRecord('run_1');

    store.appendOrchestratorRun(learnerId, run);

    const retrieved = store.getOrchestratorRun(learnerId, 'run_1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.runId).toBe('run_1');
  });

  test('returns undefined for non-existent run', () => {
    const learnerId = 'learner_1';
    const retrieved = store.getOrchestratorRun(learnerId, 'nonexistent');
    expect(retrieved).toBeUndefined();
  });

  test('respects limit parameter', () => {
    const learnerId = 'learner_1';
    
    for (let i = 1; i <= 10; i++) {
      const run = createRunRecord(`run_${i}`);
      store.appendOrchestratorRun(learnerId, run);
    }

    const runs = store.listOrchestratorRuns(learnerId, 5);
    expect(runs.length).toBe(5);
  });
});








































