# Global Invariants

**Non-negotiable rules** that must hold for all OPLAS components.

## 1. Determinism

Given identical:
- `request.json`
- `input artifacts`
- `seed`
- `versions`

The system must produce identical:
- `repr.json` (including ordering)
- verifier results
- executor outputs
- stored artifact hashes

**Enforcement**: All components must be deterministic (no randomness, no time-based logic, no LLM in parse path).

## 2. Content Addressing

Every major artifact is content-addressed:
- `repr_id = hash(repr.json canonical bytes)`
- `program_id = hash(program.dsl canonical bytes)`
- `trace_id = hash(verifier_trace.jsonl canonical bytes)`

**Enforcement**: All artifacts must have content hash; hash must match canonical bytes.

## 3. No LLM Structural Authority

LLM outputs may only populate schema-validated fields explicitly marked `llm_optional`.

LLM may never:
- Create/modify `repr.json` structure
- Define new node/edge types
- Modify schema
- Bypass validation

**Enforcement**: Parser/Canonicalizer are LLM-free; LLM adapter only populates `llm_optional_labels`.

## 4. Version Compatibility

All artifacts declare:
- `repr_schema_version` (hash of JSON schema)
- `dsl_grammar_version` (hash of grammar spec)
- `executor_version`
- `verifier_version`
- `vault_schema_version`

Concept cards declare compatible version ranges; orchestrator rejects incompatible cards/programs.

**Enforcement**: Version checks in orchestrator; incompatible artifacts rejected.

## 5. Budget Enforcement

All budgets must be finite; orchestrator enforces hard caps.

**Enforcement**: Budget checks at every step; failure when exceeded.

## 6. Degradation Policy

No mode loops infinitely; every run ends with success or typed failure artifact.

**Enforcement**: Degradation ladder with hard stops; failure artifact always produced.























