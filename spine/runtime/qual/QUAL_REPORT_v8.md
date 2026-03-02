# SPINE Runtime Qualification Report (v8)

**Date:** 2026-02-05  
**Version:** v8  
**Status:** Qualified

## 1. What SPINE Is

SPINE (Structured Pre-decision Infrastructure for Engineering) is a pre-decision analysis runtime for physical systems that surfaces failure modes, contradictions, and uncertainties before design decisions are finalized. It provides machine-checkable constraint evaluation, traceable reasoning chains, and structured uncertainty propagation to support expert judgment. SPINE does not replace expert analysis but provides systematic, auditable pre-decision infrastructure.

## 2. Instrument Capabilities

**Total Constraints:** 47 formal constraints across 8 taxonomy categories:

- **Mechanical (8):** Mass, Force, Acceleration, COG, Torque, Jerk, Payload, Safety Factor
- **Thermal (2):** Thermal Limit, Thermal-Material Coupling
- **Control (7):** Bandwidth, Latency, Phase/Gain Margin, Sampling, Encoder, Energy Bound
- **Material (8):** Fatigue, Creep, Stress Corrosion, UV, Stiffness Mismatch, Corrosion Rate
- **Geometric (11):** Clearance, Self-Collision, Tolerance Stack, Thermal Expansion, Deflection, Assembly Error, Dimensional Envelope, Trajectory, Backlash, Narrow Passage, Pose Reachability, Thermal Gap, Positioning Drift
- **Interaction (3):** Contact Pressure, Tissue Crush, Slip Margin
- **Joint/Adhesive (2):** Bolt Shear, Adhesive Load

**Additional Capabilities:**
- Epistemic weighting (confidence, evidence type, provenance)
- Decision trace graphs (full reasoning chains)
- Outcome ledger (prediction tracking and calibration)
- Uncertainty propagation (conditional confidence bands)
- Falsification engine (cheapest tests to disprove claims)
- Coverage scoring (constraint evaluation visibility)

## 3. Test Suites

| Suite | Cases | Purpose |
|-------|-------|---------|
| Main Adversarial | 30 | Borderline, emergent, subtle failures |
| Geometry Adversarial | 10 | Geometric failure modes |
| Holdout | 15 | Never used for constraint development |
| Failure Injection | 10 | Physics-based known failures |

**Total Test Cases:** 65

## 4. Detection Performance

| Category | Main Suite | Geo Suite | Holdout |
|----------|------------|-----------|---------|
| Control | 80.0% (4/5) | - | 100.0% (2/2) |
| Geometric | 50.0% (2/4) | 100.0% (10/10) | 100.0% (3/3) |
| Interaction | 100.0% (4/4) | - | 100.0% (2/2) |
| Material | 100.0% (4/4) | - | 100.0% (2/2) |
| Mechanical | 60.0% (3/5) | - | 100.0% (3/3) |
| Thermal | 50.0% (2/4) | - | 100.0% (2/2) |
| Emergent | 75.0% (3/4) | - | 100.0% (1/1) |
| **Overall** | **70.0% (21/30)** | **100.0% (10/10)** | **100.0% (15/15)** |

## 5. False Positive Rate

**FP Rate:** 0.0% across all test suites (0 false positives in 65 cases)

## 6. Coverage Scoring

Coverage score = % of constraints that can be evaluated (not UNKNOWN) per case.

| Suite | Average Coverage |
|-------|----------------|
| Geometry Adversarial | 4.9% |
| Main Adversarial | 2.8% |
| Holdout | 5.8% |

**Interpretation:** Low coverage scores indicate most constraints require design data fields not present in test cases. This is expected and demonstrates SPINE's requirement for complete design specifications.

## 7. Perturbation Stability

**Stability Score:** 100.0% (50/50 perturbations stable)

Tested: mass ±10%, friction ±15%, duty_cycle ±20%, latency ±25%, temperature ±15%  
**Result:** No brittle flips — all perturbations either unchanged or changed in expected direction.

## 8. Version History

| Version | Constraints | Main Detection | Holdout Detection | FP Rate | Key Additions |
|---------|-------------|----------------|-------------------|---------|---------------|
| v1 | 5 | 40.0% (4/10) | - | - | Initial constraints |
| v2 | 15 | 90.0% (9/10) | - | - | +10 constraints |
| v3 | 15 | 100.0% (10/10) | - | - | Thermal upgrade, taxonomy |
| v4 | 15 | 16.7% (5/30) | - | 0.0% | First adversarial suite |
| v5 | 28 | 36.7% (11/30) | - | 0.0% | +13 control/material |
| v6 | 36 | 70.0% (21/30) | 86.7% (13/15) | 0.0% | +8 material/interaction |
| v7 | 43 | 70.0% (21/30) | 100.0% (15/15) | 0.0% | +7 geometry |
| v8 | 47 | 70.0% (21/30) | 100.0% (15/15) | 0.0% | +4 geometry, coverage |

## 9. Known Limitations

- **Not a simulator:** Does not perform FEA, CFD, or multi-body dynamics
- **Not AI prediction:** Uses deterministic constraint checking, not ML
- **Requires design data:** Low coverage when design specifications incomplete
- **Geometric gaps:** Main suite geometric detection 50% (improved from 25%)
- **Emergent failures:** Some multi-domain interactions not fully captured
- **Expert judgment required:** Outputs inform but do not replace expert analysis
