/**
 * Acceptance: learner + session, execute probe, store observation.
 * EMERGING → ACTIVE only after 3 varied-context observations meeting threshold.
 * Run with DATABASE_URL set (e.g. docker-compose up -d then migrate + seed).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@omega-tutor/db";
import { canPromoteToActive, nextStateAfterObservation } from "@omega-tutor/core";

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("acceptance: gating and observations", () => {
  let learnerId: string;
  let sessionId: string;
  let conceptId: string;
  let configVersionId: string;
  let misconceptionEntryId: string;

  beforeAll(async () => {
    const config = await prisma.configVersion.findFirst();
    const concept = await prisma.concept.findFirst();
    if (!config || !concept) throw new Error("Seed first: npm run db:seed in packages/db");
    configVersionId = config.id;
    conceptId = concept.id;
    const learner = await prisma.learner.create({ data: {} });
    learnerId = learner.id;
    const session = await prisma.session.create({
      data: { learnerId, startAt: new Date(), sessionType: "STANDARD" },
    });
    sessionId = session.id;
    const entry = await prisma.misconceptionEntry.create({
      data: {
        learnerId,
        conceptId,
        grammarLabel: "force_implies_motion",
        state: "EMERGING",
        confidenceScore: 0.5,
        configVersionId,
      },
    });
    misconceptionEntryId = entry.id;
  });

  afterAll(async () => {
    await prisma.observationMisconceptionEntry.deleteMany({});
    await prisma.observation.deleteMany({});
    await prisma.probe.deleteMany({});
    await prisma.misconceptionEntry.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.learner.deleteMany({});
    await prisma.$disconnect();
  });

  it("creates learner + session, executes 1 probe, stores observation", async () => {
    const probe = await prisma.probe.create({
      data: {
        type: "DIAGNOSTIC",
        targetConceptId: conceptId,
        surfaceFormFamily: "direct_question",
        promptContentRef: "force_implies_motion_direct",
        createdBy: "SCHEDULER",
        status: "PENDING",
      },
    });
    const observation = await prisma.observation.create({
      data: {
        learnerId,
        sessionId,
        probeId: probe.id,
        conceptId,
        rawResponse: "The net force is zero because the book is at rest.",
        parsedFeatures: {},
        matchStrength: 0.85,
        grammarLabel: "force_implies_motion",
      },
    });
    await prisma.observationMisconceptionEntry.create({
      data: { observationId: observation.id, misconceptionEntryId },
    });
    await prisma.probe.update({
      where: { id: probe.id },
      data: { status: "EXECUTED", executedInSessionId: sessionId, executedAt: new Date(), resultObservationId: observation.id },
    });
    const count = await prisma.observation.count({ where: { sessionId } });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("EMERGING → ACTIVE only after 3 varied-context observations meeting threshold", async () => {
    const entry = await prisma.misconceptionEntry.findUnique({
      where: { id: misconceptionEntryId },
      include: { observationLinks: { include: { observation: { include: { producer: true } } } } },
    });
    if (!entry) throw new Error("No entry");
    const obsRecords = entry.observationLinks.map((l) => ({
      id: l.observation.id,
      surfaceFormFamily: l.observation.producer?.surfaceFormFamily ?? "direct_question",
      matchStrength: l.observation.matchStrength,
      conceptId: l.observation.conceptId,
      grammarLabel: l.observation.grammarLabel,
    }));
    expect(canPromoteToActive(obsRecords)).toBe(false);
    const threeFamilies = [
      { id: "1", surfaceFormFamily: "direct_question", matchStrength: 0.8, conceptId, grammarLabel: "force_implies_motion" },
      { id: "2", surfaceFormFamily: "scenario_based", matchStrength: 0.75, conceptId, grammarLabel: "force_implies_motion" },
      { id: "3", surfaceFormFamily: "equation_interpretation", matchStrength: 0.9, conceptId, grammarLabel: "force_implies_motion" },
    ];
    expect(canPromoteToActive(threeFamilies)).toBe(true);
    expect(nextStateAfterObservation("EMERGING", threeFamilies)).toBe("ACTIVE");
  });
});
