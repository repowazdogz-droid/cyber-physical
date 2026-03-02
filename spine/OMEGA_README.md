# OMEGA — System Overview

Omega is a constitutional wrapper system for LLM calls that enforces explicit output contracts, structural validation, and audit compliance. It provides five distinct modes (V, v37, B, R, G) that constrain LLM behavior without changing core kernel logic, policies, or gates.

## The Five Modes

**v37 (Reasoning)**: Supports human reasoning with claims and evidence. Provides structured reasoning snapshots, alternatives, constraints, and meta-audit sections. Forbidden: making decisions, prioritizing actions, simulating intent, optimizing outcomes. Use when you need analytical support without decision-making.

**V (Creative)**: Expands creative possibilities without converging or judging. Provides variations, creative levers, playful directions, and soft constraints. Forbidden: choosing best options, finalizing designs, critiquing unless asked. Use when exploring creative space without premature convergence.

**B (Build)**: Translates explicit intent into concrete execution steps. Provides understood intent, execution steps, required inputs, scope boundaries, and checkpoints. Forbidden: proposing new goals, expanding scope, chaining tasks automatically. Use when scaffolding execution from clear requirements.

**R (Reflect)**: Supports reflection without judgment. Surfaces patterns, surprises, learnings, and open questions. Forbidden: assigning blame, giving advice, moralizing outcomes. Use when analyzing past work or learning from experience.

**G (Guardrail)**: Enforces boundaries and refusals. Outputs must follow exact structure: CLEAR REFUSAL (one sentence), WHY (plain, non-moralizing), SAFE ADJACENT HELP (what can be done). Forbidden: softening refusals, implying exceptions, escalating assistance. Use when enforcing hard limits or safety boundaries.

## How Modes Are Applied

Modes are applied via the `LLMRouter` at the last possible moment before handing off to the LLM backend:

1. **Lens Application**: The selected mode's system preamble and output contract are prepended to the user prompt.
2. **Audit**: After generation, output is validated against the mode's violation rules (e.g., decision-making, autonomy signals, mode bleed).
3. **One-Shot Retry**: If audit fails and retry is enabled (default: true), a single repair attempt is made with a "tighten instruction" that highlights violations.
4. **Optional Strict Mode**: If `OMEGA_STRICT=true` is set and audit still fails after retry, the router returns an error instead of non-compliant output.

All mode application is centralized in `spine/llm/LLMRouter.ts`, backend-agnostic (OpenAI/Gemini), and fully reversible.

## Where Mode Is Selectable

**UI**:
- Kernel Studio (`/kernel-studio`): Omega mode selector for the copilot spec drafting feature
- LLM Helper Panel: Omega mode selector for explainable surfaces (kernel runs, orchestrator runs, regression diffs, questions)

**API**:
- `/api/llm/explain`: Accepts `omegaMode` in request body
- `/api/llm/specDraft`: Accepts `omegaMode` in request body

**CLI**:
- `npm run omega <mode> --text "..."` or `--file path`: Run a single mode locally
- `npm run omega:compare --text "..."`: Compare all five modes side-by-side

Mode selection is always explicit—no code infers mode from prompt text or context.

## Provenance: OmegaMeta

Every LLM call with an Omega mode produces `OmegaMeta` that records:
- `mode`: The selected Omega mode (v37, V, B, R, G)
- `audit`: Whether output passed audit (`ok: boolean`) and any violations detected
- `retry`: Whether retry was attempted and whether it repaired violations

`OmegaMeta` flows through:
- `LLMRouter` return values
- API responses (`omegaMeta` field)
- Kernel/Orchestrator runs (when LLM helpers are invoked)
- Artifacts (stored in `ArtifactManifest.omega`)

This enables full provenance tracking: you can see which mode was used, whether output passed audit, and whether retry was needed.

## Freeze Line

Core Omega guarantees are frozen. See [`OMEGA_FREEZE_LINE.md`](./OMEGA_FREEZE_LINE.md) for:
- Non-negotiable guarantees (no autonomy, explicit mode only, modes never blend)
- Frozen core files (high sensitivity)
- Rules for changes (CI guardrails, snapshot acceptance)




































