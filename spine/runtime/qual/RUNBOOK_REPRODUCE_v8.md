# SPINE v8 Reproduction Runbook

## Prerequisites

- Python 3.8+
- No external packages required (uses only standard library)

## Single Command to Run All Suites

```bash
cd ~/Omega/spine/runtime
python3 run_all_suites.py
```

## Expected Output

The script will:
1. Run main adversarial suite (30 cases)
2. Run geometry adversarial suite (10 cases)
3. Run holdout suite (15 cases)
4. Run failure injection suite (10 cases)
5. Generate summary statistics

**Expected Results:**
- Main adversarial: 70.0% detection (21/30)
- Geometry adversarial: 100.0% detection (10/10)
- Holdout: 100.0% detection (15/15)
- Failure injection: 100.0% detection (10/10)
- False positive rate: 0.0%

## Verification

Results match if:
- Detection rates are within ±2% of expected values
- False positive count = 0
- All suite hashes match (if provided)

## Troubleshooting

- **Import errors:** Ensure you're in `~/Omega/spine/runtime` directory
- **File not found:** Verify all case files exist in `cases/` subdirectories
- **Different results:** Check Python version (3.8+ required)
