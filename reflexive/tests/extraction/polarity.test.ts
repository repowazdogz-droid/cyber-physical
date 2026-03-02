import { describe, it, expect } from 'vitest';
import { classifyPolarity } from '../../src/extraction/polarity.js';

describe('classifyPolarity', () => {
  it('classifies "Revenue growth is strong" as positive', () => {
    const result = classifyPolarity('Revenue growth is strong');
    expect(result.polarity).toBe('positive');
    expect(result.matched_terms).toContain('strong');
  });

  it('classifies "The risk is significant" as neutral (no keyword match)', () => {
    const result = classifyPolarity('The risk is significant');
    expect(result.polarity).toBe('neutral');
    expect(result.matched_terms.length).toBe(0);
  });

  it('classifies "The acquisition is not viable" as negative (negation inverts viable)', () => {
    const result = classifyPolarity('The acquisition is not viable');
    expect(result.polarity).toBe('negative');
    expect(result.negation_inversions.length).toBeGreaterThan(0);
  });

  it('classifies "The acquisition is unviable" as negative', () => {
    const result = classifyPolarity('The acquisition is unviable');
    expect(result.polarity).toBe('negative');
    expect(result.matched_terms).toContain('unviable');
  });

  it('classifies "Growth is strong but margins are weak" as neutral (both positive and negative)', () => {
    const result = classifyPolarity('Growth is strong but margins are weak');
    expect(result.polarity).toBe('neutral');
    expect(result.matched_terms).toContain('strong');
    expect(result.matched_terms).toContain('weak');
  });

  it('classifies "The company is stable" as positive', () => {
    const result = classifyPolarity('The company is stable');
    expect(result.polarity).toBe('positive');
    expect(result.matched_terms).toContain('stable');
  });

  it('classifies "The company is not unstable" as positive (double negation)', () => {
    const result = classifyPolarity('The company is not unstable');
    expect(result.polarity).toBe('positive');
    expect(result.negation_inversions.length).toBeGreaterThan(0);
  });

  it('classifies "No significant findings" as neutral (no keyword match)', () => {
    const result = classifyPolarity('No significant findings');
    expect(result.polarity).toBe('neutral');
  });

  it('classifies "The plan is sound and viable" as positive', () => {
    const result = classifyPolarity('The plan is sound and viable');
    expect(result.polarity).toBe('positive');
    expect(result.matched_terms.length).toBeGreaterThanOrEqual(2);
  });

  it('does not match "declining" as "decline" (whole-word matching)', () => {
    const result = classifyPolarity('Declining revenue suggests weakness');
    // "declining" is not in the negative list, only "decline" is
    // Whole-word match means "declining" does NOT match "decline"
    expect(result.polarity).toBe('neutral');
  });
});
