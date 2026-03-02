# Block 08 — Concept Vault v0 (Schema + Index + Retrieval + Write-Back) + Negative Evidence — COMPLETE

## Status: ✅ Complete

Block 08 implements a concept vault system that enables structural learning by persisting reusable, versioned concept cards and retrieving them sublinearly.

## Components Implemented

### 1. Vault Types (`src/vault/v0/types.ts`)

- **ConceptRetrievalResult**: Result of concept retrieval
- **ConceptInstantiationResult**: Result of concept instantiation
- **NegativeEvidence**: Negative evidence record
- **AuditCommit**: Audit log entry

### 2. Signature Keys (`src/vault/v0/SignatureKeys.ts`)

- **signatureKeys()**: Extracts deterministic keys from concept cards
  - Domain keys
  - Transform keys (recolor, crop, select, mask, paste)
  - Invariant keys (from proof obligations)
- **reprKeys()**: Extracts keys from repr and request
  - Domain keys
  - Feature keys (has_symmetry, has_components, has_adjacency, etc.)
  - Invariant keys (from constraints)

### 3. Index (`src/vault/v0/Index.ts`)

- **buildIndex()**: Builds index from concept cards
  - By key: Maps keys to concept IDs
  - By domain: Maps domains to concept IDs
- **writeIndex()**: Writes index to disk
- **readIndex()**: Reads index from disk

### 4. Retriever (`src/vault/v0/Retriever.ts`)

- **retrieveConcepts()**: Retrieves concepts using deterministic index lookup
  - Algorithm:
    1. Compute repr keys
    2. Intersect index buckets for top N keys (N=3)
    3. Union candidate concept IDs
    4. Rank by: key_overlap_count desc, version desc, lexicographic
  - Returns top K concepts (default 50)

### 5. Instantiator (`src/vault/v0/Instantiator.ts`)

- **instantiateConcept()**: Instantiates concept template to concrete program
  - Simple parameter substitution (v0)
  - Extracts colors from repr
  - Replaces parameter placeholders
  - Parses and builds program

### 6. Storage (`src/vault/v0/Storage.ts`)

- **writeConcept()**: Writes concept card to vault
- **readConcept()**: Reads concept card from vault
- **writeNegativeEvidence()**: Writes negative evidence record
- **readNegativeEvidence()**: Reads negative evidence for a concept
- **appendAuditCommit()**: Appends audit commit to audit log
- **readAuditLog()**: Reads audit log

### 7. Write-Back (`src/vault/v0/WriteBack.ts`)

- **isEligibleForWriteBack()**: Checks if program is eligible
  - Must pass tiers 0-2
  - Level-0 invariance checks (optional, not implemented yet)
- **createConceptCard()**: Creates concept card from program and verification result
- **writeBackConcept()**: Writes back concept card to vault
- **forkConceptVersion()**: Forks concept to new version

### 8. Orchestrator Integration (`src/orchestrator/v0/Orchestrator.ts`)

- Updated `runTask()` to support vault:
  - Retrieves concepts from vault (if vaultRoot provided)
  - Instantiates concepts to programs
  - Records retrieval events in run_trace
  - Writes back eligible concepts
  - Writes negative evidence for failed concepts

### 9. Tests (`src/vault/v0/__tests__/vault.test.ts`)

- Signature keys tests
- Index build/read/write tests
- Storage tests (concept, negative evidence, audit log)
- Write-back eligibility tests

## Vault Storage Layout

```
vault/
  index/
    by_domain/<domain>.json
    by_key/<key>/<concept_id@version>.json
  concepts/
    <concept_id>/<version>.yaml
  evidence/
    negative/<concept_id>/<timestamp>_<repr_id>.json
  audit/
    commits.jsonl
```

All writes are append-only. Updates = new version + audit entry.

## Signature Keys (v0)

Keys extracted deterministically:
- **Domain keys**: `domain:grid_2d`
- **Transform keys**: `transform:recolor`, `transform:crop`, `transform:select`, `transform:mask`, `transform:paste`
- **Invariant keys**: `invariant:same_dims`, `invariant:palette_preserved`, `invariant:shape_preserved`
- **Feature keys**: `feature:has_symmetry`, `feature:has_components`, `feature:has_adjacency`, `feature:has_containment`, `feature:has_alignment`

## Retrieval Algorithm

Deterministic, sublinear retrieval:
1. Compute `reprKeys(repr, request)`
2. Intersect index buckets for top N keys (N=3)
3. Union candidate concept IDs
4. Rank by:
   - Key overlap count (descending)
   - Concept version (descending)
   - Lexicographic (id, version)
5. Return top K (default 50)

## Write-Back Rules

Write-back only occurs when:
- Candidate program passes verifier tiers 0-2
- AND (if enabled) passes Level-0 invariance checks (not implemented yet)

Write-back includes:
- Concept card YAML
- Provenance updated (introduced_by, validated_on)
- Compatibility fields set (repr schema hash + dsl grammar hash)
- Audit commit appended

## Negative Evidence

If a concept was retrieved + instantiated but failed verification:
- Write negative evidence record:
  - concept_id@version
  - repr_id
  - failure tier + why code
  - trace_id
- Used to down-rank concept next time on similar repr keys (not implemented yet)

## Conflict Semantics

- If concept card must change: fork to `version+1`
- Never overwrite older versions
- Deprecation is annotation + audit log entry

## Definition of Done

✅ **Vault folder structure exists** and is used  
✅ **Index builder + retriever implemented**  
✅ **Orchestrator can load concepts**, instantiate to programs, evaluate  
✅ **Strict write-back + negative evidence works**  
✅ **Replay stays byte-identical** (vault reads don't break determinism)

## Files Created

```
oplas/src/vault/v0/
├── types.ts
├── SignatureKeys.ts
├── Index.ts
├── Retriever.ts
├── Instantiator.ts
├── Storage.ts
├── WriteBack.ts
├── index.ts
└── __tests__/
    └── vault.test.ts
```

## Usage

### Build Index
```typescript
import { buildIndex, writeIndex } from './src/vault/v0';

const concepts = [...]; // Load concept cards
const index = buildIndex(concepts);
await writeIndex(index, vaultRoot);
```

### Retrieve Concepts
```typescript
import { retrieveConcepts } from './src/vault/v0';

const retrieval = await retrieveConcepts(repr, request, vaultRoot, 50);
```

### Instantiate Concept
```typescript
import { instantiateConcept } from './src/vault/v0';

const instantiation = instantiateConcept(concept, repr, request);
if (instantiation.ok && instantiation.program) {
  // Use instantiation.program
}
```

### Write-Back Concept
```typescript
import { writeBackConcept, createConceptCard } from './src/vault/v0';

if (isEligibleForWriteBack(verifier_result)) {
  const concept = createConceptCard(program, verifier_result, repr, request, task_id);
  await writeBackConcept(vaultRoot, concept, task_id);
}
```

## Next Steps

**Block 09**: Concept Vault (retrieval + indexing) - May need refinement for negative evidence ranking























