# Block 16 — Vault Lifecycle Tools: Deprecation, Compatibility Matrix, and Auto-Hygiene — COMPLETE

## Status: ✅ Complete

Block 16 makes the vault scalable and maintainable by adding explicit deprecation rules, compatibility matrix tooling, automatic hygiene jobs, and safe merge/fork workflows.

## Components Implemented

### 1. Deprecation Model (`src/contracts/types/ConceptCard.ts`)

**Status fields:**
- `status: ACTIVE | DEPRECATED | SUPPRESSED`
- `deprecation_reason_code`: SUPERSEDED, FAILED_VALIDATION, TIER4_FAILURES, MANUAL
- `superseded_by`: concept_id@version (if deprecated)
- `suppressed_for_keys`: key fingerprints (if suppressed)

**Retriever rules:**
- Exclude SUPPRESSED always
- Include DEPRECATED only if no ACTIVE matches, with heavy penalty (+1000)
- Prefer ACTIVE concepts first

### 2. Compatibility Matrix (`src/vault/v0/CompatibilityMatrix.ts`)

**Report generation:**
- For each concept_id@version:
  - repr_schema_version
  - dsl_grammar_version
  - last_validated_on
  - status
- Summary: total_concepts, active_count, deprecated_count, suppressed_count

**Output:**
- `reports/compatibility_matrix.json`

### 3. Duplicate Detection (`src/vault/v0/DuplicateDetection.ts`)

**Detection methods:**
- Same signature keys + same template AST
- Same signature keys (near-duplicate)
- Same template AST hash

**Output:**
- `reports/merge_candidates.json`
- No auto-merge, just surfaced candidates

### 4. Hygiene Job (`src/vault/v0/Hygiene.ts`)

**Scans:**
- Schema validity (required fields)
- Hash validity (concept ID format)
- Orphan scan (concepts not indexed)
- Dead concept scan (invalidated_on entries)

**Index rebuilds:**
- Symbolic index
- Evidence index (placeholder)
- Embedding index

**Output:**
- `reports/hygiene_report.json`

### 5. Auto-Deprecation (`src/vault/v0/AutoDeprecation.ts`)

**Rules:**
- Deprecate if fails Tier 2 on ≥X tasks in validated_on set (default: 3)
- Deprecate if accumulates ≥Y Tier 4 failures on same fingerprint (default: 5)

**Configurable:**
- `fail_tier2_threshold`
- `tier4_failure_threshold`

**Audit:**
- All deprecations logged as audit commits

### 6. Hygiene Script (`src/vault/v0/scripts/hygiene.ts`)

**Command:**
```bash
npm run vault:hygiene [-- --vault-root ./vault]
```

**Runs:**
1. Hygiene scans
2. Compatibility matrix generation
3. Merge candidates detection
4. Auto-deprecation application

### 7. Integration

**Write-back:**
- New concepts default to ACTIVE status

**Retriever:**
- Respects ACTIVE/DEPRECATED/SUPPRESSED status
- Heavy penalty for DEPRECATED concepts
- Excludes SUPPRESSED concepts

## Definition of Done

✅ **Vault lifecycle metadata supported** (status, deprecation_reason_code, etc.)  
✅ **Hygiene command exists and passes determinism checks**  
✅ **Compatibility + merge-candidate reports generated**  
✅ **Retrieval respects ACTIVE/DEPRECATED/SUPPRESSED logic**

## Files Created

```
oplas/src/vault/v0/
├── CompatibilityMatrix.ts
├── DuplicateDetection.ts
├── Hygiene.ts
├── AutoDeprecation.ts
└── scripts/
    └── hygiene.ts
```

## Files Modified

```
oplas/src/contracts/types/
└── ConceptCard.ts (added status fields)

oplas/src/vault/v0/
├── Retriever.ts (status-aware retrieval)
├── WriteBack.ts (default ACTIVE status)
└── Storage.ts (already had readAllConcepts)

oplas/package.json (added vault:hygiene script)
```

## Usage

### Run Hygiene Job
```bash
npm run vault:hygiene -- --vault-root ./vault
```

### Generate Reports
```typescript
import { writeCompatibilityMatrix, writeMergeCandidatesReport, writeHygieneReport } from './vault/v0';

await writeCompatibilityMatrix(vaultRoot);
await writeMergeCandidatesReport(vaultRoot);
await writeHygieneReport(vaultRoot);
```

### Apply Auto-Deprecation
```typescript
import { applyAutoDeprecation } from './vault/v0/AutoDeprecation';

const result = await applyAutoDeprecation(vaultRoot, {
  fail_tier2_threshold: 3,
  tier4_failure_threshold: 5
});
```

## Limitations (v0)

- Dead concept scan is simplified (checks invalidated_on, doesn't re-run Tier 2)
- Evidence index rebuild is placeholder (requires loading all evidence)
- Merge candidates are detected but not auto-merged (manual review required)

## Next Steps

**All 16 blocks complete!** The system now has:
- Deterministic parsing and canonicalization
- DSL execution and verification
- Concept vault with retrieval and write-back
- Negative evidence and adaptive scheduling
- Counterexample probing
- Hybrid retrieval
- Vault lifecycle management

The OPLAS system is now feature-complete for the initial scope.























