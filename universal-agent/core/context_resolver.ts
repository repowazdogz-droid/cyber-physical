import { DomainPack, RefinedIntent } from "./types";

export function resolveContext(
  domain: DomainPack,
  refinedIntent: RefinedIntent,
): Array<{ tool: string; input: any }> {
  if (domain.context?.queries) {
    return domain.context.queries(refinedIntent.objective);
  }
  return [];
}

