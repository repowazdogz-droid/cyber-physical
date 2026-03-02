/**
 * Gemini Client
 * 
 * Bounded, safe client for Gemini 3 Flash API.
 * No tool usage, no function calling, no code execution.
 * 
 * Version: 1.0.0
 */

import { getGeminiApiKey, getGeminiModel, getGeminiBaseUrl } from '../config/GeminiConfig';

export interface GenerateTextOptions {
  system?: string;
  user: string;
  maxOutputChars?: number;
  temperature?: number;
  jsonSchema?: object;
}

export interface GenerateTextResult {
  ok: boolean;
  text?: string;
  error?: string;
}

const DEFAULT_MAX_OUTPUT_CHARS = 1200;
const HARD_CAP_OUTPUT_CHARS = 2000;
const MAX_RETRIES = 2;

/**
 * Generates text using Gemini API with strict bounds.
 */
export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY not set' };
  }

  const maxOutputChars = Math.min(
    options.maxOutputChars || DEFAULT_MAX_OUTPUT_CHARS,
    HARD_CAP_OUTPUT_CHARS
  );

  const model = getGeminiModel();
  const baseUrl = getGeminiBaseUrl();
  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = options.system || 'You are a helpful assistant that provides brief, accurate explanations.';
  
  // Build request payload
  const requestBody: any = {
    contents: [
      {
        parts: [
          { text: options.user }
        ]
      }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: Math.ceil(maxOutputChars / 4), // Rough estimate: 1 token ≈ 4 chars
    },
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    }
  };

  // Add JSON schema if provided (Gemini API format)
  if (options.jsonSchema) {
    requestBody.generationConfig.responseMimeType = 'application/json';
    requestBody.generationConfig.responseSchema = {
      type: 'object',
      properties: options.jsonSchema
    };
  }

  let lastError: string | undefined;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content in response');
      }

      // Bound output
      let boundedText = content;
      if (boundedText.length > maxOutputChars) {
        boundedText = boundedText.substring(0, maxOutputChars - 3) + '...';
      }

      // If JSON was requested and parse fails, retry with stricter instruction
      if (options.jsonSchema && attempt === 0) {
        try {
          JSON.parse(boundedText);
        } catch {
          // Retry with stricter JSON instruction
          requestBody.contents[0].parts[0].text = 
            options.user + '\n\nIMPORTANT: RETURN VALID JSON ONLY. No markdown fences, no explanations, just JSON.';
          continue;
        }
      }

      return { ok: true, text: boundedText };
    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      
      // If JSON parse failed and we haven't retried yet, continue to retry
      if (options.jsonSchema && attempt === 0 && error.message?.includes('JSON')) {
        requestBody.contents[0].parts[0].text = 
          options.user + '\n\nIMPORTANT: RETURN VALID JSON ONLY. No markdown fences, no explanations, just JSON.';
        continue;
      }
      
      // If last attempt, return error
      if (attempt === MAX_RETRIES - 1) {
        return { ok: false, error: lastError };
      }
    }
  }

  return { ok: false, error: lastError || 'Max retries exceeded' };
}

