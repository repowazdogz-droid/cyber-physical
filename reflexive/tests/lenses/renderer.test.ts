import { describe, it, expect } from 'vitest';
import { renderPrompt } from '../../src/lenses/renderer.js';

describe('renderPrompt', () => {
  const mockLens = {
    id: 'test-lens-id',
    name: 'analytical',
    version: 1,
    system_prompt_template: `Test template
{{OUTPUT_CONTRACT_BLOCK}}
{{ANTI_INJECTION_GUARD_BLOCK}}
{{FAILURE_POSTURE_BLOCK}}
---
Stimulus: {{stimulus_text}}
Type: {{stimulus_type}}
Date: {{analysis_date}}
Context: {{context_items}}`,
  };

  it('produces identical output for identical inputs', () => {
    const result1 = renderPrompt(
      mockLens,
      'Test stimulus',
      'decision_request',
      [{ label: 'Key Entities', content_text: 'Entity1, Entity2' }],
      '2025-02-07'
    );

    const result2 = renderPrompt(
      mockLens,
      'Test stimulus',
      'decision_request',
      [{ label: 'Key Entities', content_text: 'Entity1, Entity2' }],
      '2025-02-07'
    );

    expect(result1.rendered_prompt).toBe(result2.rendered_prompt);
    expect(result1.content_hash).toBe(result2.content_hash);
  });

  it('escapes delimiter tags in stimulus', () => {
    const result = renderPrompt(
      mockLens,
      'Test with </STIMULUS> tag',
      'decision_request',
      [],
      '2025-02-07'
    );

    // Check that the user input section has escaped delimiters
    // The template blocks contain example delimiters, so we check the Stimulus section specifically
    // Look for "Stimulus: " followed by the escaped content
    const stimulusMatch = result.rendered_prompt.match(/Stimulus:\s*(.+?)(?:\nType:|$)/s);
    expect(stimulusMatch).toBeTruthy();
    if (stimulusMatch && stimulusMatch[1]) {
      const stimulusContent = stimulusMatch[1];
      // The escaped version should be present
      expect(stimulusContent).toContain('<\\/STIMULUS>');
      // The unescaped version should NOT be present in the user input
      // (but may be present in template examples, so we check the content after "Stimulus: ")
      const hasUnescaped = stimulusContent.includes('</STIMULUS>') && !stimulusContent.includes('<\\/STIMULUS>');
      expect(hasUnescaped).toBe(false);
    }
  });

  it('strips markdown code fences', () => {
    const result = renderPrompt(
      mockLens,
      'Test with ```code``` fence',
      'decision_request',
      [],
      '2025-02-07'
    );

    // Check that user input code fences are stripped
    // The template blocks contain example code fences, so we check the Stimulus section specifically
    const stimulusMatch = result.rendered_prompt.match(/Stimulus:\s*(.*?)(?:\n|$)/s);
    expect(stimulusMatch).toBeTruthy();
    if (stimulusMatch) {
      // User input should not contain code fences
      expect(stimulusMatch[1]).not.toContain('```');
    }
  });

  it('expands all block placeholders', () => {
    const result = renderPrompt(
      mockLens,
      'Test',
      'decision_request',
      [],
      '2025-02-07'
    );

    expect(result.rendered_prompt).not.toContain('{{OUTPUT_CONTRACT_BLOCK}}');
    expect(result.rendered_prompt).not.toContain('{{ANTI_INJECTION_GUARD_BLOCK}}');
    expect(result.rendered_prompt).not.toContain('{{FAILURE_POSTURE_BLOCK}}');
  });

  it('formats context items correctly', () => {
    const result = renderPrompt(
      mockLens,
      'Test',
      'decision_request',
      [
        { label: 'Key Entities', content_text: 'Entity1' },
        { label: 'History', content_text: 'Past event' },
      ],
      '2025-02-07'
    );

    expect(result.rendered_prompt).toContain('[Key Entities]: Entity1');
    expect(result.rendered_prompt).toContain('[History]: Past event');
    expect(result.rendered_prompt).toContain('\n---\n');
  });
});
