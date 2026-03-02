import { NextResponse } from "next/server";
import { prisma } from "@omega-tutor/db";

export async function POST() {
  const learner = await prisma.learner.create({ data: {} });
  const session = await prisma.session.create({
    data: {
      learnerId: learner.id,
      startAt: new Date(),
      sessionType: "STANDARD",
    },
  });
  return NextResponse.json({ sessionId: session.id, learnerId: learner.id });
}
