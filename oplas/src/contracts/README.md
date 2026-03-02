# OPLAS Contracts & Type System

**Block 02**: Freeze typed boundaries for swappable components, determinism enforcement, and artifact replayability.

## Purpose

Define schemas + invariants (not implementation) so:
- Components remain swappable (including LLMs)
- Determinism is enforceable
- Artifacts are replayable
- Future DSL/solvers/vault additions don't break old runs

## Structure

- **schemas/**: JSON Schema definitions
- **types/**: TypeScript type definitions
- **enums/**: Enum definitions
- **invariants/**: Invariant documentation and checks
- **tests/**: Contract tests

## Global Invariants

1. **Determinism**: Identical inputs → identical outputs
2. **Content Addressing**: All artifacts content-addressed by hash
3. **No LLM Structural Authority**: LLM only populates `llm_optional` fields

## Versioning

All artifacts declare:
- `repr_schema_version` (hash of JSON schema)
- `dsl_grammar_version` (hash of grammar spec)
- `executor_version`
- `verifier_version`
- `vault_schema_version`

Compatibility: Concept cards declare compatible version ranges; orchestrator rejects incompatible cards/programs.























