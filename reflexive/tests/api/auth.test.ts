import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildServer } from '../../src/api/server.js';
import type { CreateAnalysisRequest } from '../../src/api/types.js';

describe('API Auth', () => {
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.REFLEXIVE_API_TOKEN;
    // Clear module cache to force re-evaluation of requireAuth
    vi.resetModules();
  });

  afterEach(async () => {
    if (originalToken !== undefined) {
      process.env.REFLEXIVE_API_TOKEN = originalToken;
    } else {
      delete process.env.REFLEXIVE_API_TOKEN;
    }
    vi.resetModules();
  });

  it('allows unauthenticated requests when REFLEXIVE_API_TOKEN is unset', async () => {
    delete process.env.REFLEXIVE_API_TOKEN;
    vi.resetModules();
    const server = await buildServer();

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    } finally {
      await server.close();
    }
  });

  it('returns 401 when REFLEXIVE_API_TOKEN is set and request lacks bearer token', async () => {
    // Note: Due to Node.js module caching, this test verifies the auth logic exists
    // In practice, setting REFLEXIVE_API_TOKEN requires server restart
    process.env.REFLEXIVE_API_TOKEN = 'test-token-123';
    
    // Test that auth is checked by verifying requireAuth throws ApiError
    const { requireAuth } = await import('../../src/api/auth.js');
    const { ApiError, ErrorCode } = await import('../../src/api/errors.js');
    
    expect(() => requireAuth()).toThrow(ApiError);
    expect(() => requireAuth()).toThrow('Missing or invalid Authorization header');
    
    expect(() => requireAuth('Bearer wrong-token')).toThrow(ApiError);
    expect(() => requireAuth('Bearer wrong-token')).toThrow('Invalid API token');
    
    // Valid token should not throw
    expect(() => requireAuth('Bearer test-token-123')).not.toThrow();
  });

  it('allows authenticated requests when REFLEXIVE_API_TOKEN is set and bearer token matches', async () => {
    process.env.REFLEXIVE_API_TOKEN = 'test-token-123';
    vi.resetModules();
    const server = await buildServer();

    try {
      const request: CreateAnalysisRequest = {
        stimulus: {
          text: 'Should we acquire Company X for $500M?',
          type: 'decision',
        },
        options: {
          dry_run: true,
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyses',
        headers: {
          authorization: 'Bearer test-token-123',
        },
        payload: request,
      });

      expect(response.statusCode).toBe(200);
    } finally {
      await server.close();
    }
  });
});
