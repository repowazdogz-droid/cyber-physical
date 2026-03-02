/**
 * Gemini Configuration
 * 
 * Feature flag and configuration for Gemini 3 Flash integration.
 * Default: DISABLED (requires explicit opt-in).
 * 
 * Version: 1.0.0
 */

export function isGeminiEnabled(): boolean {
  return process.env.GEMINI_ENABLED === 'true';
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3-flash';
}

export function getGeminiBaseUrl(): string {
  return 'https://generativelanguage.googleapis.com/v1beta';
}







































