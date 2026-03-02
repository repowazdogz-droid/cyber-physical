# SPINE Coverage Dashboard

**Last Updated:** 2026-02-05  
**Version:** v6  
**Total Constraints:** 36

## Coverage by Category

| Category | # Constraints | Detection Rate | Top Gap | Next Constraint Needed |
|----------|---------------|----------------|---------|------------------------|
| **Control** | 7 | 80.0% (4/5) | Feedforward model mismatch | Control model accuracy constraint |
| **Material** | 8 | 25.0% (1/4) | Creep, stress corrosion, UV degradation | Enhanced creep modeling, SCC threshold mapping |
| **Mechanical** | 5 | 60.0% (3/5) | Borderline mass, backlash accumulation | Mass uncertainty propagation, wear modeling |
| **Thermal** | 1 | 50.0% (2/4) | Cooling degradation, ambient shift | Cooling factor degradation, ambient variation |
| **Geometric** | 1 | 25.0% (1/4) | Tolerance stackup, assembly error | Statistical tolerance analysis, kinematic error propagation |
| **Interaction** | 2 | 0.0% (0/4) | All interaction failures missed | Tissue compliance variation, friction drop detection, obstacle contact |
| **Emergent** | 0 | 0.0% (0/4) | All emergent failures missed | Multi-constraint interaction, cascading failure detection |

## Constraint Inventory

### Mechanical (5 constraints)
- FORMAL_001: mass_limit
- FORMAL_002: max_force
- FORMAL_003: max_acceleration
- FORMAL_004: min_clearance
- FORMAL_005: no_self_collision

### Stability (2 constraints)
- FORMAL_006: cog_stability
- FORMAL_010: resonance_margin

### Actuation (3 constraints)
- FORMAL_007: torque_limit
- FORMAL_008: jerk_limit
- FORMAL_009: actuator_duty_cycle

### Thermal (1 constraint)
- FORMAL_011: thermal_limit

### Kinematic (1 constraint)
- FORMAL_012: joint_range_limit

### Payload (1 constraint)
- FORMAL_013: payload_ratio

### Stiffness (2 constraints)
- FORMAL_014: stiffness_minimum
- FORMAL_028: stiffness_mismatch

### Electrical (1 constraint)
- FORMAL_015: voltage_limit

### Control Stability (7 constraints)
- FORMAL_016: control_bandwidth_margin
- FORMAL_017: latency_margin
- FORMAL_018: phase_margin
- FORMAL_019: gain_margin
- FORMAL_020: sampling_nyquist
- FORMAL_021: encoder_resolution
- FORMAL_022: control_energy_bound

### Material Degradation (6 constraints)
- FORMAL_023: fatigue_safety_factor
- FORMAL_024: creep_risk
- FORMAL_025: stress_corrosion_risk
- FORMAL_026: uv_degradation_risk
- FORMAL_027: safety_factor_static
- FORMAL_029: creep_envelope

### Material-Environment Coupling (1 constraint)
- FORMAL_030: thermal_material_coupling

### Interaction (2 constraints)
- FORMAL_031: contact_pressure
- FORMAL_032: tissue_crush_risk
- FORMAL_035: slip_margin

### Joint/Adhesive (2 constraints)
- FORMAL_033: bolt_shear
- FORMAL_034: adhesive_load

### Corrosion (1 constraint)
- FORMAL_036: corrosion_rate

## Detection Performance

### Overall Metrics
- **Failure Injection:** 100.0% (10/10) ✓
- **Adversarial:** 36.7% (11/30)
- **False Positive Rate:** 0.0%
- **Target:** 50%+ adversarial detection

### By Category (Adversarial)
- Control: 80.0% (4/5) — **Strong**
- Mechanical: 60.0% (3/5) — **Moderate**
- Thermal: 50.0% (2/4) — **Moderate**
- Material: 25.0% (1/4) — **Weak**
- Geometric: 25.0% (1/4) — **Weak**
- Interaction: 0.0% (0/4) — **Critical Gap**
- Emergent: 0.0% (0/4) — **Critical Gap**

## Priority Gaps

### Critical (0% detection)
1. **Interaction failures** — Need better design data mapping or case updates
2. **Emergent failures** — Need multi-constraint interaction detection

### High Priority (25-50% detection)
1. **Material degradation** — Need enhanced creep/SCC/UV modeling
2. **Geometric tolerance** — Need statistical stackup analysis
3. **Thermal variations** — Need cooling degradation and ambient modeling

### Medium Priority (50-80% detection)
1. **Mechanical borderline** — Need uncertainty propagation
2. **Thermal transients** — Need transient thermal modeling

## Recommendations

1. **Immediate:** Update adversarial case YAML files to include design data fields for interaction constraints (contact_force_n, contact_area_mm2, normal_force_n, friction_coefficient, tangential_force_n)

2. **Short-term:** Add multi-constraint interaction detection for emergent failures

3. **Medium-term:** Enhance material degradation constraints with better design data mapping

4. **Long-term:** Add statistical tolerance analysis and uncertainty propagation for borderline violations
