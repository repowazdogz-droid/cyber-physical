# Failure Injection Scoring Report

**Analysis Date:** 2026-02-05
**Cases Analyzed:** 10 physics-based failure injection cases
**Purpose:** Stress test SPINE's ability to detect known mechanical failures

## Scoring Table

| Case | Injected Failure | SPINE Detected? | Failure Modes Found | Formal Constraints Triggered | Decision Delta (0-3) |
|------|------------------|-----------------|---------------------|------------------------------|----------------------|
| Top-heavy gripper with COG out... | center_of_mass_instability | No | slip_under_load | None | 0 |
| Joint torque exceeds actuator ... | excessive_torque | Yes (Formal Constraint) | None | max_force | 2 |
| Low friction coefficient on we... | insufficient_grip_friction | Yes (Failure Mode) | slip_under_load, excessive_force_damage | None | 2 |
| Range of motion exceeds joint ... | joint_binding | No | None | None | 0 |
| Jerk exceeds safety limit | acceleration_spike | No | None | None | 0 |
| Payload exceeds rated capacity | mass_violation | Yes (Formal Constraint) | None | mass_limit | 2 |
| Two links intersect at operati... | self_collision | Yes (Formal Constraint, Formal Constraint) | None | min_clearance, no_self_collision | 2 |
| Continuous load at 95% actuato... | actuator_saturation | No | None | None | 0 |
| Operating frequency near struc... | resonance_excitation | No | None | None | 0 |
| Motor duty cycle causes therma... | thermal_runaway | No | None | None | 0 |

## Summary Statistics

- **Detection Rate:** 40.0% (4/10)
- **Average Decision Delta:** 0.80/3.0
- **Target Average:** 2.0/3.0

## Detailed Findings

### Top-heavy gripper with COG outside support polygon
- **Injected:** center_of_mass_instability
- **Expected:** Mass limit violation OR tip-over failure mode
- **Failure Modes:** 1
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 1

### Joint torque exceeds actuator limit
- **Injected:** excessive_torque
- **Expected:** Force limit violation OR excessive force damage failure mode
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
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
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 0

### Jerk exceeds safety limit
- **Injected:** acceleration_spike
- **Expected:** Acceleration limit violation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 0

### Payload exceeds rated capacity
- **Injected:** mass_violation
- **Expected:** Mass limit formal constraint violation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 1
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
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 0

### Operating frequency near structural resonance
- **Injected:** resonance_excitation
- **Expected:** Resonance risk OR vibration failure mode
- **Failure Modes:** 0
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 1

### Motor duty cycle causes thermal overload
- **Injected:** thermal_runaway
- **Expected:** Thermal overload risk OR material degradation
- **Failure Modes:** 0
- **Formal Constraints Violated:** 0
- **Falsification Tests:** 0

## Weakest Areas

**Most Missed Failure Types:**
- center: 1 missed
- insufficient: 1 missed
- joint: 1 missed
- acceleration: 1 missed
- actuator: 1 missed
- resonance: 1 missed
- thermal: 1 missed

## Honest Assessment

**SPINE failed to detect most injected failures.** The analyzer requires significant strengthening in physics-based failure mode detection.

**Key Gaps:**
1. Limited failure mode patterns (only detects slip, force, material)
2. Formal constraints work but don't trigger failure modes
3. No physics-based reasoning (COG, resonance, thermal)
4. Falsification engine only triggers on high-severity failure modes