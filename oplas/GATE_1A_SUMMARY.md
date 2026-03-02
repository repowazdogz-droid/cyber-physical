# Gate 1a — Determinism Foundation — COMPLETE

## Status: ✅ Complete

Gate 1a establishes the deterministic foundation: parse → canonicalize → hash → validate → store → replay.

## Components Implemented

### 1. Core Types (`src/core/ReprTypes.ts`)
- `RawInput`: Raw input structure (simple graph JSON)
- `CanonicalRepresentation`: Canonical graph structure
- `Node`, `Edge`: Graph primitives
- `ParseResult`: Parse result type

### 2. Deterministic Parser (`src/core/Parser.ts`)
- Pure deterministic logic (no LLM)
- Parses raw input → base graph
- Validates bounds (max 1000 nodes, max 5000 edges)
- Assigns temporary IDs (will be canonicalized)

### 3. Canonicalizer (`src/core/Canonicalizer.ts`)
- Normalizes attributes (sets sorted, maps key-sorted)
- Assigns deterministic node IDs (n0, n1, n2, ...)
- Sorts nodes by: `(type, bbox.y_min, bbox.x_min, area, centroid_lex)`
- Sorts edges lexicographically: `(src_id, edge_type, dst_id)`

### 4. Hasher (`src/core/Hasher.ts`)
- Uses spine's `hashArtifact` (canonical JSON + SHA-256)
- Content-addressable: same repr → same hash
- Sets `repr_id` on canonical representation

### 5. Schema Validator (`src/core/SchemaValidator.ts`)
- Tier 0: Schema validation + type checks
- Validates nodes, edges, bbox constraints
- Checks for duplicate IDs, invalid references
- Returns errors + warnings

### 6. Storage (`src/core/Storage.ts`)
- Uses spine's `FsArtifactVault`
- Stores via `ArtifactKind.OPLAS_REPR`
- Retrieves by `repr_id` (content-addressable)

### 7. Pipeline (`src/core/Pipeline.ts`)
- End-to-end: parse → canonicalize → hash → validate → store
- Returns structured result with errors/warnings

### 8. Scripts
- `scripts/run-gate1a.ts`: Runs pipeline on hardcoded example
- `scripts/replay.ts`: Retrieves and validates stored representation

## Example Task

Hardcoded example: 3 nodes (circles, squares) + 2 edges.

```json
{
  "type": "graph",
  "data": {
    "nodes": [
      {"id": "a", "type": "circle", "bbox": {...}, "attrs": {...}},
      {"id": "b", "type": "square", "bbox": {...}, "attrs": {...}},
      {"id": "c", "type": "circle", "bbox": {...}, "attrs": {...}}
    ],
    "edges": [
      {"src": "a", "type": "connects", "dst": "b"},
      {"src": "b", "type": "connects", "dst": "c"}
    ]
  }
}
```

## Usage

### Run Gate 1a
```bash
cd plas
npm install  # Install dependencies (tsx, typescript)
npm run gate1a [vault_root]
```

### Replay Stored Representation
```bash
npm run replay <repr_id> [vault_root]
```

## Determinism Guarantees

✅ **Parser**: Deterministic (no LLM, pure logic)  
✅ **Canonicalizer**: Deterministic ordering (sorted keys, stable IDs)  
✅ **Hasher**: Deterministic (canonical JSON → SHA-256)  
✅ **Validator**: Deterministic (same repr → same validation)  
✅ **Storage**: Deterministic (content-addressable by hash)  
✅ **Replay**: Deterministic (retrieve → verify hash → validate)

## Integration with Spine

- Uses `spine/artifacts/Hashing.ts` for hashing
- Uses `spine/artifacts/FsArtifactVault.ts` for storage
- Uses `spine/artifacts/ArtifactTypes.ts` (added `OPLAS_REPR` kind)
- Follows spine patterns: bounded, deterministic, versioned

## Next Steps

**Gate 1b**: Execution core
- DSL v0 (≤5 operators)
- Executor (pure, bounded, sandboxed)
- Verifier tiers 0-1

## Files Created

```
oplas/
├── README.md
├── package.json
├── tsconfig.json
├── GATE_1A_SUMMARY.md
├── src/
│   └── core/
│       ├── ReprTypes.ts
│       ├── Parser.ts
│       ├── Canonicalizer.ts
│       ├── Hasher.ts
│       ├── SchemaValidator.ts
│       ├── Storage.ts
│       └── Pipeline.ts
└── scripts/
    ├── run-gate1a.ts
    └── replay.ts
```

## Verification

To verify Gate 1a:

1. Run pipeline: `npm run gate1a`
2. Note the `repr_id` from output
3. Replay: `npm run replay <repr_id>`
4. Verify:
   - Hash matches
   - Schema validation passes
   - Representation is canonical (sorted nodes/edges)

## Notes

- Parser version: `1.0.0`
- Representation version: `1.0.0`
- All components are deterministic (no LLM, no randomness)
- Storage uses artifact vault (atomic writes, content-addressable)
- Replay script validates hash + schema























