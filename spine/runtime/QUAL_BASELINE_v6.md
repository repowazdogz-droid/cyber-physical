# SPINE Runtime Qualification Baseline (v6)

**Version:** v6  
**Date Frozen:** 2026-02-05  
**Status:** Qualified for adversarial suite v6b

## Version History

| Version | Constraints | Adversarial Detection | FP Rate | Notes |
|---------|-------------|----------------------|---------|-------|
| v1 | 5 | 40.0% (4/10) | N/A | Initial failure injection test |
| v2 | 15 | 90.0% (9/10) | N/A | Added 10 constraints (FORMAL_006-015) |
| v3 | 15 | 100.0% (10/10) | N/A | Thermal upgrade, failure taxonomy |
| v4 | 15 | 16.7% (5/30) | 0.0% | First adversarial campaign |
| v5 | 28 | 36.7% (11/30) | 0.0% | Added 13 control/material constraints |
| v6 | 36 | 70.0% (21/30) | 0.0% | Added 8 material-environment/interaction constraints + design data |

## Detection by Category (v6)

| Category | Detected | Total | Rate |
|----------|----------|-------|------|
| Control | 4 | 5 | 80.0% |
| Geometric | 1 | 4 | 25.0% |
| Interaction | 4 | 4 | 100.0% |
| Material | 4 | 4 | 100.0% |
| Mechanical | 3 | 5 | 60.0% |
| Thermal | 2 | 4 | 50.0% |
| Unknown/Emergent | 3 | 4 | 75.0% |
| **Overall** | **21** | **30** | **70.0%** |

## False Positive Rate

**FP Rate:** 0.0% (0 false positives across all test cases)

## Known Gaps (9 Misses)

| Case ID | Category | Failure Type | Reason |
|---------|----------|--------------|--------|
| adv_c05_feedforward_mismatch | control | feedforward_mismatch | Model mismatch not covered by formal constraints |
| adv_e02_thermal_control_interaction | emergent | thermal_control_interaction | Multi-domain interaction not captured |
| adv_g01_tolerance_stackup | geometric | tolerance_stackup | Cumulative tolerance not modeled |
| adv_g03_clearance_reduction | geometric | clearance_reduction | Load-dependent deflection not captured |
| adv_g04_assembly_error | geometric | assembly_error | Assembly variation not modeled |
| adv_m01_borderline_mass | mechanical | borderline_mass | 9.95kg vs 10kg limit (within margin) |
| adv_m05_backlash_accumulation | mechanical | backlash_accumulation | Progressive wear not modeled |
| adv_t02_cooling_degradation | thermal | cooling_degradation | Cooling system failure not modeled |
| adv_t04_ambient_temperature_shift | thermal | ambient_temperature_shift | Environmental variation not captured |

## Adversarial Suite

**Suite Hash (MD5):** `2da35d396532b4a5484155f3c1c1207e`  
**Suite Version:** v6b  
**Total Cases:** 30  
**Cases:** See ADV_SUITE_MANIFEST.json

## Constraint Inventory

**Total Constraints:** 36

- FORMAL_001-005: Mass, Force, Acceleration, Clearance, Self-Collision
- FORMAL_006-015: COG, Torque, Jerk, Duty Cycle, Resonance, Thermal, Joint Range, Payload, Stiffness, Voltage
- FORMAL_016-022: Control Bandwidth, Latency, Phase Margin, Gain Margin, Sampling, Encoder, Control Energy
- FORMAL_023-028: Fatigue, Creep, Stress Corrosion, UV, Safety Factor Static, Stiffness Mismatch
- FORMAL_029-036: Creep Envelope, Thermal-Material Coupling, Contact Pressure, Tissue Crush, Bolt Shear, Adhesive Load, Slip Margin, Corrosion Rate

## Qualification Criteria

- ✅ Detection rate ≥ 70% on adversarial suite
- ✅ False positive rate ≤ 5%
- ✅ All failure injection cases detected (10/10)
- ✅ Suite hash frozen for reproducibility
- ⚠️ 9 known gaps documented

## Next Steps

1. Holdout evaluation (15 cases, never used for development)
2. Perturbation robustness testing
3. Address known gaps in future versions
