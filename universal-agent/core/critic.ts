import { LLMAdapter, RefinedIntent } from "./types";
import { extractJson } from "./llm_json";
import { CriticSchema } from "./schemas";

export async function criticReview(
  artifact: any,
  refinedIntent: RefinedIntent,
  llm: LLMAdapter,
): Promise<{ issues: string[]; safe: boolean; fixes: string[] }> {
  const prompt = `
System: You are a critic agent. Review this artifact for hallucinations, missing caveats, and policy issues.
Return JSON only: { "issues": [], "safe": true, "fixes": [] }

Objective: ${refinedIntent.objective}
Artifact: ${JSON.stringify(artifact).slice(0, 6000)}
  `.trim();

  let raw = await llm(prompt);
  let parsed = extractJson(raw);
  const result = CriticSchema.safeParse(parsed);
  if (result.success) return result.data;

  // retry once
  raw = await llm(
    prompt + "\nPrevious output was invalid. Return valid JSON only.",
  );
  parsed = extractJson(raw);
  return CriticSchema.parse(parsed);
}

