/**
 * Tests for Evidence Normalizer.
 * Ensures: strips internal keys, bounds sizes, deterministic ordering.
 */

import {
  normalizeEvidenceForDisplay,
  normalizeEvidenceArray,
  stripInternalKeys,
  truncate
} from '../EvidenceNormalizer';
import { ClaimEvidenceContract } from '../../contracts/ClaimContracts';

describe('Evidence Normalizer', () => {
  describe('stripInternalKeys', () => {
    test('strips internal/system keys', () => {
      const obj = {
        safeKey: 'value',
        internalDebug: 'debug',
        systemTrace: 'trace',
        anotherSafe: 123
      };

      const result = stripInternalKeys(obj);
      
      expect(result.safeKey).toBe('value');
      expect(result.anotherSafe).toBe(123);
      expect(result.internalDebug).toBeUndefined();
      expect(result.systemTrace).toBeUndefined();
    });

    test('bounds to max 5 keys', () => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < 10; i++) {
        obj[`key${i}`] = `value${i}`;
      }

      const result = stripInternalKeys(obj);
      expect(Object.keys(result).length).toBeLessThanOrEqual(5);
    });

    test('is deterministic', () => {
      const obj = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      };

      const result1 = stripInternalKeys(obj);
      const result2 = stripInternalKeys(obj);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('truncate', () => {
    test('truncates long text', () => {
      const longText = 'A'.repeat(200);
      const result = truncate(longText, 100);
      
      expect(result.length).toBe(100);
      expect(result).toContain('...');
    });

    test('preserves short text', () => {
      const shortText = 'Short text';
      const result = truncate(shortText, 100);
      
      expect(result).toBe(shortText);
    });

    test('is deterministic', () => {
      const text = 'Test text';
      const result1 = truncate(text, 100);
      const result2 = truncate(text, 100);
      
      expect(result1).toBe(result2);
    });
  });

  describe('normalizeEvidenceForDisplay', () => {
    test('bounds to max 5 items', () => {
      const evidence: ClaimEvidenceContract[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'trace_node',
        reference: `node_${i}`,
        description: `Description ${i}`
      }));

      const result = normalizeEvidenceForDisplay(evidence);
      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    test('strips internal/system references', () => {
      const evidence: ClaimEvidenceContract[] = [
        {
          type: 'trace_node',
          reference: 'safe_node',
          description: 'Safe description'
        },
        {
          type: 'trace_node',
          reference: 'internal_system_node',
          description: 'Internal description'
        }
      ];

      const result = normalizeEvidenceForDisplay(evidence);
      expect(result.items.length).toBe(1);
      expect(result.items[0].reference).toBe('safe_node');
    });

    test('bounds description to 120 chars', () => {
      const evidence: ClaimEvidenceContract[] = [
        {
          type: 'trace_node',
          reference: 'node_1',
          description: 'A'.repeat(200)
        }
      ];

      const result = normalizeEvidenceForDisplay(evidence);
      expect(result.items[0].description.length).toBeLessThanOrEqual(120);
    });

    test('bounds reference to 100 chars', () => {
      const evidence: ClaimEvidenceContract[] = [
        {
          type: 'trace_node',
          reference: 'A'.repeat(200),
          description: 'Description'
        }
      ];

      const result = normalizeEvidenceForDisplay(evidence);
      expect(result.items[0].reference.length).toBeLessThanOrEqual(100);
    });
  });

  describe('normalizeEvidenceArray', () => {
    test('sorts deterministically by reference', () => {
      const evidence: ClaimEvidenceContract[] = [
        { type: 'trace_node', reference: 'z_node', description: 'Z' },
        { type: 'trace_node', reference: 'a_node', description: 'A' },
        { type: 'trace_node', reference: 'm_node', description: 'M' }
      ];

      const result = normalizeEvidenceArray(evidence);
      expect(result.items[0].reference).toBe('a_node');
      expect(result.items[1].reference).toBe('m_node');
      expect(result.items[2].reference).toBe('z_node');
    });

    test('is deterministic', () => {
      const evidence: ClaimEvidenceContract[] = [
        { type: 'trace_node', reference: 'node_1', description: 'Desc 1' },
        { type: 'trace_node', reference: 'node_2', description: 'Desc 2' }
      ];

      const result1 = normalizeEvidenceArray(evidence);
      const result2 = normalizeEvidenceArray(evidence);
      
      expect(result1.items).toEqual(result2.items);
    });
  });
});








































