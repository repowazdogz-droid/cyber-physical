#!/usr/bin/env python3
"""Run all 20 closed-loop experiments and generate calibration report."""

import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from experiments.experiment_runner import run_closed_loop
from spine.runtime.unified_ledger import UnifiedLedger


def main():
    experiments_dir = Path(__file__).parent / "cases"
    case_files = sorted(experiments_dir.glob("exp_*.yaml"))
    
    print("=" * 70)
    print("CLOSED-LOOP EXPERIMENTS v1")
    print("=" * 70)
    print()
    
    results = []
    ledger = UnifiedLedger()

    for case_file in case_files:
        print(f"Running: {case_file.name}...")
        try:
            result = run_closed_loop(case_file, ledger=ledger)
            results.append(result)
            print(f"  ✓ Completed: {result['experiment']}")
            print(f"    Prediction: {result['predicted_confidence']:.2f}, Outcome: {result['outcome']}, Error: {result['calibration_error']:.3f}")
        except Exception as e:
            print(f"  ✗ Error: {e}")
            results.append({
                "case_id": case_file.stem,
                "error": str(e)
            })
        print()
    
    # Generate report (reuse same ledger instance so stats match persisted data)
    report_path = Path(__file__).parent / "reports" / "closed_loop_v1.md"
    report_path.parent.mkdir(exist_ok=True)

    calibration_stats = ledger.get_calibration_stats()
    integrity = ledger.verify_integrity()
    
    with open(report_path, 'w') as f:
        f.write("# Closed-Loop Experiments Report (v1)\n\n")
        f.write(f"**Analysis Date:** {datetime.now().strftime('%Y-%m-%d')}\n")
        f.write(f"**Total Experiments:** {len(results)}\n\n")
        
        f.write("## Summary\n\n")
        f.write(f"- **Total Experiments:** {len(results)}\n")
        f.write(f"- **Mean Calibration Error:** {calibration_stats['mean_error']:.3f}\n")
        f.write(f"- **Records with Outcomes:** {calibration_stats['total_records']}\n\n")
        
        f.write("## Results by Experiment\n\n")
        f.write("| Experiment | Spine Prediction | Forge Hypothesis | Sim Outcome | Prediction Correct? | Calibration Error |\n")
        f.write("|------------|------------------|------------------|-------------|---------------------|-------------------|\n")
        
        for result in results:
            if 'error' in result:
                f.write(f"| {result['case_id']} | ERROR | ERROR | ERROR | ERROR | ERROR |\n")
                continue
            
            spine_pred = f"{result['spine_risks']} risks"
            forge_hyp = f"{result['forge_hypotheses']} hypotheses"
            outcome = "Yes" if result['outcome'] else "No" if result['outcome'] is not None else "N/A"
            correct = "✓" if result.get('calibration_error', 1.0) < 0.3 else "✗"
            error = f"{result.get('calibration_error', 0.0):.3f}"
            
            f.write(f"| {result['case_id']} | {spine_pred} | {forge_hyp} | {outcome} | {correct} | {error} |\n")
        
        f.write("\n## Calibration Statistics\n\n")
        f.write(f"- **Mean Error:** {calibration_stats['mean_error']:.3f}\n")
        f.write(f"- **By Category:**\n")
        for cat, error in calibration_stats['by_category'].items():
            f.write(f"  - {cat}: {error:.3f}\n")
        f.write(f"- **By Confidence Band:**\n")
        for band, error in calibration_stats['by_confidence_band'].items():
            f.write(f"  - {band}: {error:.3f}\n")
        
        f.write("\n## Calibration Curve Data\n\n")
        f.write("Confidence bands vs actual outcome rate:\n\n")
        
        # Group by confidence bands
        low_conf = [r for r in results if r.get('predicted_confidence', 0.5) < 0.5]
        med_conf = [r for r in results if 0.5 <= r.get('predicted_confidence', 0.5) < 0.8]
        high_conf = [r for r in results if r.get('predicted_confidence', 0.5) >= 0.8]
        
        low_outcome_rate = sum(1 for r in low_conf if r.get('outcome')) / len(low_conf) if low_conf else 0.0
        med_outcome_rate = sum(1 for r in med_conf if r.get('outcome')) / len(med_conf) if med_conf else 0.0
        high_outcome_rate = sum(1 for r in high_conf if r.get('outcome')) / len(high_conf) if high_conf else 0.0
        
        f.write(f"- Low confidence (<0.5): Predicted ~0.3, Actual {low_outcome_rate:.2f}\n")
        f.write(f"- Medium confidence (0.5-0.8): Predicted ~0.65, Actual {med_outcome_rate:.2f}\n")
        f.write(f"- High confidence (>0.8): Predicted ~0.9, Actual {high_outcome_rate:.2f}\n")
        
        f.write("\n## Honest Assessment\n\n")
        
        well_calibrated = sum(1 for r in results if r.get('calibration_error', 1.0) < 0.2)
        poorly_calibrated = sum(1 for r in results if r.get('calibration_error', 0.0) >= 0.5)
        
        f.write(f"**Well-Calibrated Predictions:** {well_calibrated}/{len(results)} ({well_calibrated/len(results)*100:.1f}%)\n")
        f.write(f"**Poorly-Calibrated Predictions:** {poorly_calibrated}/{len(results)} ({poorly_calibrated/len(results)*100:.1f}%)\n\n")
        
        f.write("**Key Findings:**\n")
        f.write("1. Mean calibration error provides baseline for system calibration\n")
        f.write("2. Confidence bands show how well predicted confidence matches actual outcomes\n")
        f.write("3. Category-based errors identify which hypothesis types need improvement\n")
        f.write("4. Closed-loop infrastructure enables continuous calibration\n")

        f.write("\n## Ledger Integrity\n\n")
        f.write(f"- **Record count:** {integrity['record_count']}\n")
        f.write(f"- **Hash valid:** {integrity['hash_valid']}\n")
        f.write(f"- **Last write (UTC):** {integrity['last_write_timestamp'] or 'N/A'}\n")
    
    print(f"Report generated: {report_path}")
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total Experiments: {len(results)}")
    print(f"Mean Calibration Error: {calibration_stats['mean_error']:.3f}")
    print(f"Records with Outcomes: {calibration_stats['total_records']}")
    rc, hv = integrity["record_count"], integrity["hash_valid"]
    print(f"Ledger: {rc} records, hash valid={hv}, integrity OK" if (rc == 20 and hv) else f"Ledger: {rc} records, hash valid={hv} (CHECK REQUIRED)")
    print()


if __name__ == "__main__":
    main()
