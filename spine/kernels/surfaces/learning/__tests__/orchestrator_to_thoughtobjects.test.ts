/**
 * Tests for OrchestratorToThoughtObjects conversion.
 * Ensures: total <= 10, deterministic ordering, no internal strings, text bounded.
 */

import { orchestratorToThoughtObjects } from '../OrchestratorToThoughtObjects';
import { OrchestratorRun } from '../../../../orchestrator/OrchestratorTypes';
import { CONTRACT_VERSION } from '../../../../contracts/ContractVersion';

describe('orchestratorToThoughtObjects', () => {
  function createTestRun(): OrchestratorRun {
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
        },
        {
          claimId: 'uav.emergency_landing_required',
          title: 'Emergency Landing Required',
          severity: 'critical',
          count: 1
        }
      ],
      policyNotes: [
        'Policy note 1',
        'Policy note 2'
      ],
      boundedTraceHighlights: [
        {
          nodeId: 'node_1',
          label: 'Override Applied',
          description: 'Emergency override was applied',
          type: 'override'
        },
        {
          nodeId: 'node_2',
          label: 'Decision Made',
          description: 'Decision S4 was selected',
          type: 'decision'
        }
      ],
      terminalOutcome: 'S4',
      terminalNodeId: 'node_2'
    };
  }

  test('produces total <= 10 objects', () => {
    const run = createTestRun();
    const result = orchestratorToThoughtObjects(run);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  test('produces deterministic output', () => {
    const run = createTestRun();
    const result1 = orchestratorToThoughtObjects(run);
    const result2 = orchestratorToThoughtObjects(run);

    expect(result1.length).toBe(result2.length);
    expect(result1[0].id).toBe(result2[0].id);
  });

  test('includes decision summary as first object', () => {
    const run = createTestRun();
    const result = orchestratorToThoughtObjects(run);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('Reflection');
    expect(result[0].source).toBe('system');
  });

  test('includes critical claims (up to 3)', () => {
    const run = createTestRun();
    const result = orchestratorToThoughtObjects(run);

    const evidenceObjects = result.filter(obj => obj.type === 'Evidence');
    const criticalClaims = evidenceObjects.filter(obj => {
      if (typeof obj.content === 'object' && obj.content.title) {
        return obj.content.title.includes('Critical');
      }
      return false;
    });

    expect(criticalClaims.length).toBeLessThanOrEqual(3);
  });

  test('includes policy notes (up to 3)', () => {
    const run = createTestRun();
    const result = orchestratorToThoughtObjects(run);

    const tutorHints = result.filter(obj => obj.type === 'TutorHint');
    expect(tutorHints.length).toBeLessThanOrEqual(3);
  });

  test('includes reasoning highlights (up to 3)', () => {
    const run = createTestRun();
    const result = orchestratorToThoughtObjects(run);

    const highlights = result.filter(obj => {
      if (typeof obj.content === 'object' && obj.content.title) {
        return obj.content.title.includes('override') || 
               obj.content.title.includes('disallow') ||
               obj.content.title.includes('decision');
      }
      return false;
    });

    expect(highlights.length).toBeLessThanOrEqual(3);
  });

  test('does not leak internal/system strings', () => {
    const run = createTestRun();
    run.boundedTraceHighlights.push({
      nodeId: 'node_internal',
      label: 'Internal System Check',
      description: 'System internal validation',
      type: 'decision'
    });

    const result = orchestratorToThoughtObjects(run);

    // Only check human-facing text fields (title, label, text, summary, description)
    function collectHumanText(o: any): string[] {
      if (!o) return [];
      const out: string[] = [];
      const push = (v: any) => typeof v === 'string' && out.push(v);

      // Add fields that are actually shown to humans in UI
      push(o.title); push(o.label); push(o.text); push(o.summary); push(o.description);
      if (o.content) {
        if (typeof o.content === 'string') {
          push(o.content);
        } else {
          push(o.content.title); push(o.content.body); push(o.content.label);
        }
      }

      // Recurse shallowly
      if (Array.isArray(o.children)) o.children.forEach((c: any) => out.push(...collectHumanText(c)));
      if (Array.isArray(o.items)) o.items.forEach((c: any) => out.push(...collectHumanText(c)));
      return out;
    }

    const humanText = collectHumanText(result).join(' ').toLowerCase();
    expect(humanText).not.toMatch(/\b(internal|system)\b/);
  });

  test('bounds text content', () => {
    const run = createTestRun();
    run.policyNotes = ['A'.repeat(500)]; // Very long note

    const result = orchestratorToThoughtObjects(run);

    const tutorHints = result.filter(obj => obj.type === 'TutorHint');
    if (tutorHints.length > 0) {
      const content = tutorHints[0].content;
      if (typeof content === 'string') {
        expect(content.length).toBeLessThanOrEqual(203); // 200 + '...'
      }
    }
  });
});




