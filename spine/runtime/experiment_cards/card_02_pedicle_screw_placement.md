# Experiment Card: Pedicle Screw Placement Accuracy

## Design Intent
Screw placement accuracy for spinal fusion with freehand technique.

## Top Risks (from SPINE analysis)

1. **Aortic proximity violation** (RPN: 150)
   - Severity: Critical
   - Likelihood: 3/10
   - Detectability: 2/10
   - Mitigation: Image guidance, trajectory planning

2. **Screw trajectory deviation** (RPN: 120)
   - Severity: High
   - Likelihood: 5/10
   - Detectability: 4/10
   - Mitigation: Navigation system, verification imaging

3. **Bone density variation** (RPN: 90)
   - Severity: Medium
   - Likelihood: 6/10
   - Detectability: 3/10
   - Mitigation: Pre-op CT assessment, alternative fixation

## Required Measurements

- **Screw angle:** Planned vs actual trajectory (degrees)
- **Penetration depth:** Screw length inserted (mm)
- **Proximity to aorta:** Minimum distance to vascular structures (mm)
- **Bone density:** Hounsfield units from CT

## Cheapest Falsification Test

**Cadaveric or phantom placement with CT verification**

- **Test type:** Bench test (cadaveric) or simulation (phantom)
- **Cost:** Medium
- **Time:** Days
- **Equipment:** Cadaver/phantom, surgical tools, CT scanner
- **Procedure:** Perform freehand screw placement. Acquire CT. Measure actual vs planned trajectory and proximity.
- **Falsification criterion:** All screws within 5° of planned trajectory, >5mm from aorta
- **Confirmation criterion:** Deviation >5° OR proximity <5mm

## Expected Signals

- **Trajectory deviation:** Angular error (degrees)
- **Proximity measurements:** Distance to critical structures (mm)
- **Placement accuracy:** Success rate within tolerance

## Data to Feed Back

- Actual trajectory deviation: _____ degrees
- Minimum proximity to aorta: _____ mm
- Bone density (HU): _____
- Placement success rate: _____ %
