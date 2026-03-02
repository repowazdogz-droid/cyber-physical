/**
 * @omega-tutor/db — Prisma client and re-exports
 */
export { PrismaClient } from "@prisma/client";
export type {
  Learner,
  Session,
  Concept,
  ConceptEdge,
  ConfigVersion,
  Probe,
  Observation,
  MisconceptionEntry,
  MisconceptionTarget,
  Repair,
  SchedulerQueueItem,
  Dispute,
  SessionType,
  EdgeSource,
  ProbeType,
  ProbeCreatedBy,
  ProbeStatus,
  MisconceptionState,
  SchedulerQueueStatus,
  DisputeStatus,
} from "@prisma/client";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
