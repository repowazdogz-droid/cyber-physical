import { DomainPack } from "../../core/types";
import { ndTaskThreadSysPrompt } from "./prompts";
import { NDTaskThreadArtifactSchema } from "./schemas";
import { extractJson } from "../../core/llm_json";

export const ndTaskThreadPack: DomainPack = {
  id: "nd-task-thread",
  version: "1.0.0",
  allowedTools: ["web.search", "drive.search"],
  description:
    "Converts messy task input into a structured, sequenced, executable thread optimised for neurodivergent cognitive patterns.",
  systemPrompt: ndTaskThreadSysPrompt,
  policies: [
    ({ tool }) =>
      tool.includes("delete") || tool.includes("send")
        ? {
            allow: false,
            reason:
              "ND Task Thread does not send or delete without explicit approval",
            requiresApproval: true,
          }
        : { allow: true },
  ],

  artifact: {
    name: "ND Task Thread",
    build: async (ctx: any, llm?: any) => {
      if (!llm)
        return {
          objective: ctx.intent,
          thread: [],
          decisions_needed: [],
          safety_flags: ["No LLM available - artifact empty"],
          confidence: "low",
          requires_human_review: true,
        };

      const prompt = `
You are a task clarity agent for neurodivergent cognitive patterns.
Given the following intent and any available context, produce a structured task thread.

Return JSON only matching this exact schema:
{
  "objective": "string - one sentence",
  "thread": [
    {
      "id": "t1",
      "task": "string - one concrete action",
      "status": "ready | blocked | needs_decision | in_progress | done",
      "blocker": "string - optional, what is blocking this",
      "unblocked_by": "string - optional, what resolves the blocker",
      "cognitive_load": "low | medium | high",
      "estimated_minutes": number or null,
      "context": "string - optional extra context"
    }
  ],
  "decisions_needed": ["string"],
  "safety_flags": ["string"],
  "confidence": "high | medium | low",
  "requires_human_review": boolean
}

Intent: ${ctx.intent}
Context: ${JSON.stringify(ctx.toolResults).slice(0, 3000)}

Rules:
- Sequence by cognitive load: low first, then medium, then high
- Be specific — no vague tasks like "research X", break it down
- If something is blocked, say exactly what unblocks it
- Keep estimated_minutes realistic
- decisions_needed are things that must be resolved before tasks can proceed
      `.trim();

      const raw = await llm(prompt);
      let parsed: any;
      try {
        parsed = extractJson(raw);
      } catch (e) {
        return {
          objective: ctx.intent,
          thread: [],
          decisions_needed: [
            "Could not parse LLM response - retry with clearer input",
          ],
          safety_flags: ["JSON parse failed"],
          confidence: "low",
          requires_human_review: true,
        };
      }
      const result = NDTaskThreadArtifactSchema.safeParse(parsed);
      if (result.success) return result.data;
      return { ...parsed, confidence: "low", requires_human_review: true };
    },
  },
};

