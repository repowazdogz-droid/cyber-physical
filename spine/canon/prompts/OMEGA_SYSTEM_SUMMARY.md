# OMEGA — Final System Summary (As-Built)

**Date**: December 2024  
**Status**: Complete and verified

## 1) Five Omegas = Lenses, Not Agents

**Modes**: v37 (Reasoning) / V (Creative) / B (Build) / R (Reflect) / G (Guardrail)

**Core Principle**: Modes are constitutional wrappers that constrain LLM behavior without changing core kernel logic, policies, or gates.

**Non-Negotiable Guarantees**:
- No Omega is autonomous
- No Omega initiates action
- No Omega replaces judgment
- Modes never blend by default
- Mode selection must be explicit (no inference)

**Mode Selection**:
- **UI**: Kernel Studio (`/kernel-studio`) and LLM Helper Panel (explainable surfaces)
- **API**: `/api/llm/explain` and `/api/llm/specDraft` accept `omegaMode` in request body
- **CLI**: `npm run omega <mode>` and `npm run omega:compare`

## 2) Where Modes Apply

**Enforcement Point**: `spine/llm/LLMRouter.ts` (single source of truth)

**Flow**:
1. **Lens Application**: Selected mode's system preamble and output contract prepended to user prompt
2. **Audit**: Output validated against mode's violation rules (decision-making, autonomy signals, mode bleed, G-shape)
3. **One-Shot Retry**: If audit fails and retry enabled (default: true), single repair attempt with "tighten instruction"
4. **Optional Strict Mode**: If `OMEGA_STRICT=true` and audit still fails after retry, router returns error instead of non-compliant output

**Backend Agnostic**: Works with OpenAI or Gemini via unified `LLMRouter` interface.

**Reversible**: Mode application is non-invasive—can be disabled by omitting `omegaMode` parameter.

## 3) Guardrails That Are Now Real (Not Aspirational)

### Audit Layer (Observation + Detection)
- **Location**: `spine/llm/modes/OmegaAudit.ts`
- **Violations Detected**: `DECISION_MADE`, `GOAL_INFERRED`, `ADVICE_GIVEN`, `PERSUASION`, `AUTONOMY_SIGNAL`, `MODE_BLEED`, `CONVERGENCE`, `JUDGMENT_LANGUAGE`, `SHAPE_INVALID`
- **Behavior**: Observation-only—flags violations but doesn't block output (unless strict mode enabled)

### OMEGA-G Refusal Shape
- **Location**: `spine/llm/modes/OmegaGShape.ts`
- **Requirement**: Exact three headings: `CLEAR REFUSAL`, `WHY`, `SAFE ADJACENT HELP`
- **Enforcement**: Structural validation in audit; repaired once if malformed

### One-Shot Retry
- **Location**: `spine/llm/LLMRouter.ts` (lines 186-256)
- **Behavior**: Exactly 1 repair attempt; no loops; no extra autonomy
- **Tighten Instruction**: `spine/llm/modes/OmegaTighten.ts` builds violation-specific repair prompt

### Strict Mode (`OMEGA_STRICT=true`)
- **Location**: `spine/llm/modes/OmegaStrict.ts` + `LLMRouter.ts` (lines 221-240, 268-287, 303-327)
- **Behavior**: Hard-fails non-compliant outputs after retry; returns error with full omega metadata
- **Error Format**: Bounded to 500 chars; includes mode and violations

## 4) Provenance Is First-Class

**OmegaMeta Structure** (`spine/llm/modes/OmegaMeta.ts`):
```typescript
{
  mode: OmegaMode;
  audit?: { ok: boolean; violations: OmegaViolation[] };
  retry?: { attempted: boolean; repaired: boolean };
}
```

**Flow Through System**:
- **LLM Responses**: `LLMRouter.generateText()` returns `omegaMeta` in result
- **API Responses**: `/api/llm/explain` and `/api/llm/specDraft` include `omegaMeta` field
- **Kernel/Orchestrator Runs**: `KernelResult.omega` and `OrchestratorRun.omega` propagate metadata
- **Artifacts**: `ArtifactManifest.omega` and `ArtifactMeta.omega` store provenance
- **UI Badge**: `OmegaMetaBadge` component displays mode + audit + retry status

**Orchestrator Propagation** (`spine/orchestrator/KernelGraphRunner.ts`):
- Extracts `omega` from each node's `KernelResult`
- Merges via `mergeOmegaMeta()` (prefers more informative: audit present, retry attempted, audit failures)
- Attaches merged `omega` to final `OrchestratorRun`

**Artifact Persistence**:
- `ArtifactVerifier` preserves `omega` from `payloads.meta.omega`
- `ArtifactVault.putArtifact()` accepts `meta.omega` (takes precedence over payloads)
- Round-trip verified: `spine/artifacts/__tests__/artifact_omega_meta.test.ts`

## 5) Local Use Is Supported

**CLI Tools**:
- `npm run omega <mode> --text "..."` or `--file path`: Run single mode locally
- `npm run omega:compare --text "..."`: Compare all five modes side-by-side
- Options: `--max <chars>`, `--audit`, `--save` (artifact capture)

**No Web Server Required**: CLI uses same `LLMRouter` as API routes; still requires LLM backend (OpenAI/Gemini) configured.

**Local Storage**: UI selections persist via `localStorage` (`omegaMode` key).

## 6) CI Safety Net Exists

### Invariants Tests (Always Run)
- **Location**: `spine/llm/modes/__tests__/omega_invariants.test.ts`
- **Checks**: Exactly 5 modes exist; G-mode requires 3 headings; all lenses declare violations arrays
- **CI**: Runs on every PR/push (no LLM backend required)

### Freeze-Line Wiring
- **Detection**: `scripts/omega-freeze-changed.mjs` detects changes to frozen core files
- **Frozen Core**: `OmegaModes.ts`, `OmegaLenses.ts`, `OmegaAudit.ts`, `OmegaTighten.ts`, `OmegaGShape.ts`, `LLMRouter.ts`, `OMEGA_FREEZE_LINE.md`, `OMEGA_CAPABILITY_LEDGER.md`
- **CI Workflow**: `.github/workflows/omega-freeze.yml`
  - If frozen core changed: runs `npm run test:omega:ci` (requires LLM backend)
  - Always runs: invariants test (no LLM required)

### Golden Tests (Conditional)
- **Location**: `spine/llm/modes/__tests__/omega_goldens_ci.test.ts`
- **Test Cases**: 10 cases (2 per mode) in `spine/llm/modes/omega_goldens_v1.ts`
- **Enforcement**: Audit must pass (`audit.ok === true`); G-mode shape must be valid; snapshot drift detected via Levenshtein distance
- **Accept Flow**: `OMEGA_GOLDENS_ACCEPT=1 npm run test:omega:accept` (local only; CI never accepts)

## Verification Checklist (All Passed)

✅ **Type Check**: `npm run typecheck` — No errors  
✅ **Omega Strict**: `OmegaStrict.ts` exists; `LLMRouter.ts` imports and uses in 3 places  
✅ **API Error Pass-Through**: Both `/api/llm/explain` and `/api/llm/specDraft` include omega metadata on errors  
✅ **Omega Merge**: `omegaMerge.ts` exists; orchestrator uses it to accumulate omega  
✅ **Orchestrator Omega**: `KernelGraphRunner.ts` tracks and attaches `omega` to final `OrchestratorRun`  
✅ **Docs Present**: `OMEGA_README.md`, `OMEGA_OPERATIONS.md`, `OMEGA_MODE_GUIDE.md` all exist in `/spine`

## Key Files

**Core**:
- `spine/llm/LLMRouter.ts` — Single enforcement point
- `spine/llm/modes/OmegaModes.ts` — Five mode definitions
- `spine/llm/modes/OmegaLenses.ts` — Lens implementations
- `spine/llm/modes/OmegaAudit.ts` — Violation detection
- `spine/llm/modes/OmegaStrict.ts` — Strict mode check
- `spine/llm/modes/omegaMerge.ts` — Meta merging logic

**Propagation**:
- `spine/orchestrator/KernelGraphRunner.ts` — Orchestrator omega accumulation
- `spine/kernels/core/KernelTypes.ts` — `KernelResult.omega` field
- `spine/orchestrator/OrchestratorTypes.ts` — `OrchestratorRun.omega` and `OrchestratorNodeResult.omega` fields
- `spine/artifacts/ArtifactTypes.ts` — `ArtifactMeta.omega` field

**Documentation**:
- `spine/OMEGA_README.md` — System overview
- `spine/OMEGA_OPERATIONS.md` — Operations guide
- `spine/OMEGA_MODE_GUIDE.md` — Mode selection guide
- `spine/OMEGA_FREEZE_LINE.md` — Frozen guarantees
- `spine/OMEGA_CAPABILITY_LEDGER.md` — Capability boundaries

## System State: Production Ready

All three blocks completed:
1. ✅ **Block 1**: Orchestrator outputs show omega when any node/run includes it
2. ✅ **Block 2**: `OMEGA_STRICT=true` hard-fails non-compliant outputs after one retry
3. ✅ **Block 3**: Three docs exist and match current codepaths

The system is complete, documented, and ready for handoff.






















