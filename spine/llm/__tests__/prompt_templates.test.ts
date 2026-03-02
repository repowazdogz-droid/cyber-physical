/**
 * Prompt Template Tests
 * 
 * Ensures prompts include safety constraints and bounds.
 */

import {
  draftKernelSpecFromText,
  explainKernelRunBounded,
  explainRegressionDiffBounded,
  generateDiscussionQuestionsBounded
} from '../prompts/GeminiPrompts';

describe('draftKernelSpecFromText', () => {
  it('should include JSON-only instruction', () => {
    const prompt = draftKernelSpecFromText('test');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('no markdown');
  });

  it('should include UNKNOWN outcome instruction', () => {
    const prompt = draftKernelSpecFromText('test');
    expect(prompt).toContain('UNKNOWN');
    expect(prompt).toContain('confidence');
  });

  it('should include bounds information', () => {
    const prompt = draftKernelSpecFromText('test');
    expect(prompt).toContain('200');
    expect(prompt).toContain('500');
    expect(prompt).toContain('20');
  });

  it('should truncate long input', () => {
    const longText = 'a'.repeat(30000);
    const prompt = draftKernelSpecFromText(longText);
    // Should be truncated to 20000
    expect(prompt.length).toBeLessThan(25000);
  });
});

describe('explainKernelRunBounded', () => {
  it('should include bounded output instruction', () => {
    const prompt = explainKernelRunBounded({});
    expect(prompt).toContain('5-8');
    expect(prompt).toContain('900');
  });

  it('should include no speculation instruction', () => {
    const prompt = explainKernelRunBounded({});
    expect(prompt.toLowerCase()).toContain('no speculation');
  });
});

describe('explainRegressionDiffBounded', () => {
  it('should include bounded output instruction', () => {
    const prompt = explainRegressionDiffBounded({});
    expect(prompt).toContain('3-6');
    expect(prompt).toContain('600');
  });

  it('should include no speculation instruction', () => {
    const prompt = explainRegressionDiffBounded({});
    expect(prompt.toLowerCase()).toContain('no speculation');
  });
});

describe('generateDiscussionQuestionsBounded', () => {
  it('should include JSON array instruction', () => {
    const prompt = generateDiscussionQuestionsBounded({});
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('array');
  });

  it('should include character limit', () => {
    const prompt = generateDiscussionQuestionsBounded({});
    expect(prompt).toContain('120');
  });

  it('should include no markdown instruction', () => {
    const prompt = generateDiscussionQuestionsBounded({});
    const p = prompt.toLowerCase();
    // Assert it does not contain "```" or "markdown" in instructions
    expect(p).not.toContain('```');
    // Should contain instruction about no markdown
    expect(p).toContain('no markdown') || expect(p).toContain('markdown');
  });
});



