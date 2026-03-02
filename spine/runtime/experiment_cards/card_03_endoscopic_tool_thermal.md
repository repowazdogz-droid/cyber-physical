# Experiment Card: Endoscopic Tool Thermal Management

## Design Intent
Endoscopic tool operating for extended procedure (2+ hours) with motorized actuation.

## Top Risks (from SPINE analysis)

1. **Thermal buildup** (RPN: 140)
   - Severity: High
   - Likelihood: 6/10
   - Detectability: 4/10
   - Mitigation: Active cooling, duty cycle limiting

2. **Motor duty cycle violation** (RPN: 120)
   - Severity: High
   - Likelihood: 5/10
   - Detectability: 5/10
   - Mitigation: Reduce continuous operation time

3. **Tissue contact temperature** (RPN: 100)
   - Severity: High
   - Likelihood: 4/10
   - Detectability: 3/10
   - Mitigation: Thermal insulation, temperature monitoring

## Required Measurements

- **Surface temperature:** Tool surface temp over time (°C)
- **Motor current:** Current draw vs time (A)
- **Duty cycle:** On-time / total time ratio
- **Tissue contact temp:** Temperature at tissue interface (°C)

## Cheapest Falsification Test

**2-hour continuous operation thermal profile**

- **Test type:** Bench test
- **Cost:** Medium
- **Time:** Days (includes setup and analysis)
- **Equipment:** Thermal camera, current sensor, tissue phantom, environmental chamber
- **Procedure:** Run tool continuously for 2 hours. Record temperature time-series, motor current, duty cycle.
- **Falsification criterion:** Peak temperature <60°C, duty cycle <80%
- **Confirmation criterion:** Peak temperature >70°C OR duty cycle >95%

## Expected Signals

- **Temperature time-series:** Surface temp vs time (°C)
- **Peak temperatures:** Maximum temp reached (°C)
- **Duty cycle profile:** On/off ratio over time
- **Thermal time constant:** Rate of temperature rise (s)

## Data to Feed Back

- Peak surface temperature: _____ °C
- Average duty cycle: _____ %
- Thermal time constant: _____ s
- Tissue contact temperature: _____ °C
