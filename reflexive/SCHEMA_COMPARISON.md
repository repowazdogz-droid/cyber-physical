# Syntheses Table Schema Comparison

## Current Schema (from migrations 001 + 002)

From `001_initial_schema.sql`:
- `id` UUID PRIMARY KEY
- `analysis_id` UUID NOT NULL UNIQUE
- `confidence_score` FLOAT
- `convergence_points` JSONB NOT NULL DEFAULT '[]'
- `divergence_points` JSONB NOT NULL DEFAULT '[]'
- `summary` TEXT
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW()

From `002_engine_additions.sql`:
- `drift_report` JSONB (added)
- `orphan_claims` JSONB (added)

## What writeSynthesis() Expects (line 48-54)

```sql
INSERT INTO syntheses (
  id, analysis_id,
  convergence_points, divergence_points, orphan_claims,
  confidence_score, confidence_rationale, confidence_breakdown,
  summary, drift_report, computed_at
) VALUES (...)
```

**Expected columns:**
1. `id` ✓ (exists)
2. `analysis_id` ✓ (exists)
3. `convergence_points` ✓ (exists)
4. `divergence_points` ✓ (exists)
5. `orphan_claims` ✓ (added in 002)
6. `confidence_score` ✓ (exists)
7. `confidence_rationale` ❌ **MISSING**
8. `confidence_breakdown` ❌ **MISSING**
9. `summary` ✓ (exists)
10. `drift_report` ✓ (added in 002)
11. `computed_at` ❌ **MISSING**

## What orchestrator.ts Queries Expect (line 324)

```sql
SELECT s.analysis_id, s.confidence_score, s.confidence_breakdown,
       s.convergence_points, s.divergence_points, s.orphan_claims, s.computed_at
FROM syntheses s
```

**Expected columns:**
- `confidence_breakdown` ❌ **MISSING**
- `computed_at` ❌ **MISSING**

## Missing Columns Summary

1. **confidence_breakdown** JSONB - Required by writeSynthesis INSERT and orchestrator SELECT
2. **confidence_rationale** TEXT - Required by writeSynthesis INSERT
3. **computed_at** TIMESTAMP - Required by writeSynthesis INSERT and orchestrator SELECT

## Fix

Migration `004_synthesis_columns.sql` adds all three missing columns.
