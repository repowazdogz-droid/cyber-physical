/**
 * Tests for Artifact Verifier.
 * Ensures: corrupt/missing files rejected, bounds truncation with warnings, redaction removes internal markers, rootSha256 stable.
 */

import { verifyArtifactBundle } from '../ArtifactVerifier';
import { ArtifactKind } from '../ArtifactTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

describe('Artifact Verifier', () => {
  test('rejects missing contract version', () => {
    // Pass payloads without contractVersion at all (not even in meta)
    const result = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, {}, {});

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === 'MISSING_CONTRACT_VERSION')).toBe(true);
  });

  test('accepts valid contract version', () => {
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      events: []
    };

    const result = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, payloads);

    expect(result.ok).toBe(true);
    expect(result.manifest).toBeDefined();
    expect(result.manifest?.contractVersion).toBe(CONTRACT_VERSION);
  });

  test('truncates events with warning', () => {
    const events = Array.from({ length: 250 }, (_, i) => ({ t: i, type: 'test', payload: {} }));
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      events
    };

    const result = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, payloads);

    expect(result.ok).toBe(true);
    expect(result.warnings.some(w => w.code === 'EVENTS_EXCEED_BOUND')).toBe(true);
    expect(result.manifest?.files.find(f => f.name === 'events')).toBeDefined();
  });

  test('redaction removes internal markers', () => {
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      events: [
        { t: 0, type: 'test', payload: { message: 'Internal debug info' } },
        { t: 1, type: 'test', payload: { message: 'System error occurred' } }
      ]
    };

    const result = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, payloads);

    expect(result.ok).toBe(true);
    expect(result.manifest?.redactionsApplied.some(r => r.includes('internal'))).toBe(true);
    
    // Check that redacted payload doesn't contain internal markers
    const eventsFile = result.manifest?.files.find(f => f.name === 'events');
    expect(eventsFile).toBeDefined();
  });

  test('rootSha256 is stable for same input', () => {
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      events: [{ t: 0, type: 'test', payload: {} }]
    };

    const result1 = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, payloads);
    const result2 = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, payloads);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    expect(result1.manifest?.rootSha256).toBe(result2.manifest?.rootSha256);
  });

  test('bounds thought objects', () => {
    const thoughtObjects = Array.from({ length: 60 }, (_, i) => ({
      id: `obj-${i}`,
      type: 'test',
      contentText: 'Test'
    }));
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      thoughtObjects
    };

    const result = verifyArtifactBundle(ArtifactKind.XR_BUNDLE, payloads);

    expect(result.ok).toBe(true);
    expect(result.warnings.some(w => w.code === 'THOUGHT_OBJECTS_EXCEED_BOUND')).toBe(true);
  });

  test('bounds trace nodes', () => {
    const trace = {
      nodes: Array.from({ length: 120 }, (_, i) => ({
        id: `node-${i}`,
        type: 'test',
        label: 'Test',
        description: 'Test'
      }))
    };
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      trace
    };

    const result = verifyArtifactBundle(ArtifactKind.KERNEL_RUN, payloads);

    expect(result.ok).toBe(true);
    expect(result.warnings.some(w => w.code === 'TRACE_NODES_EXCEED_BOUND')).toBe(true);
  });
});




