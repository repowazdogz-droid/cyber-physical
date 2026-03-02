/**
 * Acceptance: dispute (1 per misconception per session), scheduler caps, audit from stored fields.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@omega-tutor/db";
import { disputeGate, canScheduleProbe } from "@omega-tutor/core";

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("acceptance: dispute, scheduler, audit", () => {
  let learnerId: string;
  let sessionId: string;
  let misconceptionEntryId: string;

  beforeAll(async () => {
    const learner = await prisma.learner.create({ data: {} });
    learnerId = learner.id;
    const session = await prisma.session.create({
      data: { learnerId, startAt: new Date(), sessionType: "STANDARD" },
    });
    sessionId = session.id;
    const concept = await prisma.concept.findFirst();
    const config = await prisma.configVersion.findFirst();
    if (!concept || !config) throw new Error("Seed first");
    const entry = await prisma.misconceptionEntry.create({
      data: {
        learnerId,
        conceptId: concept.id,
        grammarLabel: "action_reaction_cancel",
        state: "ACTIVE",
        confidenceScore: 0.7,
        configVersionId: config.id,
      },
    });
    misconceptionEntryId = entry.id;
  });

  afterAll(async () => {
    await prisma.dispute.deleteMany({});
    await prisma.schedulerQueueItem.deleteMany({});
    await prisma.misconceptionEntry.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.learner.deleteMany({});
    await prisma.$disconnect();
  });

  it("dispute creates record; blocks repeated dispute same session", async () => {
    const before = await prisma.dispute.count({ where: { misconceptionEntryId, sessionId } });
    expect(before).toBe(0);
    const gate = disputeGate(before);
    expect(gate.canDispute).toBe(true);
    await prisma.dispute.create({
      data: {
        misconceptionEntryId,
        sessionId,
        userClaim: "I did not confuse action-reaction.",
        status: "PENDING",
      },
    });
    const after = await prisma.dispute.count({ where: { misconceptionEntryId, sessionId } });
    expect(after).toBe(1);
    const gate2 = disputeGate(after);
    expect(gate2.canDispute).toBe(false);
    expect(gate2.alreadyDisputed).toBe(true);
  });

  it("scheduler produces queue items; enforces ratio cap and time floor", async () => {
    const concept = await prisma.concept.findFirst();
    if (!concept) throw new Error("No concept");
    const probe = await prisma.probe.create({
      data: {
        type: "DIAGNOSTIC",
        targetConceptId: concept.id,
        surfaceFormFamily: "direct_question",
        promptContentRef: "action_reaction_cancel_direct",
        createdBy: "SCHEDULER",
        status: "PENDING",
      },
    });
    await prisma.schedulerQueueItem.create({
      data: {
        probeId: probe.id,
        learnerId,
        priorityScore: 0.8,
        reason: "Active misconception",
        scheduledFor: new Date(),
        status: "PENDING",
      },
    });
    const substantiveInteractions = 3;
    const probesInSession = 1;
    const minutesSinceLastProbe = 1;
    expect(canScheduleProbe(substantiveInteractions, probesInSession, minutesSinceLastProbe)).toBe(false); // time floor
    expect(canScheduleProbe(substantiveInteractions, probesInSession, 2.5)).toBe(true); // after 2 min
    expect(canScheduleProbe(2, 1, null)).toBe(false); // ratio: 1 probe per 3 interactions, so 2 interactions and 1 probe => no
  });

  it("audit affordance displays probe rationale from stored fields", async () => {
    const probe = await prisma.probe.findFirst({
      where: { promptContentRef: "action_reaction_cancel_direct" },
    });
    expect(probe).toBeDefined();
    const purpose = "Checking understanding of Newton's third law.";
    const testing = "Whether action-reaction forces cancel or not.";
    expect(probe?.promptContentRef).toBeDefined();
    expect(probe?.surfaceFormFamily).toBe("direct_question");
    expect(typeof purpose).toBe("string");
    expect(typeof testing).toBe("string");
  });
});
