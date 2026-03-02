# Block 10 — LLM Adapter v0 (Propose + Repair) + Bounded Refinement Loop — COMPLETE

## Status: ✅ Complete

Block 10 implements an LLM adapter as a disposable proposer/repairer behind a strict JSON schema, with bounded refinement loops and deterministic selection.

## Components Implemented

### 1. Model Adapter Types (`src/model/v0/types.ts`)

- **ProposeProgramInput/Output**: Input/output types for propose_program
- **RepairProgramInput/Output**: Input/output types for repair_program
- **AnnotateInput/Output**: Input/output types for annotate (optional)
- **ModelCallLog**: Log entry for model calls
- **ConceptShortlistEntry**: Entry in concept shortlist

### 2. Model Adapter (`src/model/v0/ModelAdapter.ts`)

- **IModelAdapter**: Interface for model adapters
- **validateProposeOutput()**: Validates propose output against JSON schema
- **validateRepairOutput()**: Validates repair output against JSON schema
- **logModelCall()**: Logs model call with prompt/response hashes
- **propose_program()**: Wrapper with validation and logging
- **repair_program()**: Wrapper with validation

### 3. Stub Adapter (`src/model/v0/StubAdapter.ts`)

- **StubModelAdapter**: Stub implementation for testing
- Returns known programs for testing
- Supports caching responses by input hash

### 4. Replay Adapter (`src/model/v0/ReplayAdapter.ts`)

- **ReplayModelAdapter**: Replay adapter using stored responses
- Loads responses from model_calls directory
- Throws error if response not found (enforces deterministic replay)

### 5. Model Response Storage (`src/model/v0/ModelResponseStorage.ts`)

- **storeModelCall()**: Stores model call log to disk
- **loadModelCall()**: Loads model call log by prompt hash
- **loadAllModelCalls()**: Loads all model calls for a run

### 6. Refinement Loop (`src/model/v0/RefinementLoop.ts`)

- **runRefinementLoop()**: Bounded refinement loop
  - Picks top 3 "closest-to-pass" failures
  - Max 6 iterations (configurable)
  - Calls repair_program() for each failure
  - Evaluates patched program
  - Stops early if passes tiers 0-2

### 7. Orchestrator Integration (`src/orchestrator/v0/Orchestrator.ts`)

- Updated `runTask()` to accept `TaskRunOptions`:
  - `vaultRoot`: Vault root directory
  - `modelAdapter`: Model adapter instance
  - `enableRefinement`: Enable refinement loop
  - `maxRefinementIterations`: Max iterations (default 6)
- Model propose integration:
  - Calls propose_program() after vault retrieval
  - Validates and parses proposed programs
  - Stores model call logs
- Refinement loop integration:
  - Runs after initial evaluation if no winner
  - Uses top 3 failures
  - Bounded by max iterations

### 8. Tests (`src/model/v0/__tests__/model.test.ts`)

- Schema validation tests
- Stub adapter tests
- propose_program wrapper tests

## Model Interface

### propose_program()

**Input**:
- `request.json` (typed)
- `repr.json` (canonical)
- `concept_shortlist` (concept ids + templates + signatures)
- `budgets` (max candidates, max tokens)

**Output Schema**:
```json
{
  "candidates": [
    {
      "dsl": "(seq ...)",
      "expected_invariants": ["..."],
      "rationale_tags": ["..."]
    }
  ],
  "temperature_id": "low|med|high"
}
```

### repair_program()

**Input**:
- Failure trace (verifier jsonl summarized)
- repr
- Prior program (dsl + ast metrics)

**Output Schema**:
```json
{
  "dsl_patch": "(seq ...)" | null,
  "dsl_full": "(seq ...)" | null
}
```

**Rule**: Either patch or full; patch preferred.

## Safety + Determinism Rules

- **Schema Validation**: All model outputs validated against JSON schema
- **DSL Parse + Frame Validation**: Programs parsed and validated before execution
- **Model Call Logging**: All calls logged with:
  - model_id
  - prompt_hash
  - response_hash
  - response (stored for replay)
- **Replay Mode**: Uses stored model responses for deterministic replay

## Orchestrator Integration

**Candidate Sources**:
1. Fixtures
2. Vault-instantiated programs
3. Model-proposed programs

**Evaluation Loop**:
1. Retrieve concepts (Block 08)
2. Instantiate + evaluate
3. Call propose_program() for N proposals (bounded)
4. Evaluate proposals
5. Select winner by: pass tiers 0-2, lowest C(program)

**Refinement Loop** (bounded):
- Pick top 3 "closest-to-pass" failures
- Max 6 iterations:
  - Call repair_program()
  - Evaluate patched program
  - Stop early if passes tiers 0-2

## Definition of Done

✅ **ModelAdapter implemented** with schema-validated IO  
✅ **Orchestrator can run propose** + bounded repair loop  
✅ **All runs are replayable** using stored model outputs  
✅ **Verifier remains sole selector**; vault write-back gated by Tier 3

## Files Created

```
oplas/src/model/v0/
├── types.ts
├── ModelAdapter.ts
├── StubAdapter.ts
├── ReplayAdapter.ts
├── ModelResponseStorage.ts
├── RefinementLoop.ts
├── index.ts
└── __tests__/
    └── model.test.ts
```

## Files Modified

```
oplas/src/orchestrator/v0/
├── Orchestrator.ts (integrated model propose + refinement)
└── types.ts (added TaskRunOptions)
```

## Usage

### Run Task with Model Adapter
```typescript
import { StubModelAdapter } from './src/model/v0';
import { runTask } from './src/orchestrator/v0/Orchestrator';

const modelAdapter = new StubModelAdapter();
const summary = await runTask(
  request,
  candidatePrograms,
  inputs,
  taskRoot,
  {
    modelAdapter,
    enableRefinement: true,
    maxRefinementIterations: 6
  }
);
```

### Replay Task
```typescript
import { ReplayModelAdapter } from './src/model/v0';

const replayAdapter = new ReplayModelAdapter(taskRoot, taskId, runId);
const summary = await runTask(
  request,
  [],
  inputs,
  taskRoot,
  {
    modelAdapter: replayAdapter,
    enableRefinement: false
  }
);
```

## Next Steps

**Block 11**: Minimality + Complexity Anti-Pattern Detection























