# Failure Injection Scoring Report (v2)

**Analysis Date:** 2026-02-05
**Cases Analyzed:** 10 physics-based failure injection cases
**Purpose:** Stress test SPINE's ability to detect known mechanical failures
**Version:** v2 (15 formal constraints vs v1 with 5 constraints)

## Comparison: v1 vs v2

| Metric | v1 (5 constraints) | v2 (15 constraints) | Change |
|--------|-------------------|---------------------|--------|
| Detection Rate | 40.0% (4/10) | 90.0% (9/10) | +50.0% |
| Avg Decision Delta | 0.80/3.0 | 1.90/3.0 | +1.10 |

## Scoring Table

| Case | Injected Failure | SPINE Detected? | Failure Modes Found | Formal Constraints Triggered | Decision Delta (0-3) |
|------|------------------|-----------------|---------------------|------------------------------|----------------------|
| Top-heavy gripper with COG out... | center_of_mass_instability | Yes (Formal Constraint, Formal Constraint (COG)) | slip_under_load | cog_stability | 3 |
| Joint torque exceeds actuator ... | excessive_torque | Yes (Formal Constraint, Formal Constraint, Formal Constraint (Torque)) | None | max_force, torque_limit | 2 |
| Low friction coefficient on we... | insufficient_grip_friction | Yes (Failure Mode) | slip_under_load, excessive_force_damage | None | 2 |
| Range of motion exceeds joint ... | joint_binding | Yes (Formal Constraint, Formal Constraint (Joint)) | None | joint_range_limit | 2 |
| Jerk exceeds safety limit | acceleration_spike | Yes (Formal Constraint, Formal Constraint (Jerk)) | None | jerk_limit | 2 |
| Payload exceeds rated capacity | mass_violation | Yes (Formal Constraint) | None | mass_limit, payload_ratio | 2 |
| Two links intersect at operati... | self_collision | Yes (Formal Constraint, Formal Constraint) | None | min_clearance, no_self_collision | 2 |
| Continuous load at 95% actuato... | actuator_saturation | Yes (Formal Constraint (Duty Cycle)) | None | actuator_duty_cycle | 2 |
| Operating frequency near struc... | resonance_excitation | Yes (Formal Constraint, Formal Constraint (Resonance)) | None | resonance_margin | 2 |
| Motor duty cycle causes therma... | thermal_runaway | No | None | None | 0 |

## Summary Statistics

- **Detection Rate:** 90.0% (9/10)
- **Average Decision Delta:** 1.90/3.0
- **Target Average:** 2.0/3.0
- **Improvement over v1:** Detection rate +50.0%, Delta +1.10

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
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 0
- **Note:** Case has `effective_power_w: 42.75` which is below thermal constraint default threshold (50W), but `estimated_temp_rise_c: 85` suggests overheating. Constraint only checks power, not temperature rise.

## Weakest Areas

**Most Missed Failure Types:**
- insufficient: 1 missed
- thermal: 1 missed

## New Constraint Coverage Analysis

**New Constraints That Fired:**
- COG Stability: 1 violation(s)
- Torque Limit: 1 violation(s)
- Jerk Limit: 1 violation(s)
- Actuator Duty Cycle: 1 violation(s)
- Resonance Margin: 1 violation(s)
- Joint Range Limit: 1 violation(s)
- Payload Ratio: 1 violation(s)

## Honest Assessment

**SPINE v2 showed significant improvement** — detection rate increased from 40% to 90% (+50 percentage points) with the addition of 10 new formal constraints.

**What Worked:**
- 7 of 10 new constraints successfully fired (COG stability, torque limit, jerk limit, actuator duty cycle, resonance margin, joint range limit, payload ratio)
- Design data mapping successfully converted case YAML fields to constraint-expected formats
- New constraints caught previously missed failures: COG instability, joint binding, acceleration jerk, actuator saturation, resonance

**What Didn't Work:**
- Thermal constraint (FORMAL_011) didn't fire for thermal_runaway case because:
  - Case has `effective_power_w: 42.75` which is below default threshold (50W)
  - Constraint only checks power dissipation, not temperature rise
  - Case indicates overheating via `estimated_temp_rise_c: 85` but constraint doesn't model thermal dynamics
- One case still missed: thermal_runaway (0/10 → 1/10 missed)

**Key Gaps:**
1. Thermal constraint needs temperature-based checking, not just power limits
2. Limited failure mode patterns (only detects slip, force, material)
3. Formal constraints work but don't trigger failure modes (they're separate outputs)
4. Some constraints require computed values (e.g., COG stability) that may not be directly available in all cases