// spine/llm/openai/OpenAIConfig.ts

export function isOpenAIEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export function getOpenAIModel(): string {
  // Safe default — change later if desired
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export function getOpenAIBaseUrl(): string {
  // Allows proxies / enterprise gateways
  return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
}

export type LLMBackend = "openai" | "gemini";

export function getLLMBackend(): LLMBackend {
  const raw = (process.env.LLM_BACKEND || "openai").toLowerCase();
  return raw === "gemini" ? "gemini" : "openai";
}




































