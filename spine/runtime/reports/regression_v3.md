# Failure Injection Regression Report (v3)

**Analysis Date:** 2026-02-05
**Cases Analyzed:** 10 physics-based failure injection cases
**Purpose:** Regression test after thermal constraint upgrade and failure taxonomy addition
**Version:** v3 (upgraded thermal constraint + failure taxonomy)

## Comparison: v1 vs v2 vs v3
| Detection Rate | 40.0% (4/10) | 90.0% (9/10) | 100.0% (10/10) | +10.0% |
| Avg Decision Delta | 0.80/3.0 | 1.90/3.0 | 2.10/3.0 | +0.20 |

| Metric | v1 (5 constraints) | v2 (15 constraints) | v3 (upgraded thermal) | Change v2→v3 |
|--------|-------------------|---------------------|----------------------|--------------|

## Regression Table: Case-by-Case Comparison

| Case | Injected Failure | v1 Result | v2 Result | v3 Result | Regression? |
|------|------------------|-----------|-----------|-----------|-------------|
| Top-heavy gripper with COG outside suppo... | center_of_mass_instability | ✗ Missed | ✓ Detected | ✓ Detected | ✓ No |
| Joint torque exceeds actuator limit | excessive_torque | ✓ Detected | ✓ Detected | ✓ Detected | ✓ No |
| Low friction coefficient on wet tissue | insufficient_grip_friction | ✓ Detected | ✓ Detected | ✓ Detected | ✓ No |
| Range of motion exceeds joint limit | joint_binding | ✗ Missed | ✓ Detected | ✓ Detected | ✓ No |
| Jerk exceeds safety limit | acceleration_spike | ✗ Missed | ✓ Detected | ✓ Detected | ✓ No |
| Payload exceeds rated capacity | mass_violation | ✓ Detected | ✓ Detected | ✓ Detected | ✓ No |
| Two links intersect at operating configu... | self_collision | ✓ Detected | ✓ Detected | ✓ Detected | ✓ No |
| Continuous load at 95% actuator capacity | actuator_saturation | ✗ Missed | ✓ Detected | ✓ Detected | ✓ No |
| Operating frequency near structural reso... | resonance_excitation | ✗ Missed | ✓ Detected | ✓ Detected | ✓ No |
| Motor duty cycle causes thermal overload | thermal_runaway | ✗ Missed | ✗ Missed | ✓ Detected | ✓ No |

## Summary Statistics

- **v3 Detection Rate:** 100.0% (10/10)
- **v3 Average Decision Delta:** 2.10/3.0
- **Target:** 100% detection (10/10)
- **Change from v2:** Detection rate +10.0%, Delta +0.20

## Regression Status

✓ **NO REGRESSIONS:** All previously detected failures still detected in v3

## Detailed Findings

### Top-heavy gripper with COG outside support polygon
- **Injected:** center_of_mass_instability
- **Expected:** Mass limit violation OR tip-over failure mode
- **Failure Modes:** 1
- **Formal Constraints Violated:** 1
- **Falsification Tests:** 1

### Joint torque exceeds actuator limit
- **Injected:** excessive_torque
- **Expected:** Force limit violation OR excessive force damage failure mode
- **Failure Modes:** 0
- **Formal Constraints Violated:** 2
- **Falsification Tests:** 1

### Low friction coefficient on wet tissue
- **Injected:** insufficient_grip_friction
- **Expected:** Slip under load failure mode
- **Failure Modes:** 2
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 2

### Range of motion exceeds joint limit
- **Injected:** joint_binding
- **Expected:** Joint limit violation OR mechanical interference
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
- **Falsification Tests:** 0

### Jerk exceeds safety limit
- **Injected:** acceleration_spike
- **Expected:** Acceleration limit violation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
- **Falsification Tests:** 0

### Payload exceeds rated capacity
- **Injected:** mass_violation
- **Expected:** Mass limit formal constraint violation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 2
- **Falsification Tests:** 0

### Two links intersect at operating configuration
- **Injected:** self_collision
- **Expected:** Self-collision formal constraint violation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 2
- **Falsification Tests:** 0

### Continuous load at 95% actuator capacity
- **Injected:** actuator_saturation
- **Expected:** Thermal overload risk OR force limit concern
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
- **Falsification Tests:** 0

### Operating frequency near structural resonance
- **Injected:** resonance_excitation
- **Expected:** Resonance risk OR vibration failure mode
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
- **Falsification Tests:** 1

### Motor duty cycle causes thermal overload
- **Injected:** thermal_runaway
- **Expected:** Thermal overload risk OR material degradation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
- **Falsification Tests:** 0

## Weakest Areas

**Most Missed Failure Types:**
- insufficient: 1 missed

## New Constraint Coverage Analysis

**New Constraints That Fired:**
- COG Stability: 1 violation(s)
- Torque Limit: 1 violation(s)
- Jerk Limit: 1 violation(s)
- Actuator Duty Cycle: 1 violation(s)
- Resonance Margin: 1 violation(s)
- Thermal Limit: 1 violation(s)
- Joint Range Limit: 1 violation(s)
- Payload Ratio: 1 violation(s)

## Honest Assessment

**SPINE v3 achieved 100% detection rate.** All 10 failure injection cases detected.

✓ **Thermal Constraint Upgrade:** SUCCESS
  - Upgraded thermal constraint now detects thermal_runaway via temperature rise check
  - Thermal envelope model (power × duty_cycle × cooling_factor) implemented

  - Promotion recording failed: [Errno 1] Operation not permitted: '/Users/warre/.spine/promotion_log.json'

✓ **NO REGRESSIONS:** All previously detected failures remain detected.

**Key Improvements in v3:**
1. Thermal constraint upgraded to thermal envelope model
2. Failure taxonomy added (category, detectability_score, severity_detectability_product)
3. Promotion pipeline created for tracking missed failures
4. Regression testing framework established