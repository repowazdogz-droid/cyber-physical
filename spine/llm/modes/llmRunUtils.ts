// spine/llm/modes/llmRunUtils.ts

import crypto from "crypto";

/**
 * Bounds text to a maximum length.
 * @param input - Input text
 * @param max - Maximum length (default 2000)
 * @returns Bounded text
 */
export function boundText(input: string, max = 2000): string {
  const s = String(input ?? "");
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * Hashes text using SHA-256.
 * @param input - Input text
 * @returns Hex-encoded SHA-256 hash
 */
export function hashText(input: string): string {
  return crypto.createHash("sha256").update(String(input ?? ""), "utf8").digest("hex");
}




































