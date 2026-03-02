/**
 * Tests for UAV formatters.
 * Ensures: bounded output, deterministic formatting.
 */

import { formatOutcome, formatClaims, pickTraceHighlights, buildTalkTrack } from '../formatters';
import { UAV_PRESETS } from '../presets';
import { KernelRunRecord } from '../../../../spine/kernels/surfaces/learning/KernelSurfaceTypes';

describe('UAV Formatters', () => {
  describe('formatOutcome', () => {
    test('formats S1 correctly', () => {
      const result = formatOutcome('S1');
      expect(result.label).toBe('Continue Mission');
      expect(result.oneLiner).toBe('All systems nominal. Safe to continue.');
    });

    test('formats S4 correctly', () => {
      const result = formatOutcome('S4');
      expect(result.label).toBe('Emergency Landing');
      expect(result.oneLiner).toBe('Emergency conditions. Immediate landing required.');
    });

    test('handles unknown outcome', () => {
      const result = formatOutcome('UNKNOWN');
      expect(result.label).toBe('UNKNOWN');
      expect(result.oneLiner).toContain('Decision outcome');
    });
  });

  describe('formatClaims', () => {
    test('bounds claim text to 80 chars', () => {
      const claims = [
        { id: '1', type: 'Safety', text: 'A'.repeat(100) }
      ];
      const result = formatClaims(claims);
      expect(result[0].length).toBeLessThanOrEqual(80);
      expect(result[0]).toContain('...');
    });

    test('limits to 6 claims', () => {
      const claims = Array.from({ length: 10 }, (_, i) => ({
        id: `claim_${i}`,
        type: 'Safety',
        text: `Claim ${i}`
      }));
      const result = formatClaims(claims);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    test('preserves short claims', () => {
      const claims = [
        { id: '1', type: 'Safety', text: 'Short claim' }
      ];
      const result = formatClaims(claims);
      expect(result[0]).toBe('Short claim');
    });
  });

  describe('pickTraceHighlights', () => {
    test('limits to 6 highlights', () => {
      const trace = Array.from({ length: 20 }, (_, i) => ({
        id: `node_${i}`,
        type: 'Policy' as const,
        label: `Node ${i}`,
        description: `Description ${i}`,
        timestamp: new Date().toISOString()
      }));

      const result = pickTraceHighlights(trace);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    test('prioritizes Decision and Policy nodes', () => {
      const trace = [
        { id: '1', type: 'Input' as const, label: 'Input', description: 'Input node', timestamp: new Date().toISOString() },
        { id: '2', type: 'Decision' as const, label: 'Decision', description: 'Decision node', timestamp: new Date().toISOString() },
        { id: '3', type: 'Policy' as const, label: 'Policy', description: 'Policy node', timestamp: new Date().toISOString() }
      ];

      const result = pickTraceHighlights(trace);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe('Decision');
    });

    test('bounds description length', () => {
      const trace = [
        {
          id: '1',
          type: 'Decision' as const,
          label: 'Decision',
          description: 'A'.repeat(200),
          timestamp: new Date().toISOString()
        }
      ];

      const result = pickTraceHighlights(trace);
      expect(result[0].sentence.length).toBeLessThanOrEqual(150);
    });
  });

  describe('buildTalkTrack', () => {
    test('produces 4-6 bullets', () => {
      const preset = UAV_PRESETS[0];
      const run: KernelRunRecord = {
        runId: 'run_1',
        kernelId: 'test',
        adapterId: 'test',
        createdAtIso: new Date().toISOString(),
        inputHash: 'hash_1',
        decision: {
          outcomeId: 'S1',
          label: 'Continue',
          confidence: 'High',
          rationale: 'Test rationale'
        },
        claims: [
          { id: '1', type: 'Safety', text: 'Claim 1' }
        ],
        trace: []
      };

      const result = buildTalkTrack(preset, run);
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    test('includes preset title and whatHappening', () => {
      const preset = UAV_PRESETS[0];
      const run: KernelRunRecord = {
        runId: 'run_1',
        kernelId: 'test',
        adapterId: 'test',
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

      const result = buildTalkTrack(preset, run);
      expect(result[0]).toContain(preset.title);
      expect(result[1]).toContain(preset.whatHappening);
    });

    test('includes decision and confidence', () => {
      const preset = UAV_PRESETS[0];
      const run: KernelRunRecord = {
        runId: 'run_1',
        kernelId: 'test',
        adapterId: 'test',
        createdAtIso: new Date().toISOString(),
        inputHash: 'hash_1',
        decision: {
          outcomeId: 'S1',
          label: 'Continue',
          confidence: 'High',
          rationale: 'Test rationale'
        },
        claims: [{ id: '1', type: 'Safety', text: 'Claim' }],
        trace: []
      };

      const result = buildTalkTrack(preset, run);
      expect(result.some(bullet => bullet.includes('Continue Mission'))).toBe(true);
      expect(result.some(bullet => bullet.includes('High'))).toBe(true);
    });
  });
});








































