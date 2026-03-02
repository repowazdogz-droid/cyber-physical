/**
 * Tests for Share Token Store.
 * Ensures: TTL expiry, revoke, bounded list (50), deterministic token format.
 */

import { FileShareTokenStore } from '../ShareTokenStore';
import { ShareScope, MAX_TOKENS_PER_LEARNER, TOKEN_LENGTH } from '../ShareTypes';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const makeTmpDir = () => mkdtempSync(join(tmpdir(), 'omega-share-'));

describe('Share Token Store', () => {
  let store: FileShareTokenStore;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    store = new FileShareTokenStore(tmpDir);
  });

  test('creates token with correct format', async () => {
    const token = await store.createToken(
      ShareScope.TEACHER_RECAP,
      'learner-123',
      'session-456',
      60
    );

    expect(token.token.length).toBe(TOKEN_LENGTH);
    expect(token.scope).toBe(ShareScope.TEACHER_RECAP);
    expect(token.learnerId).toBe('learner-123');
    expect(token.sessionId).toBe('session-456');
    expect(token.tokenId).toBeDefined();
  });

  test('validates valid token', async () => {
    const token = await store.createToken(
      ShareScope.TEACHER_RECAP,
      'learner-123',
      'session-456',
      60
    );

    const validation = await store.validateToken(token.token, ShareScope.TEACHER_RECAP);

    expect(validation.ok).toBe(true);
    expect(validation.allowed).toBe(true);
    expect(validation.learnerId).toBe('learner-123');
    expect(validation.sessionId).toBe('session-456');
  });

  test('rejects expired token', async () => {
    const token = await store.createToken(
      ShareScope.TEACHER_RECAP,
      'learner-123',
      undefined,
      0 // Expire immediately (0 minutes)
    );

    // Wait a bit for expiration
    await new Promise(resolve => setTimeout(resolve, 100));

    const validation = await store.validateToken(token.token, ShareScope.TEACHER_RECAP);

    expect(validation.ok).toBe(false);
    expect(validation.allowed).toBe(false);
    expect(validation.reason).toContain('expired');
  });

  test('rejects revoked token', async () => {
    const token = await store.createToken(
      ShareScope.TEACHER_RECAP,
      'learner-123',
      undefined,
      60
    );

    const revoked = await store.revokeToken(token.token);
    expect(revoked).toBe(true);

    const validation = await store.validateToken(token.token, ShareScope.TEACHER_RECAP);

    expect(validation.ok).toBe(false);
    expect(validation.allowed).toBe(false);
    expect(validation.reason).toContain('revoked');
  });

  test('rejects wrong scope token', async () => {
    const token = await store.createToken(
      ShareScope.TEACHER_RECAP,
      'learner-123',
      undefined,
      60
    );

    const validation = await store.validateToken(token.token, ShareScope.SESSION_RECAP);

    expect(validation.ok).toBe(false);
    expect(validation.allowed).toBe(false);
  });

  test('bounds list to max tokens per learner', async () => {
    // Create more than max tokens
    const tokens = [];
    for (let i = 0; i < MAX_TOKENS_PER_LEARNER + 10; i++) {
      const token = await store.createToken(
        ShareScope.TEACHER_RECAP,
        'learner-123',
        undefined,
        60
      );
      tokens.push(token);
    }

    const list = await store.listTokens('learner-123');

    expect(list.length).toBeLessThanOrEqual(MAX_TOKENS_PER_LEARNER);
  });

  test('token format is deterministic (length)', async () => {
    const token1 = await store.createToken(ShareScope.TEACHER_RECAP, 'learner-1', undefined, 60);
    const token2 = await store.createToken(ShareScope.TEACHER_RECAP, 'learner-2', undefined, 60);

    expect(token1.token.length).toBe(TOKEN_LENGTH);
    expect(token2.token.length).toBe(TOKEN_LENGTH);
  });

  test('listTokens returns only active tokens', async () => {
    const token1 = await store.createToken(ShareScope.TEACHER_RECAP, 'learner-123', undefined, 60);
    const token2 = await store.createToken(ShareScope.TEACHER_RECAP, 'learner-123', undefined, 60);

    await store.revokeToken(token1.token);

    const list = await store.listTokens('learner-123');

    expect(list.length).toBe(1);
    expect(list[0].token).toBe(token2.token);
  });
});




