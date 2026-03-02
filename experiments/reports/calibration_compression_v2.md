# Calibration Compression Report (v2)

**Generated:** 2026-02-05 13:10
**Total experiments:** 60 (20 original + 40 batch2)

## Ledger integrity

- Record count: 60
- Hash valid: True
- Last write: 2026-02-05T13:10:10.206368

## Calibration slope (learning velocity)

- Window: 10 experiments
- Slope: -0.0017
- Improving (error trending down): **True**

Error trend (rolling mean calibration error by experiment index):

```
0.3000,0.3000,0.3000,0.3000,0.3000,0.2833,0.2714,0.2625,0.2556,0.2500,0.2300,0.2100,0.1900,0.1700,0.1500,0.1500,0.1500,0.1500,0.1500,0.1500,0.1700,0.1900,0.2100,0.2300,0.2500,0.2600,0.2700,0.2800,0.2900,0.3000,0.2900,0.2800,0.2700,0.2600,0.2500,0.2400,0.2300,0.2200,0.2100,0.2000,0.1900,0.1800,0.1700,0.1600,0.1500,0.1400,0.1300,0.1200,0.1100,0.1000,0.1100,0.1200,0.1300,0.1400,0.1500,0.1600,0.1700,0.1800,0.1900,0.2000
```

## Confidence calibration (band vs actual accuracy)

| Band | n_predictions | n_correct | expected_accuracy | actual_accuracy | gap |
|------|---------------|----------|--------------------|-----------------|-----|
| 0.0-0.4 | 55 | 55 | 0.20 | 1.00 | +0.80 |
| 0.4-0.6 | 0 | 0 | 0.50 | 0.00 | -0.50 |
| 0.6-0.8 | 0 | 0 | 0.70 | 0.00 | -0.70 |
| 0.8-1.0 | 5 | 5 | 0.90 | 1.00 | +0.10 |

## Information gain & learning efficiency

- Total info gain: 0
- Avg per experiment: 0.000
- By category:
  - failure_elimination: 0.000
  - unknown: 0.000
  - uncertainty_collapse: 0.000

## Experiment lineage (sample)

Ordered by timestamp; first 10 and last 10:

- exp_01_slip_steel_dry @ 2026-02-05T13:09:46.452310 outcome=False
- exp_02_slip_wet_tissue @ 2026-02-05T13:09:46.458631 outcome=False
- exp_03_slip_silicone_glass @ 2026-02-05T13:09:46.464218 outcome=False
- exp_04_slip_textured @ 2026-02-05T13:09:46.470244 outcome=False
- exp_05_slip_high_speed @ 2026-02-05T13:09:46.476319 outcome=False
- exp_06_force_soft_tissue @ 2026-02-05T13:09:46.482483 outcome=False
- exp_07_force_cartilage @ 2026-02-05T13:09:46.488857 outcome=False
- exp_08_force_ramp @ 2026-02-05T13:09:46.494897 outcome=False
- exp_09_force_cyclic @ 2026-02-05T13:09:46.500868 outcome=False
- exp_10_force_impulse @ 2026-02-05T13:09:46.507201 outcome=False
...

- E051 @ 2026-02-05T13:10:10.172066 outcome=False
- E052 @ 2026-02-05T13:10:10.175560 outcome=False
- E053 @ 2026-02-05T13:10:10.179013 outcome=False
- E054 @ 2026-02-05T13:10:10.182595 outcome=False
- E055 @ 2026-02-05T13:10:10.186366 outcome=False
- E056 @ 2026-02-05T13:10:10.189822 outcome=False
- E057 @ 2026-02-05T13:10:10.193470 outcome=False
- E058 @ 2026-02-05T13:10:10.197067 outcome=False
- E059 @ 2026-02-05T13:10:10.200823 outcome=False
- E060 @ 2026-02-05T13:10:10.204582 outcome=False

## Summary statistics

- Mean calibration error (all): 0.200
- Records with outcomes: 60

## Comparison: first 20 vs last 40

- First 20 mean error: 0.200
- Last 40 mean error: 0.200
- Delta: +0.000 (negative = improving)

## Honest assessment

- **Is error trending down?** True
- **First 20 vs last 40:** No improvement or worse
- **Is the system learning from experience?** Evidence suggests calibration is stable or improving with more data.
