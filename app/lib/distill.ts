/**
 * Deterministic text distillation for Omega RC.
 * Converts long, noisy text into a compact, high-signal brief
 * before sending to the LLM to avoid token/format/audit failures.
 */

export interface DistillResult {
  distilled: string;
  wasDistilled: boolean;
  originalChars: number;
  distilledChars: number;
}

const BOILERPLATE_KEYWORDS = [
  'cookie',
  'privacy',
  'subscribe',
  'newsletter',
  'sign up',
  'sign-up',
  'sponsored',
  'advert',
  'advertisement',
  'promoted',
  'recommended',
  'follow us',
  'share on',
  'related articles',
  'you may also like',
  'trending now',
  'breaking news',
];

function isBoilerplateLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (lower.length === 0) return false;
  
  // Check for boilerplate keywords
  if (BOILERPLATE_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return true;
  }
  
  // Very short lines that are mostly non-letters
  if (line.length < 30) {
    const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
    if (letterCount / line.length < 0.5) {
      return true;
    }
  }
  
  return false;
}

function looksLikeHeading(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (trimmed.length === 0 || trimmed.length > 150) return false;
  
  // Ends with colon
  if (trimmed.endsWith(':')) return true;
  
  // Title Case (starts with capital, has some capitals but not all caps)
  const words = trimmed.split(/\s+/);
  if (words.length <= 8 && words.length >= 2) {
    const firstWord = words[0];
    if (firstWord.length > 0 && firstWord[0] === firstWord[0].toUpperCase()) {
      const hasLowercase = trimmed.match(/[a-z]/);
      const hasUppercase = trimmed.match(/[A-Z]/);
      if (hasLowercase && hasUppercase) {
        return true;
      }
    }
  }
  
  return false;
}

function hasHighSignalContent(paragraph: string): boolean {
  const lower = paragraph.toLowerCase();
  
  // Contains quotes
  if (paragraph.includes('"') || paragraph.includes("'")) return true;
  
  // Contains numbers or percentages
  if (/\d/.test(paragraph) || paragraph.includes('%')) return true;
  
  // Contains dates (YYYY-MM-DD, MM/DD/YYYY, etc.)
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(paragraph)) return true;
  
  // Contains signal words
  const signalWords = ['study', 'report', 'data', 'according', 'research', 'analysis', 'survey', 'found', 'shows'];
  if (signalWords.some(word => lower.includes(word))) return true;
  
  return false;
}

export function distillForOmega(input: string, maxChars: number = 3500): DistillResult {
  const originalChars = input.length;
  
  // If already short enough, return as-is
  if (originalChars <= maxChars) {
    return {
      distilled: input,
      wasDistilled: false,
      originalChars,
      distilledChars: originalChars,
    };
  }
  
  // Step 1: Normalize whitespace
  let text = input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Step 2: Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  // Step 3: Filter paragraphs
  const keptParagraphs: string[] = [];
  const firstThree = paragraphs.slice(0, 3);
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    
    // Always keep first 3 paragraphs
    if (i < 3) {
      keptParagraphs.push(para);
      continue;
    }
    
    // Skip boilerplate
    if (isBoilerplateLine(para)) {
      continue;
    }
    
    // Keep if it looks like a heading
    if (looksLikeHeading(para)) {
      keptParagraphs.push(para);
      continue;
    }
    
    // Keep if it has high-signal content
    if (hasHighSignalContent(para)) {
      keptParagraphs.push(para);
      continue;
    }
    
    // Skip low-signal paragraphs
  }
  
  // Step 4: Join kept paragraphs until maxChars reached
  let distilled = keptParagraphs.join('\n\n');
  
  // Step 5: If still too long, hard truncate
  if (distilled.length > maxChars) {
    // Try to truncate at a sentence boundary
    const truncated = distilled.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastSentenceEnd > maxChars * 0.8) {
      // Truncate at sentence boundary if it's not too early
      distilled = truncated.substring(0, lastSentenceEnd + 1) + ' ...[truncated]';
    } else {
      // Otherwise truncate at word boundary
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxChars * 0.9) {
        distilled = truncated.substring(0, lastSpace) + ' ...[truncated]';
      } else {
        distilled = truncated + '...[truncated]';
      }
    }
  }
  
  const distilledChars = distilled.length;
  
  return {
    distilled: distilled.trim(),
    wasDistilled: true,
    originalChars,
    distilledChars,
  };
}





























