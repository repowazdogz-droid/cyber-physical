import { z } from "zod";

export const NDTaskSchema = z.object({
  id: z.string(),
  task: z.string(),
  status: z.enum(["ready", "blocked", "needs_decision", "in_progress", "done"]),
  blocker: z.string().optional(),
  unblocked_by: z.string().optional(),
  cognitive_load: z.enum(["low", "medium", "high"]),
  estimated_minutes: z.number().optional(),
  context: z.string().optional(),
});

export const NDTaskThreadArtifactSchema = z.object({
  objective: z.string(),
  thread: z.array(NDTaskSchema),
  decisions_needed: z.array(z.string()),
  safety_flags: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  requires_human_review: z.boolean(),
});

export type NDTaskThreadArtifact = z.infer<typeof NDTaskThreadArtifactSchema>;

