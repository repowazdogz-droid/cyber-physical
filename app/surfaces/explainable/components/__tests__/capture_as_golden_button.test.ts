/**
 * Tests for CaptureAsGoldenButton helper functions.
 * Tests: label bounding, request payload building.
 */

import { buildGoldenCapturePayload } from '../CaptureAsGoldenButton';

describe('CaptureAsGoldenButton helpers', () => {
  test('buildGoldenCapturePayload bounds label to 60 chars', () => {
    const longLabel = 'A'.repeat(100); // 100 chars, max is 60
    const payload = buildGoldenCapturePayload('test-artifact-id', longLabel, false);

    expect(payload).not.toBeNull();
    expect(payload?.label).toBeDefined();
    expect(payload?.label!.length).toBeLessThanOrEqual(60);
    expect(payload?.label).toContain('...');
  });

  test('buildGoldenCapturePayload preserves label under 60 chars', () => {
    const shortLabel = 'Short Label';
    const payload = buildGoldenCapturePayload('test-artifact-id', shortLabel, false);

    expect(payload).not.toBeNull();
    expect(payload?.label).toBe(shortLabel);
  });

  test('buildGoldenCapturePayload returns null for null artifactId', () => {
    const payload = buildGoldenCapturePayload(null, 'Test Label', false);

    expect(payload).toBeNull();
  });

  test('buildGoldenCapturePayload includes runSuite when provided', () => {
    const payload = buildGoldenCapturePayload('test-artifact-id', 'Test Label', true);

    expect(payload).not.toBeNull();
    expect(payload?.runSuite).toBe(true);
  });

  test('buildGoldenCapturePayload omits runSuite when false', () => {
    const payload = buildGoldenCapturePayload('test-artifact-id', 'Test Label', false);

    expect(payload).not.toBeNull();
    expect(payload?.runSuite).toBe(false);
  });

  test('buildGoldenCapturePayload handles exact 60 char label', () => {
    const exactLabel = 'A'.repeat(60);
    const payload = buildGoldenCapturePayload('test-artifact-id', exactLabel, false);

    expect(payload).not.toBeNull();
    expect(payload?.label).toBe(exactLabel);
    expect(payload?.label!.length).toBe(60);
  });

  test('buildGoldenCapturePayload handles 61 char label (truncates)', () => {
    const longLabel = 'A'.repeat(61);
    const payload = buildGoldenCapturePayload('test-artifact-id', longLabel, false);

    expect(payload).not.toBeNull();
    expect(payload?.label).toBeDefined();
    expect(payload?.label!.length).toBe(60); // 57 + '...'
    expect(payload?.label).toContain('...');
  });
});








































