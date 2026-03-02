# Block 09 — Level-0 Invariance Probing + Coordinate Jail (Write-Back Gate) — COMPLETE

## Status: ✅ Complete

Block 09 implements deterministic, cheap generalization pressure via Level-0 invariance tests that gate vault write-back and catch brittle/overfit programs early.

## Components Implemented

### 1. Invariance Tests (`src/verifier/v0/InvarianceTests.ts`)

- **testPalettePermutation()**: Tests palette permutation invariance
  - Generates deterministic permutation from repr_id
  - Applies permutation to input and expected output
  - Runs program on permuted input
  - Compares output to permuted expected output
- **testTranslationInvariance()**: Tests translation invariance
  - Pads grid with background color
  - Translates content deterministically from repr_id
  - Runs program on translated input
  - Compares output to translated expected output
  - Only runs for RELATIVE programs without absolute coords

### 2. Tier 3 (`src/verifier/v0/Tier3.ts`)

- **validateTier3()**: Validates Level-0 invariance tests
  - Runs palette permutation test (always, if examples exist)
  - Runs translation invariance test (only if eligible)
  - Returns tier 3 result with pass/fail status
  - Records trace events for observability

### 3. Verifier Integration (`src/verifier/v0/Verifier.ts`)

- Updated `verify()` to run Tier 3 after Tier 2
- Tier 3 doesn't block success (tiers 0-2 still determine winner)
- Tier 3 results included in `VerifierResult.tier3_result`
- Trace events collected from all tiers

### 4. Write-Back Gating (`src/vault/v0/WriteBack.ts`)

- Updated `isEligibleForWriteBack()` to require:
  - Pass tiers 0-2 (existing)
  - Pass Tier 3 palette permutation test (new)
  - Translation test optional (can fail for ABSOLUTE programs)

### 5. Orchestrator Integration (`src/orchestrator/v0/Orchestrator.ts`)

- Updated negative evidence logging:
  - Records `GENERALIZATION_FAIL_PALETTE` for palette failures
  - Records `GENERALIZATION_FAIL_TRANSLATION` for translation failures
  - Records `GENERALIZATION_FAIL` for other generalization failures

### 6. Verifier Codes (`src/contracts/enums/VerifierCodes.ts`)

- Added Tier 3 codes:
  - `INVARIANCE_FAILED_PALETTE`
  - `INVARIANCE_FAILED_TRANSLATION`
  - `INVARIANCE_SKIPPED`

### 7. Tests (`src/verifier/v0/__tests__/invariance.test.ts`)

- Palette permutation tests
- Translation invariance tests
- Tier 3 integration tests
- Determinism tests

## Level-0 Invariance Tests

### Palette Permutation Invariance

- **Deterministic permutation**: Generated from `repr_id` hash
  - Sorts colors present in input
  - Rotates by `(hash(repr_id) mod n)` positions
- **Test process**:
  1. Extract colors from input
  2. Generate permutation
  3. Apply to input and expected output
  4. Run program on permuted input
  5. Compare output to permuted expected output
- **Skip conditions**: Insufficient colors (< 2)

### Translation Invariance

- **Deterministic translation**: Generated from `repr_id` hash
  - Chooses from small set: `{(-1,0), (1,0), (0,-1), (0,1)}`
  - Fixed padding (1 cell border)
- **Test process**:
  1. Pad input grid with background color
  2. Generate translation offset
  3. Translate content
  4. Run program on translated input
  5. Compare output to translated expected output
- **Eligibility**: Only for RELATIVE programs without absolute coords
- **Skip conditions**: ABSOLUTE frame, uses absolute coords

## Coordinate Jail Enforcement

- **RELATIVE frame**: 
  - CoordAbs literals rejected at Tier 0 (already enforced)
  - Translation invariance required (if eligible)
- **ABSOLUTE frame**:
  - CoordAbs allowed
  - Cost penalty via `abs_coord_refs` (already enforced)
  - Write-back requires palette permutation pass
  - Translation invariance optional (can fail without blocking)

## Write-Back Gating

**Strict rules**:
- Must pass tiers 0-2 (existing)
- Must pass Tier 3 palette permutation test (new)
- Translation test optional (can fail for ABSOLUTE programs)

**Negative evidence**:
- Concepts that pass 0-2 but fail Tier 3:
  - Logged as `GENERALIZATION_FAIL_PALETTE` or `GENERALIZATION_FAIL_TRANSLATION`
  - Used for down-ranking (not implemented yet)

## Definition of Done

✅ **Tier 3 invariance probing implemented** (palette + translation eligibility)  
✅ **Deterministically generated transforms** (from repr_id)  
✅ **Write-back gated on Tier 3 palette invariance**  
✅ **Traces + negative evidence include invariance outcomes**  
✅ **Tests pass; replay remains byte-identical**

## Files Created

```
oplas/src/verifier/v0/
├── InvarianceTests.ts
├── Tier3.ts
└── __tests__/
    └── invariance.test.ts
```

## Files Modified

```
oplas/src/verifier/v0/
├── Verifier.ts (integrated Tier 3)
└── types.ts (extended VerifierResult)

oplas/src/vault/v0/
└── WriteBack.ts (gated on Tier 3)

oplas/src/orchestrator/v0/
└── Orchestrator.ts (negative evidence for generalization failures)

oplas/src/contracts/enums/
└── VerifierCodes.ts (added Tier 3 codes)
```

## Usage

### Enable Invariance Tests
```typescript
const request: Request = {
  // ...
  run_config: {
    enable_invariance: true // Default: true
  }
};
```

### Check Tier 3 Results
```typescript
const verifierResult = verify(context);

if (verifierResult.tier3_result) {
  console.log(`Palette test: ${verifierResult.tier3_result.palette_test_passed}`);
  console.log(`Translation test: ${verifierResult.tier3_result.translation_test_passed}`);
}
```

## Next Steps

**Block 10**: Concept Vault (retrieval + indexing) - May need refinement for negative evidence ranking























