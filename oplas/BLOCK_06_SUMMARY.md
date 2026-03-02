# Block 06 — Verifier Tiers 0–2 + Cost Extraction + Refinement Hook — COMPLETE

## Status: ✅ Complete

Block 06 implements a deterministic verifier that validates programs through tiers 0-2, extracts cost metrics, and provides refinement hooks.

## Components Implemented

### 1. Verifier Types (`src/verifier/v0/types.ts`)

- **VerifierResult**: Result structure with tier passed, why failed, cost breakdown, metrics
- **VerifierTraceEvent**: Structured trace events (JSONL format)
- **Example**: Input/output examples for Tier 2
- **VerifierContext**: Context for verification

### 2. Cost Extractor (`src/verifier/v0/CostExtractor.ts`)

- **extractCost()**: Extracts cost metrics from AST + exec metrics
- Computes: N_nodes, N_ops, N_params, N_literals, abs_coord_refs, color_binding_literals
- Cost function: `C = 5*N_ops + 2*N_nodes + 3*N_params + 4*N_literals + 1*runtime_steps + 20*abs_coord_refs + 8*color_binding_literals`

### 3. Tier 0 (`src/verifier/v0/Tier0.ts`)

- **validateTier0()**: Schema + type checks
- Validates repr schema
- Validates program frame rules
- Validates execution result
- Validates output grid schema

### 4. Tier 1 (`src/verifier/v0/Tier1.ts`)

- **validateTier1()**: Hard invariants
- Output grid must be rectangular
- Cell values must be integers
- Enforces constraints:
  - `fixed_dims`: Fixed dimensions
  - `same_dims`: Same dimensions as input
  - `palette_preserved`: Output colors subset of input colors

### 5. Tier 2 (`src/verifier/v0/Tier2.ts`)

- **validateTier2()**: Example consistency
- For each example:
  - Parse + canonicalize input → repr
  - Execute program
  - Compare output to expected exactly
- Returns examples_passed and examples_failed counts

### 6. Main Verifier (`src/verifier/v0/Verifier.ts`)

- **verify()**: Main verification function
  - Runs tiers 0-2 sequentially
  - Stops at first failure
  - Returns highest tier passed
  - Includes cost breakdown and metrics
- **extractRefinementInfo()**: Extracts refinement info for future LLM integration

### 7. Trace Writer (`src/verifier/v0/TraceWriter.ts`)

- **writeTrace()**: Writes trace events to JSONL string
- **readTrace()**: Reads trace events from JSONL string

### 8. Tests (`src/verifier/v0/__tests__/verifier.test.ts`)

- Tier 0 tests (valid program, invalid output)
- Tier 1 tests (constraints)
- Tier 2 tests (example consistency)
- Cost extraction tests
- Determinism tests
- Refinement hook tests

## Tier Definitions

### Tier 0 — Schema + Type Checks
- Validates request, repr, program schemas
- Validates executor output schema
- Validates program frame rules

Fail codes: `SCHEMA_INVALID`, `PROGRAM_INVALID`, `OUTPUT_INVALID`, `RUNTIME_ERROR`

### Tier 1 — Hard Invariants
- Output grid must be rectangular
- Cell values must be integers
- Enforces dimension constraints
- Enforces palette preservation

Fail codes: `SHAPE_MISMATCH`, `TYPE_MISMATCH`, `DIM_MISMATCH`, `PALETTE_VIOLATED`

### Tier 2 — Example Consistency
- Validates each example:
  - Parse input → repr
  - Execute program
  - Compare output to expected

Fail codes: `EXAMPLE_FAILED`, `EXAMPLE_MISMATCH`, `EXEC_ERROR`

## Cost Extraction

Metrics extracted:
- `N_nodes`: AST node count
- `N_ops`: Operation count
- `N_params`: Parameter count (let bindings)
- `N_literals`: Literal count
- `abs_coord_refs`: Absolute coordinate references
- `color_binding_literals`: Color literal count
- `runtime_steps`: From exec metrics

Cost function:
```
C = 5*N_ops + 2*N_nodes + 3*N_params + 4*N_literals + 1*runtime_steps + 20*abs_coord_refs + 8*color_binding_literals
```

## Trace Events

Structured JSONL events:
- `tier_start` / `tier_end`
- `example_start` / `example_end` (Tier 2)
- `failure` events with why code + details
- `cost` events with breakdown

## Refinement Hook

Interface for future LLM integration:
- `highest_tier_reached`: Highest tier that passed
- `diff_size`: Cells mismatched (for Tier 2)
- `exec_error_code`: Exec error code if present
- `failure_details`: Structured failure details

## Definition of Done

✅ **Tiers 0-2 implemented** and passing tests  
✅ **Verifier trace conforms** to contract types  
✅ **Cost breakdown computed** and logged  
✅ **Can validate correctness** without any LLM  
✅ **Refinement hook** interface provided

## Files Created

```
oplas/src/verifier/v0/
├── types.ts
├── CostExtractor.ts
├── Tier0.ts
├── Tier1.ts
├── Tier2.ts
├── Verifier.ts
├── TraceWriter.ts
├── index.ts
└── __tests__/
    └── verifier.test.ts
```

## Usage

```typescript
import { verify } from './src/verifier/v0';

const context: VerifierContext = {
  request,
  repr,
  program,
  exec_result,
  examples
};

const result = verify(context);

if (result.ok) {
  console.log(`Passed tier ${result.highest_tier_passed}`);
  console.log(`Cost: ${result.cost_breakdown.total_cost}`);
} else {
  console.error(`Failed at tier ${result.highest_tier_passed}`);
  console.error(`Why: ${result.why_failed}`);
}
```

## Next Steps

**Block 07**: Orchestrator integration (DAG + budgets + replay)























