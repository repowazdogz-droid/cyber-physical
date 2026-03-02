# Block 15 — Hybrid Retrieval v1 (Symbolic Index + Learned Embedding Tie-Break) with Rollback — COMPLETE

## Status: ✅ Complete

Block 15 improves retrieval quality and efficiency as vault grows by adding learned embeddings for re-ranking within a symbolic shortlist, with strict determinism, caching, and rollback capability.

## Components Implemented

### 1. Embedder Module (`src/vault/v0/Embedder.ts`)

**Deterministic embedding:**
- Embeds canonical summary vector from repr:
  - Domain, grid dims, component count
  - Sorted component features (bbox, area, color hist)
  - Adjacency stats, symmetry flags
- Embeds concept cards:
  - Signature keys (one-hot)
  - Template metadata (length, operator counts)
  - Proof obligations

**Quantization:**
- Embeddings quantized to int8 for determinism/caching
- Fixed dimension: 64 (v0)

**Functions:**
- **embedRepr()**: Embeds representation deterministically
- **embedConcept()**: Embeds concept card deterministically
- **cosineSimilarity()**: Deterministic similarity computation
- **quantizeEmbedding() / dequantizeEmbedding()**: Quantization utilities

### 2. Embedding Index (`src/vault/v0/EmbeddingIndex.ts`)

**Storage:**
- `vault/embeddings/embedder.json`: Version, weights hash, dimension
- `vault/embeddings/concept_vectors.jsonl`: Concept ID → quantized vector
- `vault/embeddings/ann.index.sha256`: Index hash

**Functions:**
- **buildEmbeddingIndex()**: Builds index from concept cards
- **readEmbeddingIndex()**: Reads index from disk
- **computeSimilarities()**: Computes similarity scores (brute-force for v0)

### 3. Embedding Cache (`src/vault/v0/EmbeddingCache.ts`)

**Caching:**
- Cache key: `repr_id:embedder_version:weights_hash`
- Cache path: `vault/embeddings/cache/<hash>.json`
- Per repr_id, per embedder version

**Functions:**
- **getCachedEmbedding()**: Gets cached embedding
- **cacheEmbedding()**: Caches embedding
- **getOrComputeEmbedding()**: Gets or computes with caching

### 4. Hybrid Retrieval (`src/vault/v0/Retriever.ts`)

**Retrieval modes:**
- **SYMBOLIC_ONLY**: Symbolic keys only (default, deterministic)
- **HYBRID**: Symbolic + learned embedding tie-break

**Hybrid algorithm:**
1. Symbolic retrieval gives shortlist S (10-200)
2. Compute repr embedding (cached by repr_id)
3. Score each concept in S by cosine similarity
4. Re-rank by:
   - Primary: key_overlap_count desc
   - Secondary: penalty P asc
   - Tertiary: similarity desc (NEW, if HYBRID)
   - Quaternary: concept_version desc
   - Quinary: lexicographic

**Rollback:**
- Falls back to SYMBOLIC_ONLY if:
  - Embedding index not available
  - Error during embedding computation
  - Nondeterminism detected

### 5. Integration

**Orchestrator:**
- TaskRunOptions includes `retrievalMode`
- Default: SYMBOLIC_ONLY
- Can be set to HYBRID for evaluation

**Write-back:**
- Rebuilds embedding index after write-back (async, non-blocking)
- Index includes all concepts in vault

**Types:**
- Added `RetrievalMode` enum
- `ConceptRetrievalResult` includes `similarities` and `retrieval_mode`

## Guardrails (Non-Negotiable)

✅ **Symbolic keys remain primary filter**  
✅ **Embeddings only re-rank within bounded shortlist**  
✅ **Deterministic given repr_id, vault snapshot hash, embedder version**  
✅ **Rollback flag works instantly**  
✅ **Sublinear retrieval preserved**  
✅ **Write-back safety maintained**

## Determinism Enforcement

- Quantized embeddings (int8) before storage
- Fixed similarity computation (no nondeterministic BLAS)
- Cache per repr_id, per embedder version
- Fallback to SYMBOLIC_ONLY on any error

## Definition of Done

✅ **Embedder module + versioned artifacts exist**  
✅ **Hybrid retrieval works and is deterministic with caching**  
✅ **Rollback flag works instantly**  
✅ **Suite report shows measurable improvement OR is safely revertible**

## Files Created

```
oplas/src/vault/v0/
├── Embedder.ts
├── EmbeddingIndex.ts
└── EmbeddingCache.ts
```

## Files Modified

```
oplas/src/vault/v0/
├── types.ts (RetrievalMode enum)
├── Retriever.ts (hybrid retrieval)
├── WriteBack.ts (index rebuilding)
└── Storage.ts (readAllConcepts)

oplas/src/orchestrator/v0/
├── types.ts (retrievalMode option)
└── Orchestrator.ts (pass retrieval mode)
```

## Usage

### Enable Hybrid Retrieval
```typescript
const result = await runTask(
  request,
  candidates,
  inputs,
  taskRoot,
  {
    vaultRoot: './vault',
    retrievalMode: RetrievalMode.HYBRID
  }
);
```

### Build Embedding Index
```typescript
const concepts = await readAllConcepts(vaultRoot);
await buildEmbeddingIndex(concepts, vaultRoot);
```

## Limitations (v0)

- Brute-force similarity computation (no ANN library)
- Fixed embedding dimension (64)
- Simple feature extraction (can be enhanced)
- Index rebuild on every write-back (can be optimized)

## Next Steps

**Block 16**: Observability/UI/Ops (Debug Views, Cost Tracking)























