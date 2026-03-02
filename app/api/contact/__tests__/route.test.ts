/**
 * Contact API Tests
 * 
 * Tests for contact form submission API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ArtifactKind } from 'spine/artifacts/ArtifactTypes';

// Hoist the mock function using vi.hoisted() to ensure it's available before module imports
const { mockPutArtifact } = vi.hoisted(() => {
  const mockPutArtifact = vi.fn().mockResolvedValue({
    artifactId: 'test-artifact-id',
    manifest: {} as any,
    errors: [],
    warnings: []
  });
  return { mockPutArtifact };
});

// Mock the artifact vault - use @spine/* alias to match route import
vi.mock('@spine/artifacts/ArtifactVault', () => ({
  putArtifact: (...args: any[]) => mockPutArtifact(...args)
}));

// IMPORTANT: import the route AFTER the mock
import { POST } from '../route';

describe('POST /api/contact', () => {
  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });
    return request;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPutArtifact.mockClear();
    mockPutArtifact.mockResolvedValue({
      artifactId: 'test-artifact-id',
      manifest: {} as any,
      errors: [],
      warnings: []
    });
  });

  it('should reject honeypot filled', async () => {
    const request = createRequest({
      hp: 'spam',
      message: 'Hello',
      consentToStore: true
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe('Invalid request.');
  });

  it('should reject missing consent', async () => {
    const request = createRequest({
      message: 'Hello',
      consentToStore: false
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe('Consent required.');
  });

  it('should accept valid submission', async () => {
    mockPutArtifact.mockClear();

    const request = createRequest({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello',
      consentToStore: true
    }, {
      'x-forwarded-for': '127.0.0.1' // Use consistent IP to avoid rate limit issues
    });

    const response = await POST(request);
    
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.artifactId).toBeDefined();

    // Check that putArtifact was called
    expect(mockPutArtifact).toHaveBeenCalled();
    const call = mockPutArtifact.mock.calls.find((c: any[]) => 
      c[0] === ArtifactKind.CONTACT_INQUIRY && 
      c[1]?.inquiry?.name === 'John Doe'
    );
    expect(call).toBeDefined();
    expect(call[1].meta.contractVersion).toBe('1.0.0');
    expect(call[1].inquiry.email).toBe('john@example.com');
  });

  it('should return 429 on rate limit', async () => {
    // Make 5 requests to hit rate limit
    for (let i = 0; i < 5; i++) {
      const request = createRequest({
        message: 'Hello',
        consentToStore: true
      });
      await POST(request);
    }

    // 6th request should be rate limited
    const request = createRequest({
      message: 'Hello',
      consentToStore: true
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.ok).toBe(false);
    expect(data.message).toContain('Too many requests');
  });

  it('should normalize and validate payload', async () => {
    mockPutArtifact.mockClear();

    const request = createRequest({
      name: '  John Doe  ',
      email: '  john@example.com  ',
      message: '  Hello  ',
      consentToStore: true
    }, {
      'x-forwarded-for': '127.0.0.2' // Use different IP to avoid rate limit
    });

    const response = await POST(request);
    
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);

    // Find the call for this specific test (by normalized name)
    const call = mockPutArtifact.mock.calls.find((c: any[]) => 
      c[1]?.inquiry?.name === 'John Doe'
    );
    expect(call).toBeDefined();
    const inquiry = call[1].inquiry;

    expect(inquiry.name).toBe('John Doe');
    expect(inquiry.email).toBe('john@example.com');
    expect(inquiry.message).toBe('Hello');
  });
});
