/**
 * LLM Payload Bounds Tests
 * 
 * Ensures payloads are properly bounded before sending to LLM.
 */

import { buildExplainablePayload, buildRegressionDiffPayload } from '../llmPayloadBuilder';
import { ExplainableDisplayModel } from '../ExplainableTypes';

describe('LLM Payload Bounds', () => {
  describe('buildExplainablePayload', () => {
    it('should cap claims to 8', () => {
      const model: ExplainableDisplayModel = {
        outcome: {
          label: 'Test Outcome',
          subtitle: 'Test subtitle'
        },
        claimChips: Array.from({ length: 20 }, (_, i) => ({
          id: `claim_${i}`,
          text: `Claim ${i}`,
          severity: 'info' as const
        })),
        policyNotes: [],
        reasoningItems: []
      };

      const payload = buildExplainablePayload(model);
      expect(payload.claims.length).toBe(8);
    });

    it('should cap policy notes to 3', () => {
      const model: ExplainableDisplayModel = {
        outcome: {
          label: 'Test Outcome',
          subtitle: 'Test subtitle'
        },
        claimChips: [],
        policyNotes: Array.from({ length: 10 }, (_, i) => ({
          id: `note_${i}`,
          text: `Note ${i}`
        })),
        reasoningItems: []
      };

      const payload = buildExplainablePayload(model);
      expect(payload.policyNotes.length).toBe(3);
    });

    it('should cap reasoning highlights to 6', () => {
      const model: ExplainableDisplayModel = {
        outcome: {
          label: 'Test Outcome',
          subtitle: 'Test subtitle'
        },
        claimChips: [],
        policyNotes: [],
        reasoningItems: Array.from({ length: 15 }, (_, i) => ({
          id: `item_${i}`,
          title: `Title ${i}`,
          sentence: `Sentence ${i}`,
          type: 'decision' as const,
          priority: 50
        }))
      };

      const payload = buildExplainablePayload(model);
      expect(payload.reasoningHighlights.length).toBe(6);
    });

    it('should bound string lengths', () => {
      const model: ExplainableDisplayModel = {
        outcome: {
          label: 'A'.repeat(100),
          subtitle: 'B'.repeat(200)
        },
        claimChips: [{
          id: 'claim1',
          text: 'C'.repeat(150),
          severity: 'info'
        }],
        policyNotes: [],
        reasoningItems: []
      };

      const payload = buildExplainablePayload(model);
      expect(payload.outcome.label.length).toBeLessThanOrEqual(60);
      expect(payload.outcome.subtitle.length).toBeLessThanOrEqual(120);
      expect(payload.claims[0].text.length).toBeLessThanOrEqual(80);
    });
  });

  describe('buildRegressionDiffPayload', () => {
    it('should cap topChanged to 8', () => {
      const diffSummary = {
        label: 'Test Diff',
        criticalCount: 5,
        warnCount: 3,
        topChanged: Array.from({ length: 20 }, (_, i) => ({
          severity: 'info',
          path: `path_${i}`,
          message: `message_${i}`
        }))
      };

      const payload = buildRegressionDiffPayload(diffSummary);
      expect(payload.topChanged?.length).toBe(8);
    });

    it('should bound string lengths', () => {
      const diffSummary = {
        label: 'A'.repeat(200),
        topChanged: [{
          severity: 'critical',
          path: 'B'.repeat(200),
          message: 'C'.repeat(300)
        }]
      };

      const payload = buildRegressionDiffPayload(diffSummary);
      expect(payload.label?.length).toBeLessThanOrEqual(100);
      expect(payload.topChanged?.[0].path.length).toBeLessThanOrEqual(100);
      expect(payload.topChanged?.[0].message.length).toBeLessThanOrEqual(200);
    });
  });
});







































