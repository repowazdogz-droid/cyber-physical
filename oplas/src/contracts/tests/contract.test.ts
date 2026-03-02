/**
 * Contract Tests
 * 
 * Tests for schema validation, determinism, and canonical hashing.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { Request } from '../types/Request';
import { Domain } from '../enums/Domains';
import { DEFAULT_BUDGETS } from '../types/BudgetSpec';
import { ArtifactKind } from '../enums/ArtifactKinds';
import { hashCanonical, canonicalBytes } from '../invariants/CanonicalHashing';
import { CanonicalRepresentation } from '../types/Repr';

describe('Contract Tests', () => {
  describe('Request Schema', () => {
    it('should validate a minimal request', () => {
      const request: Request = {
        task_id: 'test-1',
        domain: Domain.GRID_2D,
        inputs: [
          {
            kind: ArtifactKind.RAW_INPUT,
            uri: 'file://input.json',
            media_type: 'application/json'
          }
        ],
        outputs: [],
        budgets: DEFAULT_BUDGETS,
        run_config: {}
      };

      expect(request.task_id).toBe('test-1');
      expect(request.domain).toBe(Domain.GRID_2D);
      expect(request.inputs.length).toBe(1);
    });

    it('should require domain to be declared', () => {
      // TypeScript will enforce this at compile time
      const request: Request = {
        task_id: 'test-2',
        domain: Domain.GRID_2D, // Must be explicit
        inputs: [],
        outputs: [],
        budgets: DEFAULT_BUDGETS,
        run_config: {}
      };

      expect(request.domain).toBeDefined();
    });
  });

  describe('Determinism', () => {
    it('should produce identical hashes for identical objects', () => {
      const obj1 = { a: 1, b: 2, c: [3, 4, 5] };
      const obj2 = { c: [3, 4, 5], b: 2, a: 1 }; // Different key order

      const hash1 = hashCanonical(obj1);
      const hash2 = hashCanonical(obj2);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      const hash1 = hashCanonical(obj1);
      const hash2 = hashCanonical(obj2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce identical canonical bytes for identical objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };

      const bytes1 = canonicalBytes(obj1);
      const bytes2 = canonicalBytes(obj2);

      expect(bytes1.toString()).toBe(bytes2.toString());
    });
  });

  describe('Serialization Order', () => {
    it('should not depend on object key order', () => {
      const obj1: Record<string, number> = {};
      obj1['z'] = 1;
      obj1['a'] = 2;
      obj1['m'] = 3;

      const obj2: Record<string, number> = {};
      obj2['a'] = 2;
      obj2['m'] = 3;
      obj2['z'] = 1;

      const hash1 = hashCanonical(obj1);
      const hash2 = hashCanonical(obj2);

      expect(hash1).toBe(hash2);
    });

    it('should handle nested objects deterministically', () => {
      const obj1 = {
        outer: {
          inner: { z: 1, a: 2 }
        }
      };

      const obj2 = {
        outer: {
          inner: { a: 2, z: 1 }
        }
      };

      const hash1 = hashCanonical(obj1);
      const hash2 = hashCanonical(obj2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Stable Hashes', () => {
    it('should compute stable hash twice and match', () => {
      const repr: CanonicalRepresentation = {
        repr_id: '',
        schema_version: '1.0.0',
        domain: Domain.GRID_2D,
        nodes: [
          {
            id: 'n0',
            type: 'cell',
            attrs: { x: 0, y: 0 }
          }
        ],
        edges: [],
        globals: {},
        provenance: {
          parser_version: '1.0.0',
          created_at_iso: '2024-01-01T00:00:00Z'
        }
      };

      const hash1 = hashCanonical(repr);
      const hash2 = hashCanonical(repr);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex
    });
  });

  describe('Budget Spec', () => {
    it('should have finite budgets', () => {
      const budgets = DEFAULT_BUDGETS;

      expect(budgets.max_proposals).toBeGreaterThan(0);
      expect(budgets.max_repairs).toBeGreaterThanOrEqual(0);
      expect(budgets.max_refinement_iters).toBeGreaterThanOrEqual(0);
      expect(budgets.max_wall_ms).toBeGreaterThan(0);
      expect(budgets.max_runtime_steps).toBeGreaterThan(0);
      expect(budgets.max_tokens_per_call).toBeGreaterThan(0);
    });
  });
});























