# OMEGA — Capability Ledger

This ledger describes what the system can do, where it is invoked, and the enforced boundaries.

## 1) Omega lenses (mode framing)
Entry points:
- UI: OmegaModeSelect → /api/llm/explain, /api/llm/specDraft
- CLI: npm run omega, npm run omega:compare
- Router: spine/llm/LLMRouter.ts

Boundaries:
- Mode must be explicit; no inference.
- Lenses constrain output shape/structure; they do not add agency.

Enforcement:
- omega_invariants.test.ts
- omega_lens_router.test.ts

## 2) Audit (observation-only + enforcement via retry)
Entry point:
- spine/llm/modes/OmegaAudit.ts (router post-check)

Boundaries:
- Audit does not take actions.
- Audit can only trigger one bounded retry (if enabled).

Enforcement:
- omega_audit.test.ts
- omega_retry_router.test.ts
- omega_invariants.test.ts

## 3) One-shot retry (bounded repair)
Entry point:
- spine/llm/LLMRouter.ts

Boundaries:
- Max 1 retry; no loops.
- Retry only tightens constraints; does not expand scope.

Enforcement:
- omega_retry_router.test.ts
- omega_invariants.test.ts

## 4) OMEGA-G refusal shape (hard structure)
Entry point:
- spine/llm/modes/OmegaGShape.ts + audit SHAPE_INVALID

Boundaries:
- Must output three headings:
  CLEAR REFUSAL / WHY / SAFE ADJACENT HELP

Enforcement:
- omega_g_shape.test.ts
- omega_invariants.test.ts

## 5) Provenance (OmegaMeta)
Entry points:
- Router returns omegaMeta
- Artifacts persist omega in manifest/meta
- UI shows OmegaMetaBadge

Boundaries:
- Provenance is read-only; no policy decisions are made from it automatically.

Enforcement:
- omega_meta_contract.test.ts
- artifact_omega_meta.test.ts






















