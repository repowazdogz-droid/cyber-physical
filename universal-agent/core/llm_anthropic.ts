import Anthropic from "@anthropic-ai/sdk";
import { LLMAdapter } from "./types";

const client = new Anthropic();

export const anthropicLLM: LLMAdapter = async (
  prompt: string,
  opts?: { maxTokens?: number },
) => {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: opts?.maxTokens ?? 1000,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
};

