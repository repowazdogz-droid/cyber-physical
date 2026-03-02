# Block 07 — Orchestrator v0 + Run Loop + Budgets + Artifact Emission — COMPLETE

## Status: ✅ Complete

Block 07 implements a single, repeatable pipeline that runs tasks end-to-end with budgets, evaluates candidate programs, selects survivors, and writes artifact bundles.

## Components Implemented

### 1. Orchestrator Types (`src/orchestrator/v0/types.ts`)

- **CandidateResult**: Result of evaluating a candidate program
- **RunEvent**: Run-level events (candidate_evaluated, candidate_rejected, etc.)
- **RunSummary**: Complete run summary with winner/failure
- **TaskRunInputs**: Inputs for task run

### 2. Candidate Evaluator (`src/orchestrator/v0/CandidateEvaluator.ts`)

- **evaluateCandidate()**: Evaluates a single candidate program
  - Executes program
  - Verifies program (tiers 0-2)
  - Computes trace ID
  - Returns complete candidate result

### 3. Selector (`src/orchestrator/v0/Selector.ts`)

- **selectWinner()**: Deterministic selection logic
  - Filters eligible candidates (pass tiers 0-2)
  - Selects winner by lowest cost
  - Tie-break: lower N_literals → lower N_params → lexicographic program_id
  - Returns closest-to-pass if no eligible

### 4. Artifact Writer (`src/orchestrator/v0/ArtifactWriter.ts`)

- **writeTaskBundle()**: Writes complete task bundle
  - `task_<id>/request.json`
  - `task_<id>/inputs/grid.json`
  - `task_<id>/repr.json` + `repr.sha256`
  - `task_<id>/runs/run_<run_id>/candidates/<program_id>/` (program.dsl, program.json, exec_trace.jsonl, output_grid.json, verifier_trace.jsonl, cost.json)
  - `task_<id>/runs/run_<run_id>/winner.json` or `failure.json`
  - `task_<id>/runs/run_<run_id>/run_trace.jsonl`
  - `task_<id>/runs/run_<run_id>/summary.json`

### 5. Fixtures Runner (`src/orchestrator/v0/FixturesRunner.ts`)

- **loadProgramsFromFixtures()**: Loads DSL programs from fixtures directory
  - Reads all `.txt` files
  - Parses and builds programs
  - Returns array of valid programs

### 6. Orchestrator (`src/orchestrator/v0/Orchestrator.ts`)

- **runTask()**: Main orchestrator function
  - Parses input grid → repr
  - Evaluates candidates (with budget enforcement)
  - Selects winner
  - Writes artifact bundle
  - Returns run summary

### 7. Replay (`src/orchestrator/v0/Replay.ts`)

- **replayTask()**: Replays a task run deterministically
  - Loads request, inputs, candidates from task bundle
  - Re-runs task
  - Compares results (ignoring run_id and timestamps)
  - Fails loudly on any byte difference

### 8. Scripts

- **run-task.ts**: CLI script to run a task
- **replay-task-orchestrator.ts**: CLI script to replay a task

### 9. Tests (`src/orchestrator/v0/__tests__/orchestrator.test.ts`)

- Fixtures runner tests
- Task run end-to-end tests
- Budget enforcement tests
- Deterministic replay tests
- Selection determinism tests

## Budget Enforcement

Enforces BudgetSpec:
- **max_proposals**: Maximum candidates evaluated
- **max_wall_ms**: Maximum wall-clock time
- **max_runtime_steps**: Per-candidate and overall (enforced by executor)

Orchestrator stops evaluating when budget exhausted and records typed failure artifact.

## Selection Logic

Deterministic selection:
1. Filter eligible candidates (pass tiers 0-2)
2. Sort by cost (ascending)
3. Tie-break: lower N_literals → lower N_params → lexicographic program_id
4. If no eligible: return closest-to-pass (highest tier + lowest cost)

## Artifact Bundle Structure

```
task_<id>/
  request.json
  inputs/
    grid.json
    example_0_input.json (if examples)
    example_0_expected.json (if examples)
  repr.json
  repr.sha256
  runs/
    run_<run_id>/
      candidates/
        <program_id>/
          program.dsl
          program.json
          exec_trace.jsonl
          output_grid.json (if ok)
          verifier_trace.jsonl
          cost.json
      winner.json (or failure.json)
      run_trace.jsonl
      summary.json
```

## Run-Level Events

Structured events:
- `candidate_evaluated`: Candidate evaluated
- `candidate_rejected`: Candidate rejected (with why)
- `candidate_eligible`: Candidate passed tiers 0-2
- `winner_selected`: Winner selected (with cost breakdown)
- `budget_exhausted`: Budget limit reached
- `run_failed`: No eligible candidates

## Replay Contract

`replayTask()` must:
- Re-run evaluation on same candidate set
- Reproduce identical winner/failure
- Reproduce identical hashes for repr/program/trace/output
- Fail loudly if any byte differs

## Definition of Done

✅ **runTask() works end-to-end** with explicit candidate set  
✅ **Deterministic selection** + artifact bundle written  
✅ **Replay passes** byte-equality  
✅ **Budgets enforced** with typed failure outputs

## Files Created

```
oplas/src/orchestrator/v0/
├── types.ts
├── CandidateEvaluator.ts
├── Selector.ts
├── ArtifactWriter.ts
├── FixturesRunner.ts
├── Orchestrator.ts
├── Replay.ts
├── index.ts
└── __tests__/
    └── orchestrator.test.ts

oplas/scripts/
├── run-task.ts
└── replay-task-orchestrator.ts
```

## Usage

### Run Task
```bash
cd plas
npm run run-task <task_id> [fixtures_dir] [task_root]
```

### Replay Task
```bash
npm run replay-task <task_id> [task_root]
```

## Next Steps

**Block 08**: Artifacts + Storage Layout (content addressing + versioning) - Already partially done, may need refinement























