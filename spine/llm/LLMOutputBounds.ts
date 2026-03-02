/**
 * LLM Output Bounds
 * 
 * Utilities for bounding and sanitizing LLM outputs.
 * Ensures deterministic, safe outputs for ND-calm UI.
 * 
 * Version: 1.0.0
 */

/**
 * Bounds a string to max length.
 */
export function boundString(s: string, max: number): string {
  if (typeof s !== 'string') return '';
  if (s.length <= max) return s;
  return s.substring(0, max - 3) + '...';
}

/**
 * Bounds an array of strings.
 */
export function boundStringArray(
  arr: string[],
  maxItems: number,
  maxItemLen: number
): string[] {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .slice(0, maxItems)
    .map(item => {
      if (typeof item !== 'string') return '';
      return boundString(item, maxItemLen);
    })
    .filter(item => item.length > 0);
}

/**
 * Safely parses JSON with error handling.
 */
export function safeJsonParse<T>(text: string): { ok: boolean; data?: T; error?: string } {
  if (typeof text !== 'string') {
    return { ok: false, error: 'Input is not a string' };
  }

  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    // Remove first line (```json or ```)
    lines.shift();
    // Remove last line if it's ```
    if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }

  // Remove common boilerplate (but preserve JSON structure)
  const boilerplatePatterns = [
    /I can't access the repo/gi,
    /I don't have access/gi,
    /I cannot access/gi,
    /as an AI/gi,
    /I'm an AI/gi,
  ];
  
  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Try to extract JSON if text contains "JSON:" or similar markers
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const data = JSON.parse(cleaned.trim()) as T;
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: error.message || 'JSON parse failed' };
  }
}

/**
 * Removes markdown code fences from text.
 */
export function removeMarkdownFences(text: string): string {
  if (typeof text !== 'string') return '';
  
  let cleaned = text.trim();
  
  // Remove opening fence
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline > 0) {
      cleaned = cleaned.substring(firstNewline + 1);
    } else {
      cleaned = cleaned.replace(/^```[a-z]*\s*/, '');
    }
  }
  
  // Remove closing fence
  if (cleaned.endsWith('```')) {
    const lastNewline = cleaned.lastIndexOf('\n');
    if (lastNewline > 0) {
      cleaned = cleaned.substring(0, lastNewline);
    } else {
      cleaned = cleaned.replace(/\s*```$/, '');
    }
  }
  
  return cleaned.trim();
}



