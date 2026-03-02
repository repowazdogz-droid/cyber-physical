/**
 * Block 2 Tests: Omega RC Input→Output Path
 * 
 * Tests cover:
 * 1) Headline only
 * 2) Short paragraph (~800 chars)
 * 3) URL pasted → friendly message + no API call
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the LLM router
jest.mock('../../../../../spine/llm/LLMRouter', () => ({
  generateText: jest.fn(),
}));

const { generateText } = require('../../../../../spine/llm/LLMRouter');

describe('Omega RC Scaffold API - Block 2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Headline only
  it('should handle headline-only input', async () => {
    const headline = 'AI will replace half of all jobs in 5 years';
    
    generateText.mockResolvedValue({
      ok: true,
      text: JSON.stringify({
        summary: 'This claim predicts significant job displacement due to AI.',
        assumptions: ['AI adoption will be rapid', 'Job replacement is measurable'],
        evidence: ['No specific evidence provided'],
        constraints: ['Timeframe is 5 years', 'Scope is "half of all jobs"'],
        tradeoffs: ['Could be interpreted as net job creation vs replacement'],
      }),
      omegaMeta: {},
    });

    const request = new NextRequest('http://localhost/api/explain/scaffold', {
      method: 'POST',
      body: JSON.stringify({ sourceContent: headline }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.scaffold).toBeDefined();
    expect(data.scaffold.summary).toBeTruthy();
    expect(Array.isArray(data.scaffold.assumptions)).toBe(true);
    expect(Array.isArray(data.scaffold.evidence)).toBe(true);
    expect(Array.isArray(data.scaffold.constraints)).toBe(true);
    expect(Array.isArray(data.scaffold.tradeoffs)).toBe(true);
  });

  // Test 2: Short paragraph (~800 chars)
  it('should handle short paragraph input (~800 chars)', async () => {
    const paragraph = 'Recent studies suggest that artificial intelligence systems are becoming increasingly capable of performing tasks traditionally reserved for humans. While some experts predict widespread job displacement, others argue that AI will create new categories of employment. The debate centers on whether the pace of technological change will outstrip society\'s ability to adapt. Historical precedents show that previous technological revolutions ultimately led to net job creation, but the speed and scope of AI development may represent an unprecedented challenge. Policymakers are grappling with how to prepare workers for this transition, with proposals ranging from universal basic income to massive retraining programs. The outcome remains uncertain, but the conversation is urgent.';
    
    generateText.mockResolvedValue({
      ok: true,
      text: JSON.stringify({
        summary: 'This discusses the debate around AI and job displacement.',
        assumptions: ['AI development is accelerating', 'Historical patterns may not apply'],
        evidence: ['Mentions "recent studies"', 'References historical precedents'],
        constraints: ['Uncertainty about pace and scope', 'Policy responses are proposals'],
        tradeoffs: ['Job displacement vs creation', 'Speed of change vs adaptation'],
      }),
      omegaMeta: {},
    });

    const request = new NextRequest('http://localhost/api/explain/scaffold', {
      method: 'POST',
      body: JSON.stringify({ sourceContent: paragraph }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.scaffold).toBeDefined();
    expect(data.scaffold.summary).toBeTruthy();
  });

  // Test 3: URL pasted → friendly message + no API call
  it('should reject URLs and return fallback scaffold without calling LLM', async () => {
    const url = 'https://example.com/article';
    
    const request = new NextRequest('http://localhost/api/explain/scaffold', {
      method: 'POST',
      body: JSON.stringify({ sourceContent: url }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return 200 with fallback scaffold
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fallback).toBe(true);
    expect(data.validationError).toBe('url_not_supported');
    expect(data.scaffold).toBeDefined();
    
    // LLM should NOT be called
    expect(generateText).not.toHaveBeenCalled();
  });

  // Additional test: Content exceeding 2000 chars
  it('should handle content exceeding 2000 chars with fallback', async () => {
    const longText = 'A'.repeat(2500);
    
    const request = new NextRequest('http://localhost/api/explain/scaffold', {
      method: 'POST',
      body: JSON.stringify({ sourceContent: longText }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fallback).toBe(true);
    expect(data.validationError).toBe('too_long');
    expect(data.scaffold).toBeDefined();
  });

  // Additional test: Empty input
  it('should reject empty input', async () => {
    const request = new NextRequest('http://localhost/api/explain/scaffold', {
      method: 'POST',
      body: JSON.stringify({ sourceContent: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toBe('empty_input');
  });

  // Additional test: LLM failure should still return scaffold
  it('should return fallback scaffold when LLM fails', async () => {
    generateText.mockResolvedValue({
      ok: false,
      error: 'LLM service unavailable',
    });

    const request = new NextRequest('http://localhost/api/explain/scaffold', {
      method: 'POST',
      body: JSON.stringify({ sourceContent: 'Test claim' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fallback).toBe(true);
    expect(data.scaffold).toBeDefined();
  });
});




























