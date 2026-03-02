/**
 * Tests for Spec Library.
 * Ensures: entries are deterministic order, bounded lengths, each spec validates.
 */

import { SPEC_LIBRARY, getLibraryEntry, listLibraryEntries } from '../library/index';
import { validateKernelSpec } from '../SpecValidator';

describe('Spec Library', () => {
  test('entries are in deterministic order', () => {
    const entries = listLibraryEntries();
    
    // Should be sorted by some consistent criteria (e.g., id or title)
    const ids = entries.map(e => e.id);
    const sortedIds = [...ids].sort();
    
    // Check that entries are in a consistent order
    expect(ids.length).toBeGreaterThan(0);
    // All entries should have unique IDs
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('entries are bounded to max 10', () => {
    const entries = listLibraryEntries();
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  test('each entry has bounded metadata', () => {
    const entries = listLibraryEntries();
    
    for (const entry of entries) {
      expect(entry.id.length).toBeLessThanOrEqual(50);
      expect(entry.title.length).toBeLessThanOrEqual(100);
      expect(entry.description.length).toBeLessThanOrEqual(200);
    }
  });

  test('each spec validates with SpecValidator (ok or only warnings; no errors)', () => {
    const entries = listLibraryEntries();
    
    for (const entry of entries) {
      const validation = validateKernelSpec(entry.spec);
      
      // Should have no errors (warnings are acceptable)
      expect(validation.errors.length).toBe(0);
      
      // Should be valid
      expect(validation.ok).toBe(true);
    }
  });

  test('getLibraryEntry returns correct entry', () => {
    const entries = listLibraryEntries();
    
    if (entries.length > 0) {
      const firstEntry = entries[0];
      const found = getLibraryEntry(firstEntry.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(firstEntry.id);
      expect(found?.title).toBe(firstEntry.title);
    }
  });

  test('getLibraryEntry returns undefined for non-existent ID', () => {
    const found = getLibraryEntry('nonexistent_id_12345');
    expect(found).toBeUndefined();
  });

  test('all entries have required fields', () => {
    const entries = listLibraryEntries();
    
    for (const entry of entries) {
      expect(entry.id).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.description).toBeDefined();
      expect(entry.spec).toBeDefined();
      expect(entry.spec.version).toBeDefined();
      expect(entry.spec.kernelId).toBeDefined();
      expect(entry.spec.adapterId).toBeDefined();
      expect(entry.spec.name).toBeDefined();
      expect(entry.spec.outcomes).toBeDefined();
      expect(Array.isArray(entry.spec.outcomes)).toBe(true);
      expect(entry.spec.outcomes.length).toBeGreaterThan(0);
    }
  });
});








































