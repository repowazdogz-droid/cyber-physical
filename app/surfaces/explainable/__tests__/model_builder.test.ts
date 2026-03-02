/**
 * Tests for Explainable Model Builder.
 * Ensures: determinism, bounds enforcement, no internal markers leak, severity ordering stable.
 */

import { buildFromKernelRun, buildFromOrchestratorRun } from '../ExplainableModelBuilder';
import { KernelRunRecord } from '@spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { OrchestratorRun } from '@spine/orchestrator/OrchestratorTypes';
import { CONTRACT_VERSION } from '@spine/contracts/ContractVersion';

describe('Explainable Model Builder', () => {
  function createTestKernelRun(): KernelRunRecord {
    return {
      runId: 'test_run_1',
      kernelId: 'test_kernel',
      adapterId: 'test_adapter',
      createdAtIso: '2024-01-01T00:00:00Z',
      inputHash: 'test_hash',
      decision: {
        outcomeId: 'S1',
        label: 'Continue Mission',
        confidence: 'High',
        rationale: 'Nominal conditions detected. All systems operational.'
      },
      claims: [
        {
          id: 'claim_1',
          type: 'Safety',
          text: 'System is safe under these conditions'
        },
        {
          id: 'claim_2',
          type: 'Determinism',
          text: 'Same input produces identical decision'
        }
      ],
      trace: [
        {
          id: 'node_1',
          type: 'Decision',
          label: 'Decision Made',
          description: 'Decision S1 selected based on nominal conditions',
          timestamp: '2024-01-01T00:00:00Z'
        }
      ]
    };
  }

  function createTestOrchestratorRun(): OrchestratorRun {
    return {
      contractVersion: CONTRACT_VERSION,
      graphId: 'test_graph',
      startedAtIso: '2024-01-01T00:00:00Z',
      nodes: [],
      summaryClaims: [
        {
          claimId: 'core.deterministic',
          title: 'Deterministic Output',
          severity: 'info',
          count: 1
        }
      ],
      policyNotes: ['Policy note 1'],
      boundedTraceHighlights: [
        {
          nodeId: 'node_1',
          label: 'Decision Made',
          description: 'Decision S1 selected',
          type: 'decision'
        }
      ],
      terminalOutcome: 'S1',
      terminalNodeId: 'node_1'
    };
  }

  test('produces deterministic output for kernel run', () => {
    const run = createTestKernelRun();
    const model1 = buildFromKernelRun(run);
    const model2 = buildFromKernelRun(run);

    expect(model1.outcome.label).toBe(model2.outcome.label);
    expect(model1.claimChips).toEqual(model2.claimChips);
    expect(model1.reasoningItems).toEqual(model2.reasoningItems);
  });

  test('produces deterministic output for orchestrator run', () => {
    const run = createTestOrchestratorRun();
    const model1 = buildFromOrchestratorRun(run);
    const model2 = buildFromOrchestratorRun(run);

    expect(model1.outcome.label).toBe(model2.outcome.label);
    expect(model1.claimChips).toEqual(model2.claimChips);
    expect(model1.policyNotes).toEqual(model2.policyNotes);
  });

  test('bounds claim chips to max 8', () => {
    const run = createTestKernelRun();
    // Add many claims
    run.claims = Array.from({ length: 20 }, (_, i) => ({
      id: `claim_${i}`,
      type: 'Safety',
      text: `Claim ${i}`
    }));

    const model = buildFromKernelRun(run);
    expect(model.claimChips.length).toBeLessThanOrEqual(8);
  });

  test('bounds reasoning items to max 12', () => {
    const run = createTestKernelRun();
    // Add many trace nodes
    run.trace = Array.from({ length: 30 }, (_, i) => ({
      id: `node_${i}`,
      type: 'Decision',
      label: `Node ${i}`,
      description: `Description ${i}`,
      timestamp: '2024-01-01T00:00:00Z'
    }));

    const model = buildFromKernelRun(run, { includeReasoning: true });
    expect(model.reasoningItems.length).toBeLessThanOrEqual(12);
  });

  test('bounds policy notes to max 3', () => {
    const run = createTestOrchestratorRun();
    run.policyNotes = ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5'];

    const model = buildFromOrchestratorRun(run);
    expect(model.policyNotes.length).toBeLessThanOrEqual(3);
  });

  test('bounds talk track bullets to max 6', () => {
    const run = createTestKernelRun();
    // Add many trace nodes to generate many bullets
    run.trace = Array.from({ length: 20 }, (_, i) => ({
      id: `node_${i}`,
      type: 'Decision',
      label: `Node ${i}`,
      description: `Description ${i}`,
      timestamp: '2024-01-01T00:00:00Z'
    }));

    const model = buildFromKernelRun(run, { includeTalkTrack: true });
    expect(model.talkTrack?.bullets.length).toBeLessThanOrEqual(6);
  });

  test('strips internal/system markers from labels', () => {
    const run = createTestKernelRun();
    run.trace[0].label = 'Internal System Check';
    run.trace[0].description = 'System internal validation';

    const model = buildFromKernelRun(run, { includeReasoning: true });

    // Check that no internal/system strings appear
    for (const item of model.reasoningItems) {
      expect(item.title.toLowerCase()).not.toContain('internal');
      expect(item.title.toLowerCase()).not.toContain('system');
      expect(item.sentence.toLowerCase()).not.toContain('internal');
      expect(item.sentence.toLowerCase()).not.toContain('system');
    }
  });

  test('sorts claim chips by severity (critical > warn > info)', () => {
    const run = createTestKernelRun();
    run.claims = [
      { id: 'claim_1', type: 'Safety', text: 'Info claim' },
      { id: 'claim_2', type: 'Safety', text: 'Critical claim' },
      { id: 'claim_3', type: 'Safety', text: 'Warn claim' }
    ];

    const model = buildFromKernelRun(run);
    const severities = model.claimChips.map(c => c.severity);
    
    // Should be sorted: critical, warn, info (or similar)
    // At minimum, critical should come before info
    const criticalIndex = severities.indexOf('critical');
    const infoIndex = severities.indexOf('info');
    if (criticalIndex !== -1 && infoIndex !== -1) {
      expect(criticalIndex).toBeLessThan(infoIndex);
    }
  });

  test('sorts reasoning items by priority (descending)', () => {
    const run = createTestKernelRun();
    run.trace = [
      { id: 'node_1', type: 'Decision', label: 'Decision', description: 'Desc', timestamp: '2024-01-01T00:00:00Z' },
      { id: 'node_2', type: 'Override', label: 'Override', description: 'Desc', timestamp: '2024-01-01T00:00:00Z' },
      { id: 'node_3', type: 'Policy', label: 'Policy', description: 'Desc', timestamp: '2024-01-01T00:00:00Z' }
    ];

    const model = buildFromKernelRun(run, { includeReasoning: true });
    const priorities = model.reasoningItems.map(i => i.priority);
    
    // Should be sorted descending
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i]).toBeLessThanOrEqual(priorities[i - 1]);
    }
  });

  test('bounds outcome label to max 60 chars', () => {
    const run = createTestKernelRun();
    run.decision.label = 'A'.repeat(100);

    const model = buildFromKernelRun(run);
    expect(model.outcome.label.length).toBeLessThanOrEqual(60);
  });

  test('bounds outcome subtitle to max 120 chars', () => {
    const run = createTestKernelRun();
    run.decision.rationale = 'A'.repeat(200);

    const model = buildFromKernelRun(run);
    expect(model.outcome.subtitle.length).toBeLessThanOrEqual(120);
  });
});




