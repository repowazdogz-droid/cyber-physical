/**
 * Tests for File System Artifact Vault.
 * Ensures: atomic write + read roundtrip.
 */

import { FsArtifactVault } from '../FsArtifactVault';
import { ArtifactKind } from '../ArtifactTypes';
import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';
import crypto from 'crypto';

describe('FsArtifactVault', () => {
  let vault: FsArtifactVault;
  let ROOT: string;

  beforeEach(async () => {
    // Use unique temp directory per test suite to avoid race conditions
    ROOT = join(os.tmpdir(), `artifactVault-${crypto.randomUUID()}`);
    vault = new FsArtifactVault(undefined, ROOT);
    // Clean up test artifacts
    try {
      await fs.rm(ROOT, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
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

  test('stores and retrieves artifact', async () => {
    await vault.put(ArtifactKind.bundle, 'test-id', { data: 'test' });

    const record = await vault.get(ArtifactKind.bundle, 'test-id');

    expect(record).toBeDefined();
    expect(record?.payload.data).toBe('test');
    expect(record?.meta.id).toBe('test-id');
    expect(record?.meta.kind).toBe(ArtifactKind.bundle);
  });

  test('atomic write: no partial files', async () => {
    await vault.put(ArtifactKind.bundle, 'atomic-id', { data: 'atomic' });

    // Should NOT have .tmp file
    const tmpPath = join(ROOT, ArtifactKind.bundle, 'atomic-id.json.tmp');
    try {
      await fs.access(tmpPath);
      throw new Error('Temporary file should not exist');
    } catch (error: any) {
      expect(error.code).toBe('ENOENT');
    }

    // Should have final file
    const finalPath = join(ROOT, ArtifactKind.bundle, 'atomic-id.json');
    await fs.access(finalPath); // Should not throw
  });

  test('returns undefined for non-existent artifact', async () => {
    const record = await vault.get(ArtifactKind.bundle, 'non-existent');
    expect(record).toBeUndefined();
  });

  test('lists artifacts', async () => {
    await vault.put(ArtifactKind.bundle, 'id1', { data: 1 });
    await vault.put(ArtifactKind.bundle, 'id2', { data: 2 });
    await vault.put(ArtifactKind.kernelRun, 'id3', { data: 3 });

    const bundles = await vault.list(ArtifactKind.bundle);
    expect(bundles.length).toBe(2);
    expect(bundles.every(m => m.kind === ArtifactKind.bundle)).toBe(true);
  });

  test('bounds list results to 50', async () => {
    // Create 60 artifacts
    for (let i = 0; i < 60; i++) {
      await vault.put(ArtifactKind.bundle, `id-${i}`, { data: i });
    }

    const results = await vault.list(ArtifactKind.bundle);
    expect(results.length).toBeLessThanOrEqual(50);
  });

  test('filters artifacts by tags', async () => {
    await vault.put(ArtifactKind.bundle, 'tagged-1', { data: 1 }, { tags: ['tag1', 'tag2'] });
    await vault.put(ArtifactKind.bundle, 'tagged-2', { data: 2 }, { tags: ['tag2', 'tag3'] });
    await vault.put(ArtifactKind.bundle, 'untagged', { data: 3 });

    const tagged = await vault.list(ArtifactKind.bundle, { tags: ['tag2'] });
    expect(tagged.length).toBe(2);
    expect(tagged.every(m => m.tags?.includes('tag2'))).toBe(true);
  });

  test('deletes artifact', async () => {
    await vault.put(ArtifactKind.bundle, 'delete-id', { data: 'test' });

    const existed = await vault.exists(ArtifactKind.bundle, 'delete-id');
    expect(existed).toBe(true);

    const deleted = await vault.delete(ArtifactKind.bundle, 'delete-id');
    expect(deleted).toBe(true);

    const existsAfter = await vault.exists(ArtifactKind.bundle, 'delete-id');
    expect(existsAfter).toBe(false);
  });

  test('checks existence', async () => {
    expect(await vault.exists(ArtifactKind.bundle, 'non-existent')).toBe(false);

    await vault.put(ArtifactKind.bundle, 'exists-id', { data: 'test' });

    expect(await vault.exists(ArtifactKind.bundle, 'exists-id')).toBe(true);
  });

  test('enforces payload size limit', async () => {
    const largePayload = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB

    await expect(
      vault.put(ArtifactKind.bundle, 'large-id', largePayload)
    ).rejects.toThrow('exceeds limit');
  });
});
