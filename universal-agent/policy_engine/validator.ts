import { PolicyContext, PolicyDecision } from "../core/types";

type PolicyFn = (ctx: PolicyContext) => PolicyDecision;

const GLOBAL_RULES: PolicyFn[] = [
  // Block all tools containing "delete" (requires approval).
  (ctx) => {
    const name = ctx.tool.toLowerCase();
    if (name.includes("delete")) {
      return {
        allow: false,
        reason: `Tool "${ctx.tool}" performs a delete operation and requires approval.`,
        requiresApproval: true,
      };
    }
    return { allow: true };
  },
  // Block gmail.send (requires approval).
  (ctx) => {
    if (ctx.tool === "gmail.send") {
      return {
        allow: false,
        reason: `Tool "${ctx.tool}" requires explicit human approval.`,
        requiresApproval: true,
      };
    }
    return { allow: true };
  },
];

export function validate(
  ctx: PolicyContext,
  domainPolicies: PolicyFn[] = [],
): PolicyDecision {
  // Apply global rules first.
  for (const rule of GLOBAL_RULES) {
    const decision = rule(ctx);
    if (!decision.allow) {
      return decision;
    }
  }

  // Then apply domain-specific policies, returning the first non-allow.
  for (const rule of domainPolicies) {
    const decision = rule(ctx);
    if (!decision.allow) {
      return decision;
    }
  }

  return { allow: true };
}

