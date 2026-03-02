/**
 * Omega Lens Router Tests
 * 
 * Tests prompt assembly with Omega lenses.
 * Does not test OpenAI/Gemini APIs, only prompt construction.
 */

import { describe, it, expect } from 'vitest';
import { OMEGA_LENSES } from '../OmegaLenses';
import type { OmegaMode } from '../OmegaModes';

/**
 * Applies Omega lens to user prompt (same logic as LLMRouter).
 */
function applyOmegaLens(userPrompt: string, omega?: { mode: OmegaMode }): string {
  if (!omega) return userPrompt;

  const lens = OMEGA_LENSES[omega.mode];

  const contract = [
    "OUTPUT CONTRACT:",
    `Use ONLY these section headers (in this order when applicable): ${lens.allowedSections.join(" | ")}`,
    `DO NOT: ${lens.forbiddenBehaviors.join(" | ")}`,
  ].join("\n");

  return [
    lens.systemPreamble,
    contract,
    "",
    userPrompt,
  ].join("\n");
}

describe('Omega Lens Router', () => {
  it('should leave prompt unchanged when no omega mode provided', () => {
    const prompt = "Explain this kernel run.";
    const result = applyOmegaLens(prompt);
    expect(result).toBe(prompt);
  });

  it('should apply v37 lens with preamble and contract', () => {
    const prompt = "Explain this kernel run.";
    const result = applyOmegaLens(prompt, { mode: 'v37' });
    
    const lens = OMEGA_LENSES.v37;
    
    // Should contain preamble
    expect(result).toContain(lens.systemPreamble);
    
    // Should contain OUTPUT CONTRACT
    expect(result).toContain("OUTPUT CONTRACT:");
    
    // Should contain allowed sections
    expect(result).toContain(lens.allowedSections[0]);
    
    // Should contain forbidden behaviors
    expect(result).toContain(lens.forbiddenBehaviors[0]);
    
    // Should contain original prompt at end
    expect(result).toContain(prompt);
  });

  it('should apply V lens correctly', () => {
    const prompt = "Generate creative variations.";
    const result = applyOmegaLens(prompt, { mode: 'V' });
    
    const lens = OMEGA_LENSES.V;
    expect(result).toContain(lens.systemPreamble);
    expect(result).toContain("OUTPUT CONTRACT:");
    expect(result).toContain(prompt);
  });

  it('should apply B lens correctly', () => {
    const prompt = "Break down this task.";
    const result = applyOmegaLens(prompt, { mode: 'B' });
    
    const lens = OMEGA_LENSES.B;
    expect(result).toContain(lens.systemPreamble);
    expect(result).toContain("OUTPUT CONTRACT:");
    expect(result).toContain(prompt);
  });

  it('should apply R lens correctly', () => {
    const prompt = "Reflect on this session.";
    const result = applyOmegaLens(prompt, { mode: 'R' });
    
    const lens = OMEGA_LENSES.R;
    expect(result).toContain(lens.systemPreamble);
    expect(result).toContain("OUTPUT CONTRACT:");
    expect(result).toContain(prompt);
  });

  it('should apply G lens correctly', () => {
    const prompt = "Should I do this?";
    const result = applyOmegaLens(prompt, { mode: 'G' });
    
    const lens = OMEGA_LENSES.G;
    expect(result).toContain(lens.systemPreamble);
    expect(result).toContain("OUTPUT CONTRACT:");
    expect(result).toContain(prompt);
  });

  it('should preserve original prompt structure', () => {
    const prompt = "Line 1\nLine 2\nLine 3";
    const result = applyOmegaLens(prompt, { mode: 'v37' });
    
    // Original prompt should appear at the end
    const promptIndex = result.indexOf(prompt);
    expect(promptIndex).toBeGreaterThan(0);
    
    // Everything before prompt should be lens content
    const beforePrompt = result.substring(0, promptIndex);
    expect(beforePrompt).toContain(OMEGA_LENSES.v37.systemPreamble);
  });
});




































