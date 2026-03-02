# Experiment Card: Pediatric Instrument Force Limits

## Design Intent
Instrument for pediatric spine with strict force limits due to small anatomy and tissue fragility.

## Top Risks (from SPINE analysis)

1. **Force overshoot** (RPN: 150)
   - Severity: Critical
   - Likelihood: 4/10
   - Detectability: 3/10
   - Mitigation: Force limiting, haptic feedback

2. **Tissue crush** (RPN: 125)
   - Severity: High
   - Likelihood: 5/10
   - Detectability: 4/10
   - Mitigation: Contact pressure monitoring, force limits

3. **Small anatomy clearance** (RPN: 100)
   - Severity: High
   - Likelihood: 4/10
   - Detectability: 5/10
   - Mitigation: Miniaturized design, clearance verification

## Required Measurements

- **Applied force:** Peak and average force during operation (N)
- **Contact area:** Effective contact area (mm²)
- **Clearance:** Minimum clearance to adjacent structures (mm)
- **Contact pressure:** Force / area (MPa)

## Cheapest Falsification Test

**Force-limited actuation on tissue phantom**

- **Test type:** Bench test
- **Cost:** Low
- **Time:** Hours
- **Equipment:** Force-controlled actuator, tissue phantom, clearance measurement tools
- **Procedure:** Apply instrument to pediatric tissue phantom. Measure force, contact area, clearance. Verify force limiting works.
- **Falsification criterion:** Force stays <2N, contact pressure <0.5 MPa, clearance >1mm
- **Confirmation criterion:** Force >2N OR pressure >0.5 MPa OR clearance <1mm

## Expected Signals

- **Peak force:** Maximum force applied (N)
- **Contact pressure:** Force / area (MPa)
- **Minimum clearance:** Smallest gap to adjacent structures (mm)
- **Force limiting effectiveness:** % of time force limit respected

## Data to Feed Back

- Peak applied force: _____ N
- Contact pressure: _____ MPa
- Minimum clearance: _____ mm
- Force limit compliance: _____ %
