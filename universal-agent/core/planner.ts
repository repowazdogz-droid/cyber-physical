import { DomainPack, LLMAdapter, RefinedIntent } from "./types";
import { PlanSchema } from "./schemas";
import { extractJson } from "./llm_json";
import { listTools } from "../tools/registry";

type PlanStep = {
  tool: string;
  input: any;
};

const BASE_PROMPT = `
You are a planning engine for a universal agent.

Given a high-level objective and a list of available tools, you must produce a JSON array representing a plan.

Each element of the array must be:
{ "tool": string, "input": any }

Rules:
- Respond with a JSON array ONLY. No prose, no markdown, no explanations.
- Each step input MUST be a JSON object with a query key, for example: {"query": "search terms here"} — never a plain string.
- Use at most 10 steps.
- Use only tools from the provided list.
- Omit steps that are obviously redundant or no-ops.
`.trim();

async function planOnce(
  refinedIntent: RefinedIntent,
  llm: LLMAdapter,
  extraInstruction?: string,
  domain?: DomainPack,
): Promise<{ steps?: PlanStep[]; errorMessage?: string }> {
  const allTools = listTools();
  const tools =
    domain?.allowedTools
      ? allTools.filter((t) => domain.allowedTools!.includes(t.name))
      : allTools;
  const toolNames = tools.map((t) => t.name);

  const promptSections = [
    BASE_PROMPT,
    extraInstruction?.trim(),
    "",
    "OBJECTIVE:",
    refinedIntent.objective,
    "",
    "AVAILABLE_TOOLS (names only):",
    JSON.stringify(toolNames),
    "",
    "Return the JSON array of steps now.",
  ].filter(Boolean);

  const prompt = promptSections.join("\n\n");

  // eslint-disable-next-line no-console
  console.log("PLANNER PROMPT:", prompt.slice(0, 200));

  const raw = await llm(prompt, { maxTokens: 512 });

  // eslint-disable-next-line no-console
  console.log("PLANNER RAW RESPONSE:", raw);
  // eslint-disable-next-line no-console
  console.log("PLANNER EXTRACTED:", JSON.stringify(extractJson(raw)));

  try {
    const json = extractJson(raw);
    const parsed = PlanSchema.safeParse(json);
    if (!parsed.success) {
      return { errorMessage: parsed.error.toString() };
    }

    return { steps: parsed.data as PlanStep[] };
  } catch (err: any) {
    return {
      errorMessage: err?.message ?? "Failed to parse JSON plan",
    };
  }
}

export async function plan(
  refinedIntent: RefinedIntent,
  llm: LLMAdapter,
  domain?: DomainPack,
): Promise<PlanStep[]> {
  const first = await planOnce(refinedIntent, llm, undefined, domain);
  if (first.steps) {
    return first.steps;
  }

  const correctionInstruction = `
Your previous response was invalid or did not match the required JSON plan schema.
Reason: ${first.errorMessage ?? "unknown"}

You must respond again with a SINGLE JSON array of steps:
[{ "tool": string, "input": any }, ...]
Do not include any explanation, markdown, or extra text.
`.trim();

  const second = await planOnce(
    refinedIntent,
    llm,
    correctionInstruction,
    domain,
  );
  if (second.steps) {
    return second.steps;
  }

  throw new Error(
    `Failed to generate execution plan after retry. Last error: ${
      second.errorMessage ?? "unknown"
    }`,
  );
}

