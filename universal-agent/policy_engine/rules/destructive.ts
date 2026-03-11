import { PolicyContext, PolicyDecision } from "../../core/types";

export function destructiveRule(ctx: PolicyContext): PolicyDecision {
  const name = ctx.tool.toLowerCase();

  if (name.includes("delete") || name.includes("destroy")) {
    return {
      allow: false,
      reason: `Tool "${ctx.tool}" appears destructive and requires approval.`,
      requiresApproval: true,
    };
  }

  return { allow: true };
}

