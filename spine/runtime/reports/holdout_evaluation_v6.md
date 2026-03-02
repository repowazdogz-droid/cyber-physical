# Holdout Evaluation Report (v6)

**Analysis Date:** 2026-02-05
**Purpose:** Honest assessment on holdout cases (never used for constraint development)

## Summary

- **Total Holdout Cases:** 15
- **Detected:** 13
- **Detection Rate:** 86.7%

## Comparison: Main Suite vs Holdout

| Metric | Main Suite (v6b) | Holdout | Difference |
|--------|------------------|---------|------------|
| Detection Rate | 70.0% (21/30) | 86.7% (13/15) | +16.7% |

## Detection by Category

| Category | Detected | Total | Rate |
|----------|----------|-------|------|
| control | 2/2 | 2 | 100.0% |
| geometric | 1/3 | 3 | 33.3% |
| interaction | 2/2 | 2 | 100.0% |
| material | 2/2 | 2 | 100.0% |
| mechanical | 3/3 | 3 | 100.0% |
| thermal | 2/2 | 2 | 100.0% |
| unknown | 1/1 | 1 | 100.0% |

## Detailed Results

| Case | Category | Injected Failure | Detected? | Constraints Triggered |
|------|----------|------------------|-----------|----------------------|
| Quantization error in low-resolution DAC... | control | quantization_error | ✓ Yes | control_bandwidth_margin, sampling_nyquist, encoder_resolution |
| Communication dropout 50ms every 10s... | control | communication_dropout | ✓ Yes | control_bandwidth_margin, latency_margin |
| Vibration + thermal cycling + wear = progressive j... | unknown | progressive_joint_failure | ✓ Yes | min_clearance, creep_risk |
| Cumulative tolerance drift - 6 parts, each +2σ... | geometric | cumulative_tolerance_drift | ✗ No | None |
| Thermal expansion under cycling - not steady state... | geometric | thermal_expansion_cycling | ✗ No | None |
| Press-fit interference loss at temperature... | geometric | press_fit_interference_loss | ✓ Yes | min_clearance |
| Compliant object deformation changes grip geometry... | interaction | compliant_deformation | ✓ Yes | contact_pressure, tissue_crush_risk, slip_margin |
| Surface contamination reduces friction mid-task... | interaction | surface_contamination | ✓ Yes | contact_pressure, tissue_crush_risk, slip_margin |
| Vibration-induced fastener loosening... | mechanical | vibration_fastener_loosening | ✓ Yes | resonance_margin |
| Impact load 3x static - drop scenario... | mechanical | impact_load | ✓ Yes | max_force, safety_factor_static |
| Wear accumulation on sliding surface... | mechanical | wear_accumulation | ✓ Yes | min_clearance |
| Hydrogen embrittlement under sustained load... | material | hydrogen_embrittlement | ✓ Yes | stress_corrosion_risk |
| Galvanic corrosion at dissimilar metal joint... | material | galvanic_corrosion | ✓ Yes | stress_corrosion_risk |
| Intermittent cooling - fan cycles on/off every 30s... | thermal | intermittent_cooling | ✓ Yes | thermal_limit |
| Thermal lag - sensor reads 20s behind actual temp... | thermal | thermal_lag | ✓ Yes | thermal_limit, latency_margin |

## Honest Assessment

**Holdout detection rate: 86.7%**

This is the honest number - holdout cases were never used for constraint development.

**Key Findings:**
1. Holdout detection: 86.7% vs main suite 70.0%
2. Difference: +16.7%

**Interpretation:**
Holdout performance is **acceptable** - within reasonable range of main suite.