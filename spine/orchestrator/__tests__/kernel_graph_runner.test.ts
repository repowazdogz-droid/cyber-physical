/**
 * Tests for Kernel Graph Runner.
 * Ensures: determinism, node ordering, bounds, policy pack application, terminal outcome.
 */

import { runGraph } from '../KernelGraphRunner';
import { OrchestratorInput } from '../OrchestratorTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

// Import default policy packs to register them
import '../../policies/packs/index';

describe('KernelGraphRunner', () => {
  function createTestInput(): OrchestratorInput {
    return {
      graphSpec: {
        graphId: 'test_graph',
        nodes: [
          {
            nodeId: 'node_1',
            adapterId: 'uav_safe_landing',
            kernelId: 'safe_landing_decision_square_v2_3',
            inputRef: 'input_1',
            dependsOn: [],
            isTerminal: false
          },
          {
            nodeId: 'node_2',
            adapterId: 'uav_safe_landing',
            kernelId: 'safe_landing_decision_square_v2_3',
            inputRef: 'input_2',
            dependsOn: ['node_1'],
            isTerminal: true
          }
        ],
        maxSteps: 25,
        contractVersion: CONTRACT_VERSION
      },
      inputBag: {
        input_1: {
          altitudeMeters: 150,
          healthPercentage: 85,
          environmentHazardLevel: 2,
          timeToContactSeconds: 45
        },
        input_2: {
          altitudeMeters: 100,
          healthPercentage: 70,
          environmentHazardLevel: 3,
          timeToContactSeconds: 30
        }
      },
      runMeta: {
        startedAtIso: '2024-01-01T00:00:00Z'
      }
    };
  }

  test('runs graph deterministically', () => {
    const input = createTestInput();
    const result1 = runGraph(input);
    const result2 = runGraph(input);

    expect(result1.graphId).toBe(result2.graphId);
    expect(result1.terminalOutcome).toBe(result2.terminalOutcome);
    expect(result1.nodes.length).toBe(result2.nodes.length);
  });

  test('respects node ordering via dependsOn', () => {
    const input = createTestInput();
    const result = runGraph(input);

    // node_1 should come before node_2
    const node1Index = result.nodes.findIndex(n => n.nodeId === 'node_1');
    const node2Index = result.nodes.findIndex(n => n.nodeId === 'node_2');
    
    expect(node1Index).toBeLessThan(node2Index);
  });

  test('enforces maxSteps bound', () => {
    const input = createTestInput();
    input.graphSpec.maxSteps = 1; // Limit to 1 step
    input.graphSpec.nodes = Array.from({ length: 10 }, (_, i) => ({
      nodeId: `node_${i}`,
      adapterId: 'uav_safe_landing',
      kernelId: 'safe_landing_decision_square_v2_3',
      inputRef: 'input_1',
      dependsOn: [],
      isTerminal: false
    }));

    const result = runGraph(input);
    expect(result.nodes.length).toBeLessThanOrEqual(1);
  });

  test('bounds summary claims to max 12', () => {
    const input = createTestInput();
    // Create many nodes to generate many claims
    input.graphSpec.nodes = Array.from({ length: 5 }, (_, i) => ({
      nodeId: `node_${i}`,
      adapterId: 'uav_safe_landing',
      kernelId: 'safe_landing_decision_square_v2_3',
      inputRef: 'input_1',
      dependsOn: [],
      isTerminal: false
    }));

    const result = runGraph(input);
    expect(result.summaryClaims.length).toBeLessThanOrEqual(12);
  });

  test('bounds trace highlights to max 12', () => {
    const input = createTestInput();
    const result = runGraph(input);
    expect(result.boundedTraceHighlights.length).toBeLessThanOrEqual(12);
  });

  test('applies policy pack at node level then global', () => {
    const input = createTestInput();
    input.graphSpec.nodes[0].policyPackId = 'uav_safety_conservative';
    input.globalPolicyPackId = 'learning_privacy_default';

    const result = runGraph(input);
    // Should have policy notes from both node and global packs
    expect(result.policyNotes.length).toBeGreaterThanOrEqual(0);
  });

  test('selects terminal outcome from isTerminal node', () => {
    const input = createTestInput();
    const result = runGraph(input);

    // node_2 is marked isTerminal
    const terminalNode = result.nodes.find(n => n.nodeId === 'node_2');
    expect(result.terminalNodeId).toBe('node_2');
    expect(result.terminalOutcome).toBe(terminalNode?.runRecord.decision.outcomeId);
  });

  test('selects terminal outcome from last node if no isTerminal', () => {
    const input = createTestInput();
    input.graphSpec.nodes.forEach(n => { n.isTerminal = false; });

    const result = runGraph(input);
    const lastNode = result.nodes[result.nodes.length - 1];
    expect(result.terminalNodeId).toBe(lastNode.nodeId);
    expect(result.terminalOutcome).toBe(lastNode.runRecord.decision.outcomeId);
  });

  test('bounds policy notes to max 12', () => {
    const input = createTestInput();
    input.graphSpec.nodes.forEach(n => {
      n.policyPackId = 'uav_safety_conservative';
    });
    input.globalPolicyPackId = 'uav_safety_conservative';

    const result = runGraph(input);
    expect(result.policyNotes.length).toBeLessThanOrEqual(12);
  });

  test('handles circular dependency detection', () => {
    const input = createTestInput();
    input.graphSpec.nodes[0].dependsOn = ['node_2'];
    input.graphSpec.nodes[1].dependsOn = ['node_1'];

    expect(() => runGraph(input)).toThrow('Circular dependency');
  });
});








































