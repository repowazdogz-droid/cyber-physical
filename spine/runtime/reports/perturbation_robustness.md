# Perturbation Robustness Test Report

**Analysis Date:** 2026-02-05
**Purpose:** Test SPINE stability to small parameter variations

## Summary

- **Test Cases:** 10
- **Perturbations per Case:** 5
- **Total Perturbations:** 50

## Results by Case

| Case | Baseline Detected? | Stability Score | Perturbation Results |
|------|-------------------|-----------------|---------------------|
| adv_c01_marginal_phase_margin.yaml | Yes | 100.0% | mass_+10%: ✓, friction_-15%: ✓, duty_cycle_+20%: ✓, latency_+25%: ✓, temperature_+15%: ✓ |
| adv_i02_surface_friction_drop.yaml | Yes | 100.0% | mass_+10%: ✓, friction_-15%: ✓, duty_cycle_+20%: ✓, latency_+25%: ✓, temperature_+15%: ✓ |
| adv_mat01_creep.yaml | Yes | 100.0% | mass_+10%: ✓, friction_-15%: ✓, duty_cycle_+20%: ✓, latency_+25%: ✓, temperature_+15%: ✓ |
| adv_m02_fatigue_cycling.yaml | Yes | 100.0% | mass_+10%: ✓, friction_-15%: ✓, duty_cycle_+20%: ✓, latency_+25%: ✓, temperature_+15%: ✓ |
| adv_t01_transient_thermal_spike.yaml | Yes | 100.0% | mass_+10%: ✓, friction_-15%: ✓, duty_cycle_+20%: ✓, latency_+25%: ✓, temperature_+15%: ✓ |
| adv_c05_feedforward_mismatch.yaml | No | 100.0% | mass_+10%: ✗, friction_-15%: ✗, duty_cycle_+20%: ✗, latency_+25%: ✗, temperature_+15%: ✗ |
| adv_g01_tolerance_stackup.yaml | No | 100.0% | mass_+10%: ✗, friction_-15%: ✗, duty_cycle_+20%: ✗, latency_+25%: ✗, temperature_+15%: ✗ |
| adv_m01_borderline_mass.yaml | No | 100.0% | mass_+10%: ✓, friction_-15%: ✗, duty_cycle_+20%: ✗, latency_+25%: ✗, temperature_+15%: ✗ |
| adv_t02_cooling_degradation.yaml | No | 100.0% | mass_+10%: ✗, friction_-15%: ✗, duty_cycle_+20%: ✗, latency_+25%: ✗, temperature_+15%: ✗ |
| adv_e02_thermal_control_interaction.yaml | No | 100.0% | mass_+10%: ✗, friction_-15%: ✗, duty_cycle_+20%: ✗, latency_+25%: ✗, temperature_+15%: ✗ |

## Overall Statistics

- **Average Stability Score:** 100.0%
- **Min Stability:** 100.0%
- **Max Stability:** 100.0%

## Interpretation

Stability score = % of perturbations where:
- Detection result unchanged, OR
- Changed in expected direction (worse parameter → more likely detected)

**Assessment:**
SPINE shows **good robustness** to parameter perturbations.