import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@omega-tutor/db";
import { stubLLM } from "@/lib/llm-stub";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text : "";

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { learner: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Stub: no probe execution in this minimal route; just echo and optionally run analyze on a dummy probe
  const reply = "I’m listening. Say more about what you understand.";
  let probePurpose = "";
  let probeTesting = "";

  // If we had a pending probe we could run analyzeResponse here and store observation
  const firstConcept = await prisma.concept.findFirst();
  if (firstConcept) {
    const analyzed = await stubLLM.analyzeResponse({
      probePrompt: "",
      probeSurfaceFormFamily: "direct_question",
      probeGrammarLabel: "force_implies_motion",
      conceptId: firstConcept.id,
      userText: text,
    });
    if (analyzed.suggestedNextAction === "follow_up") {
      probePurpose = "Checking consistency with Newton’s first law.";
      probeTesting = "Whether the learner distinguishes no net force from no motion.";
    }
  }

  return NextResponse.json({ reply, probePurpose, probeTesting });
}
