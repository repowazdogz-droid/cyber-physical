# Experiment Card: Soft Gripper Slip Risk

## Design Intent
Soft gripper for tissue manipulation with force-controlled actuation.

## Top 3 RPN Risks (from SPINE analysis)

1. **Slip under load** (RPN: 125)
   - Severity: High
   - Likelihood: 5/10
   - Detectability: 5/10
   - Mitigation: Increase friction coefficient or normal force

2. **Excessive force damage** (RPN: 100)
   - Severity: High
   - Likelihood: 4/10
   - Detectability: 5/10
   - Mitigation: Implement force limiting

3. **Tissue compliance variation** (RPN: 80)
   - Severity: Medium
   - Likelihood: 6/10
   - Detectability: 3/10
   - Mitigation: Adaptive force control

## Required Measurements

- **Force:** Applied normal force (N), tangential force (N)
- **Friction coefficient:** Static and dynamic μ on representative tissue
- **Tissue compliance:** Force-displacement curve (mm/N)
- **Contact area:** Effective contact area under load (mm²)

## Cheapest Falsification Test

**Bench slip test at 150% operating force**

- **Test type:** Bench test
- **Cost:** Low
- **Time:** Hours
- **Equipment:** Force gauge, test fixture, representative tissue surface
- **Procedure:** Apply increasing normal force until slip occurs. Measure slip threshold.
- **Falsification criterion:** No slip observed up to 150% of expected operating force
- **Confirmation criterion:** Slip occurs below expected operating force

## Expected Signals

- **Slip threshold:** Force at which slip initiates (N)
- **Force-displacement curve:** Compliance measurement (mm/N)
- **Friction coefficient:** Measured μ from slip threshold

## Data to Feed Back

- Actual slip force: _____ N
- Measured friction coefficient: _____
- Tissue compliance: _____ mm/N
- Contact area under load: _____ mm²
