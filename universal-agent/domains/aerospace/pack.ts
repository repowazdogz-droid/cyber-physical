import {
  DomainPack,
  RunContext,
  PolicyContext,
  PolicyDecision,
} from "../../core/types";
import { aerospaceSysPrompt } from "./prompts";
import { AerospaceArtifactSchema, AerospaceArtifact } from "./schemas";

const aerospacePolicies: Array<(ctx: PolicyContext) => PolicyDecision> = [
  (ctx) => {
    const name = ctx.tool.toLowerCase();
    if (name.includes("delete") || name.includes("destroy")) {
      return {
        allow: false,
        reason:
          'Destructive tool operation detected (delete/destroy); human approval required.',
        requiresApproval: true,
      };
    }
    return { allow: true };
  },
  (ctx) => {
    const name = ctx.tool.toLowerCase();
    if (name.includes("send") || name.includes("publish")) {
      return {
        allow: false,
        reason:
          'Outbound communication operation detected (send/publish); human approval required.',
        requiresApproval: true,
      };
    }
    return { allow: true };
  },
];

function extractSafetyFlags(ctx: RunContext): string[] {
  const flags: string[] = [];

  for (const entry of ctx.trace) {
    try {
      const text = JSON.stringify(entry);
      if (text.includes("SAFETY_FLAG")) {
        flags.push(text);
      }
    } catch {
      // ignore serialization issues
    }
  }

  return flags;
}

function extractStandardsReferenced(source: string): string[] {
  const standards = ["FAA", "EASA", "MIL-SPEC", "AS9100", "DO-178C"];
  const referenced: string[] = [];

  for (const std of standards) {
    if (source.includes(std)) {
      referenced.push(std);
    }
  }

  return Array.from(new Set(referenced));
}

function buildFallbackArtifact(ctx: RunContext): AerospaceArtifact {
  const objective =
    ctx.refinedIntent?.objective && ctx.refinedIntent.objective.length > 0
      ? ctx.refinedIntent.objective
      : ctx.intent;

  const findings: string[] = [];

  for (const [tool, value] of Object.entries(ctx.toolResults)) {
    try {
      const summary = JSON.stringify(value).slice(0, 4000);
      findings.push(`Tool ${tool} results: ${summary}`);
    } catch {
      findings.push(`Tool ${tool} produced non-serializable results.`);
    }
  }

  const recommendations =
    ctx.refinedIntent?.success_criteria && ctx.refinedIntent.success_criteria.length
      ? [...ctx.refinedIntent.success_criteria]
      : [];

  const safety_flags = extractSafetyFlags(ctx);

  let standardsText = "";
  try {
    standardsText = JSON.stringify({
      toolResults: ctx.toolResults,
      trace: ctx.trace,
    }).slice(0, 8000);
  } catch {
    standardsText = "";
  }

  const standards_referenced = extractStandardsReferenced(standardsText);

  const fallback: AerospaceArtifact = {
    objective,
    findings,
    recommendations,
    safety_flags,
    standards_referenced,
    confidence: "medium",
    requires_expert_review: true,
  };

  return fallback;
}

export function storeAerospaceFindings(
  ctx: RunContext,
  findings: Partial<AerospaceArtifact>,
): void {
  const current = (ctx.memory.aerospace ?? {}) as Partial<AerospaceArtifact>;
  ctx.memory.aerospace = {
    ...current,
    ...findings,
  };
}

export const aerospacePack: DomainPack = {
  id: "aerospace",
  version: "1.0.0",
  description:
    "Aerospace engineering operations — analysis, standards referencing, safety flagging",
  systemPrompt: aerospaceSysPrompt,
  context: {
    queries: (intent: string) => [
      {
        tool: "web.search",
        input: {
          query: intent + " FAA EASA standards",
          limit: 5,
        },
      },
      {
        tool: "drive.search",
        input: {
          query: intent,
          limit: 3,
        },
      },
    ],
  },
  policies: aerospacePolicies,
  artifact: {
    name: "Aerospace Engineering Brief",
    build: async (ctx: RunContext, llm?: any) => {
      if (!llm)
        return (
          ctx.memory.aerospace ?? {
            objective: ctx.intent,
            findings: [],
            recommendations: [],
            safety_flags: [],
            standards_referenced: [],
            confidence: "low",
            requires_expert_review: true,
          }
        );

      const toolSummary = JSON.stringify(ctx.toolResults).slice(0, 6000);

      const prompt = `
You are an aerospace engineering analysis agent.
Based on the following tool results, produce a structured engineering brief.
Return JSON only matching this exact schema:
{
  "objective": "string",
  "findings": ["string"],
  "recommendations": ["string"],
  "safety_flags": ["string"],
  "standards_referenced": ["string with specific regulation numbers"],
  "confidence": "high" | "medium" | "low",
  "requires_expert_review": boolean
}

Intent: ${ctx.intent}
Tool Results: ${toolSummary}

Be specific. Cite exact regulation numbers. Flag safety items explicitly. If data is insufficient say so in findings.
  `.trim();

      const raw = await llm(prompt);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { extractJson } = require("../../core/llm_json");
      const parsed = extractJson(raw);
      return parsed;
    },
  },
};

