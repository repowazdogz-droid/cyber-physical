# Block 14 — Tier 4 Counterexample Probing (Grammar-Bounded Perturbations) + Write-Back Hardening — COMPLETE

## Status: ✅ Complete

Block 14 adds a bounded, deterministic counterexample generator that probes brittleness beyond palette/translation, produces structured evidence, and gates vault write-back on surviving Tier 4.

## Components Implemented

### 1. Perturbation Grammar (`src/verifier/v0/Perturbations.ts`)

**Perturbation types (v0):**
- **ADD_DISTRACTOR**: Adds a small component (1x1, 1x2, 2x1, 2x2) in empty region
- **DUPLICATE_COMPONENT**: Duplicates smallest component to empty location

**Safety checks:**
- Grid remains rectangular
- Colors remain ints
- No overlap with existing cells
- Edit distance <= 4 cells (v0)

**Deterministic selection:**
- Perturbation type: `hash(repr_id + program_id) mod num_types`
- Placement: Scan empty cells in canonical order, pick index k
- No randomness

**Functions:**
- **checkPerturbationSafety()**: Validates perturbation safety
- **generatePerturbations()**: Generates perturbations deterministically
- **generateAddDistractor()**: Creates distractor perturbation
- **generateDuplicateComponent()**: Creates duplicate perturbation

### 2. Tier 4 Evaluation (`src/verifier/v0/Tier4.ts`)

**Protocol:**
1. Generate perturbations (default: 2)
2. For each perturbation:
   - Apply to input grid
   - Parse perturbed input → repr
   - Execute program
   - Check Tier 1 invariants
   - Check untouched region unchanged

**Conservative criteria:**
- Program must not crash (no EXEC_ERROR)
- Output must satisfy Tier 1 invariants
- Untouched region must be unchanged (except background)

**Functions:**
- **validateTier4()**: Runs Tier 4 validation
- **checkUntouchedRegion()**: Validates untouched region unchanged

### 3. Write-Back Hardening (`src/vault/v0/WriteBack.ts`)

**Strictness levels:**
- **LEVEL_0**: Tiers 0-2 only (not recommended)
- **LEVEL_1**: Require Tier 3 palette pass (default)
- **LEVEL_2**: Require Tier 3 pass + Tier 4 pass (recommended)

**Updated eligibility:**
- `isEligibleForWriteBack()` now checks strictness level
- Level 2 requires Tier 4 pass

### 4. Negative Evidence Integration

**Tier 4 failures:**
- Logged as `GENERALIZATION_FAIL_TIER4`
- Includes perturbation_id and details
- Written to evidence index

**Penalty scoring:**
- Added `generalization_fail_tier4` weight: 25 (high penalty)
- De-ranks concepts with Tier 4 failures

### 5. Verifier Integration (`src/verifier/v0/Verifier.ts`)

**Updates:**
- VerifierContext includes `enable_tier3` and `enable_tier4` flags
- Tier 3 runs if `enable_tier3` is true
- Tier 4 runs if `enable_tier4` is true (after Tier 2)
- VerifierResult includes `tier4_result`

**Tier flow:**
- Tier 0 → Tier 1 → Tier 2 → (Tier 3 if enabled) → (Tier 4 if enabled)

### 6. Orchestrator Integration (`src/orchestrator/v0/Orchestrator.ts`)

**Updates:**
- TaskRunOptions includes `enableTier3`, `enableTier4`, `writebackStrictness`
- CandidateEvaluator passes tier flags to verifier
- Negative evidence includes Tier 4 failures
- Write-back uses strictness level

### 7. Tests (`src/verifier/v0/__tests__/tier4.test.ts`)

**Tests:**
- Perturbation safety checks
- Deterministic perturbation generation
- Tier 4 validation
- Safety rejection for excessive edits

## Definition of Done

✅ **Tier 4 implemented with 2 perturbation types** (ADD_DISTRACTOR, DUPLICATE_COMPONENT)  
✅ **Deterministic, safe perturbations with pre-checks**  
✅ **Tier 4 results logged in verifier trace**  
✅ **Write-back can be gated on Tier 4** (configurable strictness)  
✅ **Negative evidence recorded and affects de-ranking**

## Files Created

```
oplas/src/verifier/v0/
├── Perturbations.ts
├── Tier4.ts
└── __tests__/
    └── tier4.test.ts
```

## Files Modified

```
oplas/src/contracts/enums/
└── VerifierCodes.ts (added Tier 4 error codes)

oplas/src/verifier/v0/
├── types.ts (added tier4_result, enable_tier3/4 flags)
├── Verifier.ts (Tier 3/4 integration)
└── Tier3.ts (already existed)

oplas/src/vault/v0/
├── WriteBack.ts (strictness levels)
└── PenaltyScoring.ts (Tier 4 penalty weight)

oplas/src/orchestrator/v0/
├── types.ts (Tier 3/4 options)
├── Orchestrator.ts (Tier 3/4 integration)
└── CandidateEvaluator.ts (pass tier flags)
```

## Usage

### Enable Tier 4
```typescript
const result = evaluateCandidate(
  program,
  repr,
  request,
  inputGrid,
  examples,
  {
    enable_tier3: true,
    enable_tier4: true
  }
);
```

### Write-back with strictness
```typescript
if (isEligibleForWriteBack(result.verifier_result, {
  enable_invariance_checks: true,
  strictness: WriteBackStrictness.LEVEL_2 // Requires Tier 4 pass
})) {
  await writeBackConcept(vaultRoot, concept, taskId);
}
```

## Limitations (v0)

- Only 2 perturbation types (can be extended)
- Edit distance bound: 4 cells (conservative)
- Untouched region check is simplified
- No edge-case padding (skipped for v0)

## Next Steps

**Block 15**: Vertical-Slice Demo Tasks (End-to-End)























