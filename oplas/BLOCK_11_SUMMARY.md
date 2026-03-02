# Block 11 — Stability Pass: Replay with Recorded Model Outputs + Swap Harness + Cost/Quality Dashboard — COMPLETE

## Status: ✅ Complete

Block 11 makes the LLM loop operationally real and scientifically defensible by locking down deterministic replay, model swap testing, cost/latency accounting, and regression suite infrastructure.

## Components Implemented

### 1. Enhanced Model Call Logging (`src/model/v0/types.ts`, `ModelAdapter.ts`)

- **ModelCallLog**: Enhanced with cost/latency/token tracking
  - `request_hash`: Hash of request payload
  - `token_estimates`: Input/output/total token counts
  - `latency_ms`: Latency in milliseconds
  - `cost_usd_est`: Cost estimate in USD

- **logModelCall()**: Updated to accept cost/latency options

- **propose_program()**: Wrapper function with validation and logging
- **repair_program()**: Wrapper function with validation and logging

### 2. Model Response Storage (`src/model/v0/ModelResponseStorage.ts`)

**Policy A: Recorded-Response Replay** (enforced)

Artifact schema:
```
task_<id>/runs/run_<run_id>/llm/
  propose_<n>.request.json
  propose_<n>.response.json
  repair_<n>.request.json
  repair_<n>.response.json
  llm_calls.jsonl (index)
```

- **storeModelCall()**: Stores request/response files and appends to index
- **loadModelCall()**: Loads by request hash from index
- **loadAllModelCalls()**: Loads all calls for a run

### 3. Replay Adapter (`src/model/v0/ReplayAdapter.ts`)

- **ReplayModelAdapter**: Enforces Policy A
  - Throws error if response not found (no fallback to LLM)
  - Uses request_hash for lookup
  - Clear error messages indicating Policy A enforcement

### 4. Swap Harness (`src/harness/v0/SwapHarness.ts`)

**Swap modes:**
- `MODEL_A`: Use model A only
- `MODEL_B`: Use model B only
- `A_THEN_B`: Propose with A, repair with B
- `NO_MODEL`: Fixtures + vault + enumerator (stub adapter)

**Components:**
- **runSuite()**: Runs test suite with specified swap mode
- **SuiteReport**: Aggregate metrics including:
  - `solve_rate`: Pass tiers 0-2
  - `writeback_rate`: Pass tier 3 + wrote concept
  - `avg_cost_usd`, `p95_cost_usd`
  - `avg_latency_ms`
  - `concept_reuse_rate`
  - `negative_evidence_rate`
  - `failure_mode_histogram`

### 5. Regression Suite Infrastructure (`src/harness/v0/RegressionSuite.ts`)

- **loadRegressionSuite()**: Loads suite from directory
- **runRegressionSuite()**: Runs suite and checks for drift
- **RegressionConfig**: Suite configuration with thresholds
- **Drift detection**:
  - Solve rate drop
  - Cost increase
  - Hash changes (winner program IDs)

### 6. Cost/Quality Dashboard (`src/harness/v0/Dashboard.ts`)

**Dashboard format:**
- **JSON**: `reports/latest.json` (full suite report)
- **CSV**: `reports/latest.csv` (one row per task)

**Columns:**
- `task_id`, `mode`, `solved`, `tier3_pass`
- `winner_cost_C`, `tokens`, `cost_usd`, `latency_ms`
- `proposals_used`, `repairs_used`, `vault_hits`
- `negative_evidence_written`, `top_failure_code`

### 7. Determinism Hardening Checks (`src/harness/v0/DeterminismChecks.ts`)

- **checkDeterministicJSON()**: Validates JSON serialization stability
- **checkStableOrdering()**: Validates map/list ordering stability
- **validateCanonicalStability()**: Validates artifact canonical representation
- **documentSeedUsage()**: Documents seed usage for audit

### 8. Regression Suite (`suites/smoke_10/`)

- **config.json**: Suite configuration
- **tasks/**: Task definitions (JSON files)
- Sample task included (`task_001.json`)

### 9. CI-Gated Regression Command (`scripts/run-regression.ts`)

**Usage:**
```bash
npm run regression [suite_name] [mode] [task_root] [reports_dir] [suites_dir]
```

**Features:**
- Loads suite configuration
- Loads baseline report (if exists)
- Runs regression with drift detection
- Writes dashboard reports
- Exits with code 1 if drift detected

## Integration Updates

### Orchestrator (`src/orchestrator/v0/Orchestrator.ts`)

- Updated to accept `TaskRunOptions` parameter
- Tracks model call indices (`proposeCallIndex`, `repairCallIndex`)
- Stores model calls with new artifact schema
- Passes options to refinement loop

## Definition of Done

✅ **Replay with recorded LLM outputs is byte-identical** (Policy A enforced)  
✅ **Swap harness produces report.json for all modes**  
✅ **At least one suite (smoke_10) runs end-to-end**  
✅ **Report captures cost + solve metrics**  
✅ **Regression run can be CI-gated** (one command)

## Files Created

```
oplas/src/harness/v0/
├── SwapHarness.ts
├── RegressionSuite.ts
├── Dashboard.ts
├── DeterminismChecks.ts
└── index.ts

oplas/suites/
└── smoke_10/
    ├── config.json
    └── tasks/
        └── task_001.json

oplas/scripts/
└── run-regression.ts
```

## Files Modified

```
oplas/src/model/v0/
├── types.ts (enhanced ModelCallLog)
├── ModelAdapter.ts (added propose_program/repair_program wrappers)
├── ModelResponseStorage.ts (new artifact schema)
└── ReplayAdapter.ts (Policy A enforcement)

oplas/src/orchestrator/v0/
└── Orchestrator.ts (call index tracking, TaskRunOptions)

oplas/package.json (added regression script)
```

## Usage Examples

### Run Regression Suite
```bash
npm run regression smoke_10 NO_MODEL
```

### Run with Model A
```bash
npm run regression smoke_10 MODEL_A
```

### Check for Drift
```bash
npm run regression smoke_10 NO_MODEL
# Exits with code 1 if drift detected
```

## Next Steps

**Block 12**: Counterexample / Invariance Probing Rules























