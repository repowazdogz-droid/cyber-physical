# OMEGA — Operations Guide

## Local Run

1. **Install dependencies**:
   ```bash
   npm i
   ```

2. **Start development server**:
   ```bash
   npm run dev          # Auto-picks free port
   npm run dev:safe     # Auto-picks port + opens browser
   ```

The dev server will automatically find an available port and start Next.js.

## LLM Backends

### OpenAI (Default)

Set environment variables:
```bash
export OPENAI_API_KEY="sk-..."
export LLM_BACKEND="openai"  # Optional, defaults to OpenAI if key present
```

Optional configuration:
- `OPENAI_MODEL`: Model name (default: backend default)
- `OPENAI_BASE_URL`: Custom base URL (default: OpenAI API)

### Gemini (Alternative)

Set environment variables:
```bash
export GEMINI_ENABLED="true"
export GEMINI_API_KEY="..."
export LLM_BACKEND="gemini"  # Optional, defaults to Gemini if enabled
```

Optional configuration:
- `GEMINI_MODEL`: Model name (default: backend default)

**Backend Selection Priority**:
1. `LLM_BACKEND` env var (if set)
2. OpenAI if `OPENAI_API_KEY` is set
3. Gemini if `GEMINI_ENABLED=true` and `GEMINI_API_KEY` is set
4. Error if neither configured

## Strict Mode

**Environment Variable**: `OMEGA_STRICT=true`

**Semantics**:
- When enabled and an Omega mode is used, the router enforces audit compliance
- If audit fails after one retry attempt, the router returns an error instead of non-compliant output
- Error message includes mode and violation details (bounded to 500 chars)
- `omegaMeta` is still returned with full audit/retry information

**Use Cases**:
- CI/CD pipelines where compliance is mandatory
- Production environments requiring strict adherence to mode contracts
- Testing mode enforcement behavior

**Default Behavior** (when `OMEGA_STRICT` is not set or `false`):
- Non-compliant outputs are returned with audit metadata
- Callers can inspect `omegaMeta.audit.ok` to decide how to handle violations

## Golden Tests

### Run CI Tests

```bash
npm run test:omega:ci
```

Runs golden test suite that:
- Executes 10 test cases (2 per mode)
- Validates audit compliance (`audit.ok` must be `true`)
- Validates G-mode shape (exact headings required)
- Detects output drift (Levenshtein distance thresholds)
- Fails CI if snapshots drift or audits fail

**Requirements**: LLM backend must be configured (OpenAI or Gemini).

### Accept Snapshot Changes

When outputs intentionally change (e.g., prompt improvements, model updates):

```bash
OMEGA_GOLDENS_ACCEPT=1 npm run test:omega:accept
```

This:
- Regenerates snapshot files (`spine/llm/modes/goldens/omega_goldens.v1.snap.json`)
- Updates metadata (`omega_goldens.v1.meta.json`)
- **Only run locally**—CI never accepts snapshots automatically

**Important**: Review diff before accepting. Snapshot changes affect all future CI runs.

## Freeze-Line CI

**Trigger**: Changes to frozen core files trigger Omega guardrails in CI.

**Frozen Core Files**:
- `spine/llm/modes/OmegaModes.ts`
- `spine/llm/modes/OmegaLenses.ts`
- `spine/llm/modes/OmegaAudit.ts`
- `spine/llm/modes/OmegaTighten.ts`
- `spine/llm/modes/OmegaGShape.ts`
- `spine/llm/LLMRouter.ts`
- `spine/OMEGA_FREEZE_LINE.md`
- `spine/OMEGA_CAPABILITY_LEDGER.md`

**CI Behavior**:
1. `.github/workflows/omega-freeze.yml` detects changes via `npm run omega:freeze:changed`
2. If frozen core changed: runs `npm run test:omega:ci` (requires LLM backend)
3. Always runs: `npm run test -- spine/llm/modes/__tests__/omega_invariants.test.ts` (no LLM required)

**Invariants Test** (always runs):
- Verifies exactly five modes exist
- Verifies G-mode requires three headings
- Verifies all lenses declare violations arrays

**Golden Tests** (conditional):
- Only runs if frozen core files changed
- Requires `OPENAI_API_KEY` secret in GitHub Actions
- Fails PR if audits fail or snapshots drift unexpectedly

**Local Check**:
```bash
npm run omega:freeze:changed
# Outputs: OMEGA_FROZEN_CHANGED=0 or OMEGA_FROZEN_CHANGED=1
```




































