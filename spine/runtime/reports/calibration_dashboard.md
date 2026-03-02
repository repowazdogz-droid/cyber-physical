# SPINE Calibration Dashboard

**Last Updated:** 2026-02-05  
**Current Version:** v8

## Version History

| Version | Date | Constraints | Main Detection | Holdout Detection | FP Rate | Coverage |
|---------|------|-------------|----------------|-------------------|---------|----------|
| v1 | 2026-02-05 | 5 | 40.0% (4/10) | - | - | - |
| v2 | 2026-02-05 | 15 | 90.0% (9/10) | - | - | - |
| v3 | 2026-02-05 | 15 | 100.0% (10/10) | - | - | - |
| v4 | 2026-02-05 | 15 | 16.7% (5/30) | - | 0.0% | - |
| v5 | 2026-02-05 | 28 | 36.7% (11/30) | - | 0.0% | - |
| v6 | 2026-02-05 | 36 | 70.0% (21/30) | 86.7% (13/15) | 0.0% | - |
| v7 | 2026-02-05 | 43 | 70.0% (21/30) | 100.0% (15/15) | 0.0% | - |
| v8 | 2026-02-05 | 47 | 70.0% (21/30) | 100.0% (15/15) | 0.0% | 2.8-5.8% |

## Per-Category Trend (Main Suite)

| Category | v4 | v5 | v6 | v7 | v8 | Trend |
|----------|----|----|----|----|----|-------|
| Control | 20% | 80% | 80% | 80% | 80% | → Plateau |
| Geometric | 25% | 25% | 25% | 25% | 50% | ↗ Improving |
| Interaction | 0% | 0% | 0% | 100% | 100% | ↗ Major jump |
| Material | 0% | 25% | 25% | 100% | 100% | ↗ Major jump |
| Mechanical | 20% | 60% | 60% | 60% | 60% | → Plateau |
| Thermal | 50% | 50% | 50% | 50% | 50% | → Plateau |
| Emergent | 0% | 0% | 0% | 75% | 75% | ↗ Improved |

## Summary

**Trajectory Direction:** Steady improvement from v4-v6, plateau at v7-v8

**Rate of Improvement:**
- v4→v5: +20.0% (added control/material constraints)
- v5→v6: +33.3% (added interaction constraints)
- v6→v7: +0.0% (maintained, improved holdout)
- v7→v8: +0.0% (maintained, improved geometric)

**Areas Plateauing:**
- Control: Stable at 80% (1 miss: feedforward mismatch)
- Mechanical: Stable at 60% (2 misses: borderline mass, backlash)
- Thermal: Stable at 50% (2 misses: cooling degradation, ambient shift)

**Areas Improving:**
- Geometric: 25% → 50% (v7→v8 with geometry constraints)
- Interaction: 0% → 100% (v6→v7 with interaction constraints)
- Material: 0% → 100% (v5→v6 with material constraints)

**Overall Assessment:**
- Main suite detection stable at 70% (v6-v8)
- Holdout detection improved to 100% (v7-v8)
- Zero false positives maintained across all versions
- Coverage scoring added in v8 provides visibility into missing design data
