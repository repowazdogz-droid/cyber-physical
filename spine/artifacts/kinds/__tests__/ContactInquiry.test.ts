/**
 * Contact Inquiry Tests
 * 
 * Tests for contact inquiry normalization and bounds.
 */

import { normalizeContactInquiry } from '../ContactInquiry';

describe('normalizeContactInquiry', () => {
  it('should normalize valid payload', () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      org: 'Acme Corp',
      message: 'Hello, I am interested in your services.',
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(true);
    expect(result.normalized).toBeDefined();
    expect(result.normalized?.name).toBe('John Doe');
    expect(result.normalized?.email).toBe('john@example.com');
    expect(result.normalized?.message).toBe('Hello, I am interested in your services.');
    expect(result.normalized?.consentToStore).toBe(true);
  });

  it('should require message', () => {
    const payload = {
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('message is required');
  });

  it('should require consentToStore', () => {
    const payload = {
      message: 'Hello'
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('consentToStore is required');
  });

  it('should bound name to 80 characters', () => {
    const payload = {
      name: 'a'.repeat(100),
      message: 'Hello',
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('name truncated'))).toBe(true);
    expect(result.normalized?.name?.length).toBe(80);
  });

  it('should bound email to 120 characters', () => {
    const payload = {
      email: 'a'.repeat(150) + '@example.com',
      message: 'Hello',
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('email truncated'))).toBe(true);
    expect(result.normalized?.email?.length).toBe(120);
  });

  it('should bound message to 1200 characters', () => {
    const payload = {
      message: 'a'.repeat(1500),
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('message truncated'))).toBe(true);
    expect(result.normalized?.message?.length).toBe(1200);
  });

  it('should bound domain tags to 8', () => {
    const payload = {
      domainTags: Array(15).fill('tag'),
      message: 'Hello',
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('domainTags limited'))).toBe(true);
    expect(result.normalized?.domainTags?.length).toBe(8);
  });

  it('should bound domain tag length to 30', () => {
    const payload = {
      domainTags: ['a'.repeat(50)],
      message: 'Hello',
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(true);
    expect(result.normalized?.domainTags?.[0]?.length).toBe(30);
  });

  it('should trim whitespace', () => {
    const payload = {
      name: '  John Doe  ',
      email: '  john@example.com  ',
      message: '  Hello  ',
      consentToStore: true
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(true);
    expect(result.normalized?.name).toBe('John Doe');
    expect(result.normalized?.email).toBe('john@example.com');
    expect(result.normalized?.message).toBe('Hello');
  });

  it('should validate preferredFollowup enum', () => {
    const payload = {
      message: 'Hello',
      consentToStore: true,
      preferredFollowup: 'invalid'
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('preferredFollowup'))).toBe(true);
  });

  it('should accept valid preferredFollowup values', () => {
    for (const followup of ['email', 'call', 'none'] as const) {
      const payload = {
        message: 'Hello',
        consentToStore: true,
        preferredFollowup: followup
      };

      const result = normalizeContactInquiry(payload);

      expect(result.ok).toBe(true);
      expect(result.normalized?.preferredFollowup).toBe(followup);
    }
  });

  it('should bound errors to 10', () => {
    const payload = {
      name: 123,
      email: 456,
      org: 789,
      domainTags: 'not an array',
      message: null,
      preferredFollowup: 'invalid',
      consentToStore: 'not boolean'
    };

    const result = normalizeContactInquiry(payload);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeLessThanOrEqual(10);
  });
});







































