# OMEGA — Freeze Line (Core Guarantees)

This file defines the frozen core of Omega mode behavior.
Changes to the frozen core must be deliberate and paired with:
- omega CI tests passing
- explicit snapshot acceptance if outputs change intentionally

## Non-negotiable guarantees
- No Omega is autonomous.
- No Omega initiates action.
- No Omega replaces judgment.
- Modes never blend by default.
- Mode selection must be explicit (no inference).

## Frozen core files (high sensitivity)
- spine/llm/modes/OmegaModes.ts
- spine/llm/modes/OmegaLenses.ts
- spine/llm/modes/OmegaAudit.ts
- spine/llm/modes/OmegaTighten.ts
- spine/llm/modes/OmegaGShape.ts
- spine/llm/LLMRouter.ts

## Rules for changes
If you edit any frozen core file:
1) Run: npm run test:omega:ci
2) If drift is intended: OMEGA_GOLDENS_ACCEPT=1 npm run test:omega:accept
3) Update the capability ledger if behavior meaningfully changes

## Explicit mode only
Mode must be user-provided via:
- API request body: omegaMode
- UI selector
- CLI argument

No code may infer a mode from the prompt text or context.




































