import { z } from "zod";

export const RefinedIntentSchema = z.object({
  objective: z.string(),
  success_criteria: z.array(z.string()),
  constraints: z.array(z.string()),
  scope_in: z.array(z.string()),
  scope_out: z.array(z.string()),
  assumptions: z.array(z.string()),
  questions: z.array(z.string()),
});

export const MapperFrameSchema = z.object({
  objective: z.string(),
  risks: z.array(z.string()).max(5),
  missing: z.array(z.string()).max(5),
});

export const CriticSchema = z.object({
  issues: z.array(z.string()),
  safe: z.boolean(),
  fixes: z.array(z.string()),
});

export const PlanSchema = z.array(
  z.object({
    tool: z.string(),
    input: z.any(),
  }),
);

