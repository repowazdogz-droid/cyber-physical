# Block 05 — Executor (DSL v0 Runtime) + Sandbox + Bounded Steps — COMPLETE

## Status: ✅ Complete

Block 05 implements a deterministic executor for DSL v0 programs with sandboxing, bounded execution, and typed error handling.

## Components Implemented

### 1. Executor Types (`src/executor/v0/types.ts`)

- **RuntimeValue**: Value types in runtime (Grid, Mask, ObjSet, Color, CoordRel, CoordAbs, Int, Bool, Repr)
- **ExecErrorCode**: Typed error codes
- **ExecError**: Error structure
- **ExecutionLimits**: Bounds (max_steps, max_cells, max_objs)
- **ExecutionMetrics**: Metrics (runtime_steps, cells_processed, objs_selected)
- **TraceEvent**: Execution trace events
- **ExecutionResult**: Execution result structure
- **RuntimeEnv**: Runtime environment state

### 2. Operator Semantics (`src/executor/v0/operators.ts`)

All 5 operators implemented deterministically:

1. **select_components(repr, predicate) -> ObjSet**
   - Selects components from representation
   - Returns sorted array of node IDs (canonical order)
   - v0: Only true predicate supported

2. **mask_from_objects(repr, objs) -> Mask**
   - Builds boolean grid marking cells belonging to selected components
   - Uses bbox from repr attrs (simplified for v0)

3. **recolor(grid, mask, from?, to) -> Grid**
   - Recolors masked cells
   - Supports optional from color filter

4. **crop_to_bbox(grid, objs|mask) -> Grid**
   - Crops grid to bounding box
   - Supports both ObjSet and Mask inputs
   - Returns typed failure on empty selection

5. **paste_at(base, patch, at) -> Grid**
   - Pastes patch into base at coordinate
   - Resolves relative coordinates (anchor + offsets)
   - Returns typed failure on out-of-bounds

### 3. Executor (`src/executor/v0/Executor.ts`)

- **execute()**: Main execution function
  - Pure function: `execute(program, repr, inputs, seed?, limits?) -> ExecutionResult`
  - No randomness (seed accepted but unused)
  - No filesystem reads (everything in-memory)
  - Bounded execution (enforces limits)
  - Evaluates expressions (Seq, Op, Let, Var, Literal)
  - Emits execution trace and metrics

### 4. Tests (`src/executor/v0/__tests__/executor.test.ts`)

- **Golden tests**: Execute programs on fixture grids
- **Determinism tests**: Repeated execution produces identical outputs
- **Limit tests**: Enforce max_steps limit
- **Failure tests**: Empty selection, out-of-bounds paste, type mismatch, unknown variable
- **Metrics tests**: Verify metrics and trace emission

## Execution Model

- **Pure function**: No side effects beyond provided artifacts
- **Bounded**: max_steps (1000), max_cells (1M), max_objs (10K)
- **Deterministic**: Same inputs → same outputs
- **Sandboxed**: No IO, no filesystem, no network
- **Replayable**: Execution trace enables replay

## Typed Failures

All errors are typed (no exceptions):
- `TYPE_MISMATCH`: Type validation failure
- `UNKNOWN_VAR`: Variable not found
- `INVALID_PREDICATE`: Invalid predicate expression
- `EMPTY_SELECTION`: Empty selection for crop
- `OUT_OF_BOUNDS_PASTE`: Paste would go out of bounds
- `LIMIT_EXCEEDED`: Execution limit exceeded
- `INVALID_INPUT`: Invalid input format

## Execution Trace

Trace events include:
- `step_start`: Step beginning
- `step_end`: Step completion
- `op_call`: Operator call with args types and output type

## Metrics

Execution metrics:
- `runtime_steps`: Number of execution steps
- `cells_processed`: Number of cells processed
- `objs_selected`: Number of objects selected

## Recent Fixes

- Fixed import issues: Added `CoordAbs` and `CoordRel` imports to `operators.ts`
- Fixed `recolor` function call: Corrected argument order in `Executor.ts`
- Improved trace events: Added `step_start` and `step_end` events with proper type inference
- Fixed operator argument handling: Operators now use evaluated arguments from DSL instead of hardcoded `env.repr`
- Added `expr_type` field to `TraceEvent` interface for better observability

## Definition of Done

✅ **execute() runs all 5 ops deterministically**  
✅ **Typed failures work** (no unhandled exceptions)  
✅ **Exec trace + metrics emitted** (step_start, step_end, op_call events)  
✅ **Replayable outputs** with stable hashes  
✅ **Tests pass** (golden, determinism, limits, failures)

## Files Created

```
oplas/src/executor/v0/
├── types.ts
├── operators.ts
├── Executor.ts
├── index.ts
└── __tests__/
    └── executor.test.ts
```

## Usage

```typescript
import { execute } from './src/executor/v0';
import { parseDSL, buildProgram } from './src/dsl/v0';

const source = '(program (seq (recolor grid mask 0 1)))';
const parse = parseDSL(source);
if (parse.ok && parse.ast && parse.declared_frame) {
  const build = buildProgram(parse.ast, parse.declared_frame);
  if (build.ok && build.program) {
    const result = execute(
      build.program,
      repr,
      { grid: gridCells },
      undefined, // seed (unused in v0)
      { max_steps: 1000, max_cells: 1000000, max_objs: 10000 }
    );
    
    if (result.ok) {
      console.log(result.outputs?.grid);
      console.log(result.metrics);
    } else {
      console.error(result.error);
    }
  }
}
```

## Next Steps

**Block 06**: Verifier (tiers + cost + refinement)

