# Block 03 — Representation Spec + Deterministic Parser + Canonicalizer — COMPLETE

## Status: ✅ Complete

Block 03 implements Gate 1a foundation end-to-end: raw input → deterministic parse → canonicalize → stable repr hash → schema validate → store → manual replay.

## Components Implemented

### 1. Grid 2D Domain (`src/domains/grid_2d/`)

- **types.ts**: Grid 2D domain types (RawGridInput, ComponentAttributes, GridMetadata)
- **Parser.ts**: Deterministic parser for grid_2d
  - Validates raw grid (rejects floats, ragged rows, out-of-bounds)
  - Computes connected components (4-neighborhood)
  - Computes component attributes (bbox, area, centroid, color histogram, perimeter)
  - Computes relations (adjacency, containment, alignment)
- **Canonicalizer.ts**: Grid 2D canonicalizer with stable sort keys
  - Node ordering: (type_ordinal, bbox.y_min, bbox.x_min, area, color_histogram_lex, bbox.y_max, bbox.x_max)
  - Edge ordering: (src, type, dst, attrs_lex)
  - Attribute normalization (sorted keys, normalized arrays)
- **Pipeline.ts**: End-to-end pipeline integration

### 2. Storage Layout (`src/storage/`)

- **TaskStorage.ts**: Task storage structure
  - `task_<id>/request.json`
  - `task_<id>/inputs/grid.json`
  - `task_<id>/repr.json`
  - `task_<id>/repr.sha256`
  - `task_<id>/replay.sh`

### 3. Fixtures (`fixtures/grids/`)

- **single_color.json**: Single color fill (3x3)
- **two_separated.json**: Two separated components same color
- **touching_different.json**: Touching components different colors
- **nested_containment.json**: Nested containment case
- **symmetry.json**: Symmetry-like layout

### 4. Scripts

- **run-gate1a-grid.ts**: Runs pipeline on grid fixture
- **replay-task.ts**: Replays stored task (regenerates repr, verifies hash)

### 5. Tests (`src/domains/grid_2d/__tests__/`)

- **grid_2d.test.ts**: Contract tests
  - Parse tests (all fixtures)
  - Canonicalization stability
  - Hash stability
  - Determinism across runs
  - Schema validation

## Determinism Guarantees

✅ **Parser**: Deterministic (no LLM, pure logic, 4-neighborhood DFS)  
✅ **Canonicalizer**: Stable ordering (deterministic sort keys)  
✅ **Hasher**: Content-addressable (canonical JSON → SHA-256)  
✅ **Storage**: Deterministic (content-addressable by hash)  
✅ **Replay**: Deterministic (regenerate → verify hash → validate)

## Node Types (v0)

- `grid`: Singleton grid node
- `component`: Per connected component

## Edge Types (v0)

- `has_component`: grid → component
- `adjacent_to`: component ↔ component (bidirectional)
- `contained_in`: component → component or component → grid
- `aligned_with`: component ↔ component (bidirectional, axis attribute)

## Canonicalization Rules

### Node Ordering Key (grid_2d component)
1. type enum ordinal (grid=0, component=1)
2. bbox.y_min
3. bbox.x_min
4. area
5. color_histogram_lex
6. bbox.y_max
7. bbox.x_max

### Edge Ordering
- Lexicographic: (src, type, dst, attrs_lex)

### Attribute Normalization
- bbox: always ints
- histograms: sorted list of `{color:int,count:int}` (sorted by color)
- sets: sorted arrays
- no floats in v0

## Usage

### Run Gate 1a on Fixture
```bash
cd plas
npm install
npm run gate1a-grid <fixture_name> [task_root]
```

### Replay Stored Task
```bash
npm run replay-task <task_id> [task_root]
```

## Definition of Done

✅ **Grid2DParser implemented** (deterministic)  
✅ **Grid2DCanonicalizer implemented** (stable ordering)  
✅ **repr.json produced** + validates against `repr.schema.json`  
✅ **repr_id stable** across runs and machines  
✅ **Gate 1a manual replay works** on fixtures  
✅ **Contract tests** pass (determinism, hash stability, schema validation)

## Files Created

```
oplas/
├── src/
│   ├── domains/
│   │   └── grid_2d/
│   │       ├── types.ts
│   │       ├── Parser.ts
│   │       ├── Canonicalizer.ts
│   │       ├── Pipeline.ts
│   │       └── __tests__/
│   │           └── grid_2d.test.ts
│   └── storage/
│       └── TaskStorage.ts
├── fixtures/
│   └── grids/
│       ├── single_color.json
│       ├── two_separated.json
│       ├── touching_different.json
│       ├── nested_containment.json
│       └── symmetry.json
└── scripts/
    ├── run-gate1a-grid.ts
    └── replay-task.ts
```

## Next Steps

**Block 04**: DSL spec (grammar + types)























