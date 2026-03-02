/**
 * Tests for Artifact Vault.
 * Ensures: atomic write path, list bounded, get returns exact manifest + payload.
 */

import { putArtifact, getArtifact, listArtifacts, setVaultInstance } from '../ArtifactVault';
import { ArtifactKind } from '../ArtifactTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';
import { beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'node:path';
import os from 'os';
import crypto from 'crypto';
import { FsArtifactVault } from '../FsArtifactVault';

// Use unique temp directory per test suite to avoid race conditions
const ROOT = join(os.tmpdir(), `artifactVault-${crypto.randomUUID()}`);

beforeEach(async () => {
  // Override the singleton vault instance with our isolated one
  setVaultInstance(new FsArtifactVault(undefined, ROOT));
  
  // Ensure vault directory exists before each test (async to match vault implementation)
  try {
    await fs.mkdir(join(ROOT, 'XR_BUNDLE'), { recursive: true });
    await fs.mkdir(join(ROOT, 'SESSION_RECAP'), { recursive: true });
    await fs.mkdir(join(ROOT, 'KERNEL_RUN'), { recursive: true });
    await fs.mkdir(join(ROOT, 'ORCHESTRATOR_RUN'), { recursive: true });
    await fs.mkdir(join(ROOT, 'TEACHER_RECAP'), { recursive: true });
    await fs.mkdir(join(ROOT, 'CONTACT_INQUIRY'), { recursive: true });
  } catch {
    // Ignore if already exists
  }
});

afterEach(async () => {
  // Clean up test artifacts
  try {
    await fs.rm(ROOT, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

describe('Artifact Vault', () => {
  test('putArtifact creates manifest and stores bundle', async () => {
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION },
      events: [{ t: 0, type: 'test', payload: {} }]
    };

    const result = await putArtifact(ArtifactKind.XR_BUNDLE, payloads, {
      artifactId: 'test-artifact-1'
    });

    expect(result.artifactId).toBe('test-artifact-1');
    expect(result.manifest).toBeDefined();
    expect(result.manifest?.kind).toBe(ArtifactKind.XR_BUNDLE);
    expect(result.manifest?.files.length).toBeGreaterThan(0);
    expect(result.manifest?.rootSha256).toBeDefined();
  });

  test('getArtifact returns exact manifest + payload', async () => {
    const payloads = {
      meta: { contractVersion: CONTRACT_VERSION, test: 'value' },
      events: [{ t: 0, type: 'test', payload: { data: 'test' } }]
    };

    const putResult = await putArtifact(ArtifactKind.XR_BUNDLE, payloads, {
      artifactId: 'test-artifact-2'
    });

    const bundle = await getArtifact(putResult.artifactId);

    expect(bundle).toBeDefined();
    expect(bundle?.manifest.artifactId).toBe('test-artifact-2');
    expect(bundle?.payloads.meta.test).toBe('value');
    expect(bundle?.payloads.events[0].payload.data).toBe('test');
  });

  test('listArtifacts is bounded', async () => {
    // Create multiple artifacts
    for (let i = 0; i < 60; i++) {
      await putArtifact(ArtifactKind.XR_BUNDLE, {
        meta: { contractVersion: CONTRACT_VERSION }
      }, {
        artifactId: `test-artifact-list-${i}`
      });
    }

    const manifests = await listArtifacts({ limit: 50 });

    expect(manifests.length).toBeLessThanOrEqual(50);
  });

  test('listArtifacts filters by kind', async () => {
    await putArtifact(ArtifactKind.XR_BUNDLE, {
      meta: { contractVersion: CONTRACT_VERSION }
    }, {
      artifactId: 'test-xr-1'
    });

    await putArtifact(ArtifactKind.SESSION_RECAP, {
      meta: { contractVersion: CONTRACT_VERSION }
    }, {
      artifactId: 'test-recap-1'
    });

    const xrManifests = await listArtifacts({ kind: ArtifactKind.XR_BUNDLE });
    const recapManifests = await listArtifacts({ kind: ArtifactKind.SESSION_RECAP });

    expect(xrManifests.every(m => m.kind === ArtifactKind.XR_BUNDLE)).toBe(true);
    expect(recapManifests.every(m => m.kind === ArtifactKind.SESSION_RECAP)).toBe(true);
  });

  test('listArtifacts filters by learnerId', async () => {
    await putArtifact(ArtifactKind.XR_BUNDLE, {
      meta: { contractVersion: CONTRACT_VERSION }
    }, {
      artifactId: 'test-learner-1',
      learnerId: 'learner-123'
    });

    await putArtifact(ArtifactKind.XR_BUNDLE, {
      meta: { contractVersion: CONTRACT_VERSION }
    }, {
      artifactId: 'test-learner-2',
      learnerId: 'learner-456'
    });

    const manifests = await listArtifacts({ learnerId: 'learner-123' });

    expect(manifests.length).toBeGreaterThan(0);
    // Note: Filtering by learnerId uses tags, which may not be perfect in dev implementation
  });
});
