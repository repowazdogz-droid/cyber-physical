import { LLMAdapter, RefinedIntent } from "./types";
import { RefinedIntentSchema } from "./schemas";
import { extractJson } from "./llm_json";

const BASE_PROMPT = `
You are an intent refinement engine.
Given a raw user intent, produce a single JSON object of type RefinedIntent.

type RefinedIntent = {
  objective: string;
  success_criteria: string[];
  constraints: string[];
  scope_in: string[];
  scope_out: string[];
  assumptions: string[];
  questions: string[];
};

Rules:
- Respond with JSON only. No prose, no markdown.
- Use concise sentences or bullet fragments.
- Only include questions that are truly blocking executing the objective.
- If you can proceed without an answer, do not include that question.
`.trim();

function postProcessQuestions(intent: RefinedIntent): RefinedIntent {
  const questions =
    intent.questions?.map((q) => q.trim()).filter((q) => q.length > 0) ?? [];

  return {
    ...intent,
    questions,
  };
}

async function refineOnce(
  rawIntent: string,
  llm: LLMAdapter,
  extraInstruction?: string,
): Promise<{ refined?: RefinedIntent; rawText: string; errorMessage?: string }> {
  const prompt = [
    BASE_PROMPT,
    extraInstruction?.trim(),
    "",
    "RAW_INTENT:",
    rawIntent,
  ]
    .filter(Boolean)
    .join("\n\n");

  const rawText = await llm(prompt, { maxTokens: 512 });

  try {
    const json = extractJson(rawText);
    const parsed = RefinedIntentSchema.safeParse(json);
    if (!parsed.success) {
      return {
        rawText,
        errorMessage: parsed.error.toString(),
      };
    }

    const refined = postProcessQuestions(parsed.data);
    return { refined, rawText };
  } catch (err: any) {
    return {
      rawText,
      errorMessage: err?.message ?? "Failed to parse JSON",
    };
  }
}

export async function refineIntent(
  rawIntent: string,
  llm: LLMAdapter,
): Promise<RefinedIntent> {
  const first = await refineOnce(rawIntent, llm);
  if (first.refined) {
    return first.refined;
  }

  const correctionInstruction = `
Your previous response was invalid or did not match the RefinedIntent schema.
Reason: ${first.errorMessage ?? "unknown"}

You must respond again with a SINGLE valid JSON object matching RefinedIntent.
Do not include any explanation, markdown, or extra text.
`.trim();

  const second = await refineOnce(rawIntent, llm, correctionInstruction);
  if (second.refined) {
    return second.refined;
  }

  throw new Error(
    `Failed to refine intent after retry. Last error: ${
      second.errorMessage ?? "unknown"
    }`,
  );
}

