# Experiment Card: Robotic Arm Fatigue and Wear

## Design Intent
Robotic arm for repeated surgical tasks (1000+ cycles) with precision requirements.

## Top Risks (from SPINE analysis)

1. **Fatigue at joints** (RPN: 140)
   - Severity: High
   - Likelihood: 6/10
   - Detectability: 4/10
   - Mitigation: Fatigue analysis, material selection, cycle limits

2. **Backlash accumulation** (RPN: 120)
   - Severity: High
   - Likelihood: 5/10
   - Detectability: 5/10
   - Mitigation: Preload maintenance, wear monitoring

3. **Actuator wear** (RPN: 100)
   - Severity: Medium
   - Likelihood: 6/10
   - Detectability: 4/10
   - Mitigation: Lubrication, duty cycle management

## Required Measurements

- **Joint play:** Backlash measurement over cycles (mm)
- **Position accuracy drift:** Position error vs cycle count (mm)
- **Actuator efficiency:** Torque output vs input over cycles (%)
- **Fatigue indicators:** Cracks, deformation, stiffness change

## Cheapest Falsification Test

**1000-cycle endurance run with position measurement**

- **Test type:** Bench test
- **Cost:** Medium
- **Time:** Weeks (continuous operation)
- **Equipment:** Test fixture, position measurement system, cycle counter
- **Procedure:** Run arm through 1000 cycles of representative surgical motion. Measure position accuracy, joint play, actuator performance at intervals.
- **Falsification criterion:** Position error <0.1mm after 1000 cycles, backlash <0.05mm
- **Confirmation criterion:** Position error >0.2mm OR backlash >0.1mm within 1000 cycles

## Expected Signals

- **Backlash progression:** Play vs cycle count (mm)
- **Position error trend:** Accuracy degradation over time (mm)
- **Actuator efficiency:** Efficiency vs cycles (%)
- **Failure point:** Cycle count at which performance degrades below threshold

## Data to Feed Back

- Backlash after 1000 cycles: _____ mm
- Position error trend: _____ mm/1000 cycles
- Actuator efficiency loss: _____ %
- Estimated service life: _____ cycles
