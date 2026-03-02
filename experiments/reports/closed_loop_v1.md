# Closed-Loop Experiments Report (v1)

**Analysis Date:** 2026-02-05
**Total Experiments:** 20

## Summary

- **Total Experiments:** 20
- **Mean Calibration Error:** 0.200
- **Records with Outcomes:** 20

## Results by Experiment

| Experiment | Spine Prediction | Forge Hypothesis | Sim Outcome | Prediction Correct? | Calibration Error |
|------------|------------------|------------------|-------------|---------------------|-------------------|
| exp_01_slip_steel_dry | 2 risks | 1 hypotheses | No | ✗ | 0.300 |
| exp_02_slip_wet_tissue | 2 risks | 1 hypotheses | No | ✗ | 0.300 |
| exp_03_slip_silicone_glass | 2 risks | 1 hypotheses | No | ✗ | 0.300 |
| exp_04_slip_textured | 2 risks | 1 hypotheses | No | ✗ | 0.300 |
| exp_05_slip_high_speed | 2 risks | 2 hypotheses | No | ✗ | 0.300 |
| exp_06_force_soft_tissue | 1 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_07_force_cartilage | 1 risks | 1 hypotheses | No | ✓ | 0.200 |
| exp_08_force_ramp | 1 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_09_force_cyclic | 1 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_10_force_impulse | 1 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_11_thermal_continuous | 0 risks | 1 hypotheses | No | ✓ | 0.100 |
| exp_12_thermal_duty_cycle | 0 risks | 1 hypotheses | No | ✓ | 0.100 |
| exp_13_thermal_burst | 0 risks | 1 hypotheses | No | ✓ | 0.100 |
| exp_14_thermal_body_temp | 0 risks | 0 hypotheses | No | ✓ | 0.100 |
| exp_15_thermal_cooling_failure | 0 risks | 0 hypotheses | No | ✓ | 0.100 |
| exp_16_fatigue_1000_cycles | 0 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_17_fatigue_5000_overload | 0 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_18_fatigue_overload_spikes | 0 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_19_fatigue_alternating | 0 risks | 0 hypotheses | No | ✓ | 0.200 |
| exp_20_fatigue_creep | 0 risks | 0 hypotheses | No | ✓ | 0.200 |

## Calibration Statistics

- **Mean Error:** 0.200
- **By Category:**
  - failure_elimination: 0.300
  - uncertainty_collapse: 0.125
- **By Confidence Band:**
  - low: 0.200
  - medium: 0.000
  - high: 0.000

## Calibration Curve Data

Confidence bands vs actual outcome rate:

- Low confidence (<0.5): Predicted ~0.3, Actual 0.00
- Medium confidence (0.5-0.8): Predicted ~0.65, Actual 0.00
- High confidence (>0.8): Predicted ~0.9, Actual 0.00

## Honest Assessment

**Well-Calibrated Predictions:** 5/20 (25.0%)
**Poorly-Calibrated Predictions:** 0/20 (0.0%)

**Key Findings:**
1. Mean calibration error provides baseline for system calibration
2. Confidence bands show how well predicted confidence matches actual outcomes
3. Category-based errors identify which hypothesis types need improvement
4. Closed-loop infrastructure enables continuous calibration

## Ledger Integrity

- **Record count:** 20
- **Hash valid:** True
- **Last write (UTC):** 2026-02-05T13:09:46.580814
