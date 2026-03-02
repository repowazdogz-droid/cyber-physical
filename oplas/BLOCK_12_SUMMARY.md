# Block 12 — Negative Evidence De-Ranking + Adaptive Refinement Scheduler — COMPLETE

## Status: ✅ Complete

Block 12 stops retrieval/proposal thrash and makes the system compound cleanly by using logged negative evidence to de-rank failing concepts deterministically and scheduling refinement budget toward candidates with highest improvement potential.

## Components Implemented

### 1. Evidence Index (`src/vault/v0/EvidenceIndex.ts`)

**Evidence aggregation key:**
- `concept_id@version`
- `domain`
- `key_fingerprint` (hash of top N=3 reprKeys)

**Functions:**
- **aggregateEvidence()**: Aggregates negative evidence into statistics
- **computeKeyFingerprint()**: Computes stable fingerprint from reprKeys
- **buildEvidenceIndex()**: Builds index from evidence records
- **loadEvidenceIndex()**: Loads index from disk
- **updateEvidenceIndex()**: Updates index with new evidence (append-only)

**Index structure:**
```
vault/evidence/index/
  by_concept/<concept_id@version>.json
  by_fingerprint/<fingerprint>.json
```

### 2. Penalty Scoring (`src/vault/v0/PenaltyScoring.ts`)

**Penalty function P:**
```
P = 5 * fail_count_total
  + 15 * fail_count_by_code[GENERALIZATION_FAIL_PALETTE]
  + 10 * fail_count_by_code[GENERALIZATION_FAIL_TRANSLATION]
  + 8  * fail_count_by_code[EXAMPLE_MISMATCH]
  + 20 * fail_count_by_code[EXEC_ERROR]
  + 2  * recent_fail_streak
```

**Hard exclusion rule:**
- If `GENERALIZATION_FAIL_PALETTE >= 3` for same key_fingerprint → exclude

**Functions:**
- **computePenalty()**: Computes penalty score from stats
- **shouldExclude()**: Checks if concept should be excluded

### 3. Updated Retrieval Ranking (`src/vault/v0/Retriever.ts`)

**New ranking order:**
1. Primary: `key_overlap_count` (desc)
2. Secondary: `penalty P` (asc) ← NEW
3. Tertiary: `concept_version` (desc)
4. Quaternary: lexicographic

**Returns:**
- `exclusions`: List of excluded concept IDs
- `penalties`: Map of concept ID → penalty score

### 4. Adaptive Refinement Scheduler (`src/model/v0/AdaptiveScheduler.ts`)

**Repair priority score R:**
```
R = + 100 * highest_tier_reached
    - 0.05 * diff_size
    - 0.2  * C(program)
    - 30   * is_generalization_fail
    - 50   * is_exec_error_severe
```

**Scheduling:**
- Sort candidates by R (descending)
- Allocate iterations to top K candidates (K=3)
- Max per candidate: 3 repairs
- Total max: 6 iterations
- Stop early on Tier 3 pass if `writeback_target=true`

**Budget guardrails:**
- Reduce iterations if `cost_usd_est > threshold`
- Reduce iterations if `latency_ms > threshold`

**Functions:**
- **computeRepairPriority()**: Computes R score
- **scheduleRepairs()**: Schedules candidates with iterations
- **adjustForBudget()**: Applies budget guardrails

### 5. Updated Refinement Loop (`src/model/v0/RefinementLoop.ts`)

- Uses adaptive scheduler instead of simple round-robin
- Supports budget guardrails
- Supports writeback target (stop on Tier 3)
- Logs scheduling decisions

### 6. Orchestrator Integration (`src/orchestrator/v0/Orchestrator.ts`)

**Updates:**
- Retrieval logs penalties and exclusions in run_trace
- Negative evidence write triggers index update
- Refinement loop uses adaptive scheduler
- Trace events include:
  - `concepts_retrieved`: With penalties and exclusions
  - `refinement_scheduled`: With failure count and iterations
  - `refinement_completed`: With result and attempts

### 7. Tests

**Evidence tests (`src/vault/v0/__tests__/evidence.test.ts`):**
- Aggregation statistics
- Key fingerprint determinism
- Penalty scoring
- Exclusion logic
- Index storage

**Scheduler tests (`src/model/v0/__tests__/scheduler.test.ts`):**
- Priority scoring (tier, cost, failure types)
- Scheduling (top K, limits)
- Budget guardrails

## Definition of Done

✅ **Negative evidence is used to de-rank retrieval deterministically**  
✅ **Evidence index is built/updated and does not slow runs materially**  
✅ **Adaptive repair scheduler chooses candidates deterministically and keeps budgets bounded**  
✅ **Run_trace records ranking and scheduling reasons (structured)**  
✅ **Tests pass and replay remains byte-identical**

## Files Created

```
oplas/src/vault/v0/
├── EvidenceIndex.ts
└── PenaltyScoring.ts

oplas/src/model/v0/
└── AdaptiveScheduler.ts

oplas/src/vault/v0/__tests__/
└── evidence.test.ts

oplas/src/model/v0/__tests__/
└── scheduler.test.ts
```

## Files Modified

```
oplas/src/vault/v0/
├── Retriever.ts (penalty-based ranking)
└── Storage.ts (index update on write)

oplas/src/model/v0/
└── RefinementLoop.ts (adaptive scheduling)

oplas/src/orchestrator/v0/
└── Orchestrator.ts (integration, trace logging)
```

## Usage

The system automatically:
1. Loads evidence index on retrieval
2. Computes penalties for concepts
3. Ranks concepts with penalty de-ranking
4. Excludes concepts meeting hard exclusion criteria
5. Schedules repairs using priority scores
6. Applies budget guardrails
7. Updates evidence index on negative evidence write

All decisions are logged in `run_trace.jsonl` for observability and replay.

## Next Steps

**Block 13**: Model Interface + Swap Protocol + No-Model Baseline























