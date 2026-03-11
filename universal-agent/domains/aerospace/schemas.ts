import { z } from "zod";

export const AerospaceArtifactSchema = z.object({
  objective: z.string(),
  findings: z.array(z.string()),
  recommendations: z.array(z.string()),
  safety_flags: z.array(z.string()),
  standards_referenced: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  requires_expert_review: z.boolean(),
});

export type AerospaceArtifact = z.infer<typeof AerospaceArtifactSchema>;

