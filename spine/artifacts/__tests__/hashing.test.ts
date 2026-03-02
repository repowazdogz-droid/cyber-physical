/**
 * Tests for Hashing.
 * Ensures: stable hash across key order changes.
 */

import { hashArtifact, hashString } from '../Hashing';

describe('Hashing', () => {
  test('produces same hash for same payload', () => {
    const payload = { a: 1, b: 2, c: 3 };
    const hash1 = hashArtifact(payload);
    const hash2 = hashArtifact(payload);
    expect(hash1).toBe(hash2);
  });

  test('produces same hash regardless of key order', () => {
    const payload1 = { a: 1, b: 2, c: 3 };
    const payload2 = { c: 3, a: 1, b: 2 };
    const hash1 = hashArtifact(payload1);
    const hash2 = hashArtifact(payload2);
    expect(hash1).toBe(hash2);
  });

  test('produces different hash for different payloads', () => {
    const payload1 = { a: 1, b: 2 };
    const payload2 = { a: 1, b: 3 };
    const hash1 = hashArtifact(payload1);
    const hash2 = hashArtifact(payload2);
    expect(hash1).not.toBe(hash2);
  });

  test('handles nested objects with key order changes', () => {
    const payload1 = { outer: { inner: { a: 1, b: 2 } } };
    const payload2 = { outer: { inner: { b: 2, a: 1 } } };
    const hash1 = hashArtifact(payload1);
    const hash2 = hashArtifact(payload2);
    expect(hash1).toBe(hash2);
  });

  test('handles arrays', () => {
    const payload1 = { items: [1, 2, 3] };
    const payload2 = { items: [1, 2, 3] };
    const hash1 = hashArtifact(payload1);
    const hash2 = hashArtifact(payload2);
    expect(hash1).toBe(hash2);
  });

  test('handles null and undefined', () => {
    const payload1 = { a: null, b: undefined };
    const payload2 = { b: undefined, a: null };
    const hash1 = hashArtifact(payload1);
    const hash2 = hashArtifact(payload2);
    expect(hash1).toBe(hash2);
  });

  test('hashString produces deterministic hashes', () => {
    const input = 'test string';
    const hash1 = hashString(input);
    const hash2 = hashString(input);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  test('hashString produces different hashes for different inputs', () => {
    const hash1 = hashString('input1');
    const hash2 = hashString('input2');
    expect(hash1).not.toBe(hash2);
  });
});








































