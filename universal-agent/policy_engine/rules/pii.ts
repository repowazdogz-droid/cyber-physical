import { PolicyContext, PolicyDecision } from "../../core/types";

const PII_KEYS = new Set(["ssn", "dob", "passport", "national_id"]);

export function piiRule(ctx: PolicyContext): PolicyDecision {
  if (containsPiiKeys(ctx.input)) {
    return {
      allow: false,
      reason: "Tool input contains sensitive PII fields and requires approval.",
      requiresApproval: true,
    };
  }

  return { allow: true };
}

function containsPiiKeys(value: unknown, seen = new Set<any>()): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      if (containsPiiKeys(item, seen)) {
        return true;
      }
    }
    return false;
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (PII_KEYS.has(key.toLowerCase())) {
      return true;
    }
    const nested = (value as any)[key];
    if (containsPiiKeys(nested, seen)) {
      return true;
    }
  }

  return false;
}

