# Block 02 — Contracts + Type System — COMPLETE

## Status: ✅ Complete

Block 02 defines typed boundaries, schemas, and invariants for the OPLAS system.

## Components Implemented

### 1. JSON Schemas (`src/contracts/schemas/`)

- **request.schema.json**: Request structure with domain, inputs, outputs, budgets, run_config
- **repr.schema.json**: Canonical representation structure
- **program.schema.json**: DSL program structure with AST
- **trace.schema.json**: Verifier trace event structure
- **concept_card.schema.json**: Concept card structure

### 2. TypeScript Types (`src/contracts/types/`)

- **Request.ts**: Typed request structure
- **Repr.ts**: Canonical representation types
- **Program.ts**: DSL program and AST types
- **Trace.ts**: Verifier trace event types
- **ConceptCard.ts**: Concept card types
- **ArtifactRef.ts**: Artifact reference types
- **BudgetSpec.ts**: Budget specification types

### 3. Enums (`src/contracts/enums/`)

- **Domains.ts**: Domain enums (grid_2d, text, table, generic_state)
- **ArtifactKinds.ts**: Artifact kind enums
- **VerifierCodes.ts**: Verifier why codes (structured failure reasons)
- **InvariantTags.ts**: Invariant tags (translation, rotation, etc.)
- **DegradationModes.ts**: Degradation mode enums
- **FrameModes.ts**: Coordinate frame modes (RELATIVE, ABSOLUTE)

### 4. Invariants (`src/contracts/invariants/`)

- **CanonicalHashing.ts**: Canonical hashing rules and byte canonicalization policy
- **GlobalInvariants.md**: Documentation of global invariants

### 5. Contract Tests (`src/contracts/tests/`)

- **contract.test.ts**: Tests for:
  - Schema validation
  - Determinism (identical objects → identical hashes)
  - Serialization order independence
  - Stable hash computation
  - Budget finiteness

## Global Invariants

### 1. Determinism
Given identical `request.json` + `input artifacts` + `seed` + `versions`, system produces identical outputs.

### 2. Content Addressing
Every major artifact is content-addressed:
- `repr_id = hash(repr.json canonical bytes)`
- `program_id = hash(program.dsl canonical bytes)`
- `trace_id = hash(verifier_trace.jsonl canonical bytes)`

### 3. No LLM Structural Authority
LLM outputs may only populate schema-validated fields marked `llm_optional`. LLM may never create/modify `repr.json` structure.

### 4. Version Compatibility
All artifacts declare version hashes. Concept cards declare compatible version ranges; orchestrator rejects incompatible cards/programs.

### 5. Budget Enforcement
All budgets must be finite; orchestrator enforces hard caps.

### 6. Degradation Policy
No mode loops infinitely; every run ends with success or typed failure artifact.

## Versioning

All artifacts declare:
- `repr_schema_version` (hash of JSON schema)
- `dsl_grammar_version` (hash of grammar spec)
- `executor_version`
- `verifier_version`
- `vault_schema_version`

## Canonical Hashing Rules

1. JSON keys sorted recursively
2. Arrays: elements in deterministic order
3. Sets: converted to sorted arrays
4. Maps: keys sorted
5. Floats: quantized or disallowed (v0: disallow floats)
6. Whitespace: normalized
7. Unicode: normalized (NFD or NFC)

## Acceptance Criteria

✅ **JSON Schemas written** for: request, repr, program_ast, trace_event, concept_card  
✅ **Canonical hashing rules specified** (byte canonicalization policy)  
✅ **Enum lists defined** for: node/edge types, verifier why-codes, invariant tags  
✅ **Contract test** that:
  - loads a sample request
  - validates schema
  - validates determinism properties on serialization order
  - computes stable hashes twice and matches

## Files Created

```
oplas/src/contracts/
├── README.md
├── index.ts
├── enums/
│   ├── Domains.ts
│   ├── ArtifactKinds.ts
│   ├── VerifierCodes.ts
│   ├── InvariantTags.ts
│   ├── DegradationModes.ts
│   └── FrameModes.ts
├── types/
│   ├── Request.ts
│   ├── Repr.ts
│   ├── Program.ts
│   ├── Trace.ts
│   ├── ConceptCard.ts
│   ├── ArtifactRef.ts
│   └── BudgetSpec.ts
├── schemas/
│   ├── request.schema.json
│   ├── repr.schema.json
│   ├── program.schema.json
│   ├── trace.schema.json
│   └── concept_card.schema.json
├── invariants/
│   ├── CanonicalHashing.ts
│   └── GlobalInvariants.md
└── tests/
    └── contract.test.ts
```

## Usage

### Run Contract Tests
```bash
cd plas
npm install
npm run test:contracts
```

### Type Checking
```bash
npm run typecheck
```

## Integration

- Uses spine's `hashArtifact` for canonical hashing
- TypeScript types match JSON schemas
- All enums documented and typed
- Contract tests verify determinism and schema validation

## Next Steps

**Block 03**: Representation spec + canonicalizer (update Gate 1a canonicalizer to use new types)























