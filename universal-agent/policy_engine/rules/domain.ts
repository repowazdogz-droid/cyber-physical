import { PolicyContext, PolicyDecision } from "../../core/types";

export type DomainRule = (ctx: PolicyContext) => PolicyDecision;

export const domainRules: DomainRule[] = [];

