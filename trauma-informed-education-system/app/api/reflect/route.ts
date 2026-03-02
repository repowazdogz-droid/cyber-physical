import { NextResponse } from "next/server";
import { REFLECT_SYSTEM_PROMPT, REFLECT_OUTPUT_SECTION_ORDER } from "@/lib/prompts/reflectPrompt";
import { generateReflectAnalysis } from "@/lib/gemini";

export type ReflectSections = Record<string, string>;
export type EscalationLevel = "green" | "amber" | "red";

export type ReflectResponse = {
  sections: ReflectSections;
  escalationLevel: EscalationLevel;
  raci?: { responsible?: string; accountable?: string; consulted?: string; informed?: string };
};

export type ReflectRequestBody = {
  childAge: string;
  childYear: string;
  setting: string;
  behaviour: string;
  context: string;
  role: string;
  previousStrategies: string;
  knownDiagnoses?: string;
  careExperienced?: boolean;
  anyOtherInfo?: string;
};

const JSON_OUTPUT_INSTRUCTION = `

You must reply with ONLY a single JSON object (no markdown, no code fence, no other text). The object must have this exact structure:

{
  "sections": {
    "Possible Interpretations": "...",
    "Neurodivergence Considerations": "...",
    "Trauma Considerations": "...",
    "The Overlap — Could This Be Both?": "...",
    "Assumptions Check": "...",
    "Response Considerations": "...",
    "Before You Act": "...",
    "Who Needs to Know? (RACI)": "...",
    "Escalation Screening": "..."
  },
  "escalationLevel": "green" | "amber" | "red",
  "raci": {
    "responsible": "...",
    "accountable": "...",
    "consulted": "...",
    "informed": "..."
  }
}

Use "green" when no immediate safeguarding or escalation concerns; "amber" when monitor or consider referral; "red" when immediate action/DSL referral. Fill every section with your analysis. Output nothing but this JSON.`;

function buildUserMessage(body: ReflectRequestBody): string {
  const parts = [
    `**Role:** ${body.role}`,
    `**Child:** Age ${body.childAge}, ${body.childYear}`,
    `**Setting:** ${body.setting}`,
    `**Behaviour:** ${body.behaviour}`,
    `**Context:** ${body.context}`,
    `**Previous strategies:** ${body.previousStrategies}`,
  ];
  if (body.knownDiagnoses?.trim()) parts.push(`**Known diagnoses or assessments:** ${body.knownDiagnoses.trim()}`);
  if (body.careExperienced) parts.push(`**Care-experienced:** Yes (looked after / previously looked after / child protection plan).`);
  if (body.anyOtherInfo?.trim()) parts.push(`**Other info:** ${body.anyOtherInfo.trim()}`);
  return parts.join("\n\n") + JSON_OUTPUT_INSTRUCTION;
}

const DEFAULT_SECTION = "No specific concerns identified for this section. Consider reviewing with your SENCO or DSL if needed.";
const DEFAULT_ESCALATION: EscalationLevel = "green";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Strip markdown code block if present
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(withoutFence) as unknown;
}

function normalizeSections(raw: Record<string, unknown> | undefined): ReflectSections {
  const sections: ReflectSections = {};
  for (const title of REFLECT_OUTPUT_SECTION_ORDER) {
    const value = raw?.[title];
    sections[title] =
      typeof value === "string" && value.trim()
        ? value.trim()
        : DEFAULT_SECTION;
  }
  return sections;
}

function normalizeEscalationLevel(value: unknown): EscalationLevel {
  if (value === "green" || value === "amber" || value === "red") return value;
  return DEFAULT_ESCALATION;
}

function normalizeRaci(raw: unknown): ReflectResponse["raci"] {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  return {
    responsible: typeof o.responsible === "string" ? o.responsible : undefined,
    accountable: typeof o.accountable === "string" ? o.accountable : undefined,
    consulted: typeof o.consulted === "string" ? o.consulted : undefined,
    informed: typeof o.informed === "string" ? o.informed : undefined,
  };
}

function inferEscalationFromScreening(screeningText: string): EscalationLevel {
  const lower = screeningText.toLowerCase();
  if (/immediate|dsl|safeguard|refer.*now|urgent|disclosure|abuse|neglect/.test(lower)) return "red";
  if (/monitor|refer|assessment|escalat|concern|flag/.test(lower)) return "amber";
  return "green";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReflectRequestBody;
    if (!body.childAge || !body.behaviour || !body.context) {
      return NextResponse.json(
        { error: "Missing required fields: childAge, behaviour, context" },
        { status: 400 }
      );
    }

    const userMessage = buildUserMessage(body);

    const rawText = await generateReflectAnalysis(REFLECT_SYSTEM_PROMPT, userMessage);

    let parsed: unknown;
    try {
      parsed = extractJson(rawText);
    } catch (parseError) {
      console.error("Reflect API: failed to parse LLM response as JSON", parseError);
      return NextResponse.json(
        { error: "The analysis could not be parsed. Please try again." },
        { status: 502 }
      );
    }

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { error: "The analysis did not return a valid structure. Please try again." },
        { status: 502 }
      );
    }

    const obj = parsed as Record<string, unknown>;
    const rawSections = obj.sections as Record<string, unknown> | undefined;
    const sections = normalizeSections(rawSections);
    const screeningText = sections["Escalation Screening"] ?? "";
    const escalationLevel =
      normalizeEscalationLevel(obj.escalationLevel) !== DEFAULT_ESCALATION
        ? normalizeEscalationLevel(obj.escalationLevel)
        : inferEscalationFromScreening(screeningText);
    const raci = normalizeRaci(obj.raci);

    const response: ReflectResponse = {
      sections,
      escalationLevel,
      raci,
    };

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reflect analysis failed";
    console.error("Reflect API error:", e);

    if (message.includes("Missing API key") || message.includes("GOOGLE_GENERATIVE_AI_API_KEY")) {
      return NextResponse.json(
        { error: "Reflect is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in .env.local." },
        { status: 503 }
      );
    }

    if (message.includes("returned no text") || message.includes("blocked")) {
      return NextResponse.json(
        { error: "The analysis could not be completed. Please try again or rephrase the scenario." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Reflect analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
