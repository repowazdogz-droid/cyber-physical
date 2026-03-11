import { LLMAdapter, RefinedIntent } from "./types";
import { extractJson } from "./llm_json";
import { MapperFrameSchema } from "./schemas";

export async function mapIntent(
  refinedIntent: RefinedIntent,
  contextSummary: string,
  llm: LLMAdapter,
): Promise<{ objective: string; risks: string[]; missing: string[] }> {
  const prompt = `
System: You are a mapper agent. Analyse this intent and context.
Return JSON only: { "objective": "", "risks": [], "missing": [] }

Intent: ${refinedIntent.objective}
Context: ${contextSummary}
  `.trim();

  let raw = await llm(prompt);
  let parsed = extractJson(raw);
  const result = MapperFrameSchema.safeParse(parsed);
  if (result.success) return result.data;

  // retry once
  raw = await llm(
    prompt + "\nPrevious output was invalid. Return valid JSON only.",
  );
  parsed = extractJson(raw);
  return MapperFrameSchema.parse(parsed);
}

export async function riskScan(
  refinedIntent: RefinedIntent,
  llm: LLMAdapter,
): Promise<{ risks: string[] }> {
  const prompt = `
System: You are a risk scanner. Identify risks for this intent.
Return JSON only: { "risks": [] }

Intent: ${refinedIntent.objective}
Constraints: ${refinedIntent.constraints.join(", ")}
  `.trim();

  const raw = await llm(prompt);
  const parsed = extractJson(raw);
  return { risks: parsed.risks ?? [] };
}

