/**
 * Gemini client for Reflect synthesis.
 * Requires GOOGLE_GENERATIVE_AI_API_KEY in environment.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-1.5-flash";

function getApiKey(): string {
  const key =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Missing API key. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in .env.local"
    );
  }
  return key.trim();
}

/**
 * Call Gemini with a system prompt and user message. Returns the raw text response.
 */
export async function generateReflectAnalysis(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userMessage);
  const response = result.response;

  if (!response.text) {
    throw new Error("Gemini returned no text. The response may have been blocked.");
  }

  return response.text();
}
