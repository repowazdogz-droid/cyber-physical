#!/usr/bin/env python3
"""Run batch2 experiments (E021-E060), append to unified ledger, generate calibration_compression_v2 report."""

import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from experiments.experiment_runner import run_closed_loop
from spine.runtime.unified_ledger import UnifiedLedger


def main():
    batch_dir = Path(__file__).parent / "cases" / "batch2"
    case_files = sorted(batch_dir.glob("exp_E*.yaml"))
    if len(case_files) != 40:
        print(f"Expected 40 batch2 cases, found {len(case_files)}")
        sys.exit(1)

    ledger = UnifiedLedger()
    initial_count = len(ledger.records)
    print(f"Ledger loaded: {initial_count} existing records")
    print("=" * 70)
    print("BATCH2 EXPERIMENTS (E021-E060)")
    print("=" * 70)

    for i, case_file in enumerate(case_files):
        label = f"E{21 + i:03d}"
        print(f"Running {case_file.name} [{label}]...")
        try:
            result = run_closed_loop(case_file, ledger=ledger, experiment_label=label)
            print(f"  Completed: {result['experiment']}, outcome={result['outcome']}, err={result.get('calibration_error', 0):.3f}")
        except Exception as e:
            print(f"  Error: {e}")
            raise
    print()

    integrity = ledger.verify_integrity()
    print(f"Ledger: {integrity['record_count']} records, hash valid={integrity['hash_valid']}")
    if integrity["record_count"] != 60:
        print(f"WARNING: expected 60 records, got {integrity['record_count']}")
    else:
        print("Integrity OK: 60 records")

    report_path = Path(__file__).parent / "reports" / "calibration_compression_v2.md"
    report_path.parent.mkdir(exist_ok=True)
    write_calibration_report_v2(ledger, report_path, first_n=20, last_n=40)
    print(f"Report: {report_path}")


def write_calibration_report_v2(ledger: UnifiedLedger, path: Path, first_n: int = 20, last_n: int = 40):
    stats = ledger.get_calibration_stats()
    conf_cal = ledger.get_confidence_calibration()
    learning = ledger.get_learning_efficiency()
    lineage = ledger.get_experiment_lineage()
    slope_data = ledger.get_calibration_slope(window=10)
    integrity = ledger.verify_integrity()

    ordered = sorted(ledger.records.values(), key=lambda r: r.timestamp)
    first_set = [r for r in ordered if r.outcome is not None and r.calibration_error is not None][:first_n]
    last_set = [r for r in ordered if r.outcome is not None and r.calibration_error is not None][-last_n:]
    mean_first = sum(r.calibration_error for r in first_set) / len(first_set) if first_set else 0.0
    mean_last = sum(r.calibration_error for r in last_set) / len(last_set) if last_set else 0.0

    with open(path, "w") as f:
        f.write("# Calibration Compression Report (v2)\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"**Total experiments:** 60 (20 original + 40 batch2)\n\n")

        f.write("## Ledger integrity\n\n")
        f.write(f"- Record count: {integrity['record_count']}\n")
        f.write(f"- Hash valid: {integrity['hash_valid']}\n")
        f.write(f"- Last write: {integrity.get('last_write_timestamp', 'N/A')}\n\n")

        f.write("## Calibration slope (learning velocity)\n\n")
        f.write(f"- Window: 10 experiments\n")
        f.write(f"- Slope: {slope_data['slope']:.4f}\n")
        f.write(f"- Improving (error trending down): **{slope_data['improving']}**\n\n")
        f.write("Error trend (rolling mean calibration error by experiment index):\n\n")
        f.write("```\n")
        f.write(",".join(f"{x:.4f}" for x in slope_data["error_trend"][:80]))
        if len(slope_data["error_trend"]) > 80:
            f.write(",...")
        f.write("\n```\n\n")

        f.write("## Confidence calibration (band vs actual accuracy)\n\n")
        f.write("| Band | n_predictions | n_correct | expected_accuracy | actual_accuracy | gap |\n")
        f.write("|------|---------------|----------|--------------------|-----------------|-----|\n")
        for row in conf_cal:
            f.write(f"| {row['band']} | {row['n_predictions']} | {row['n_correct']} | {row['expected_accuracy']:.2f} | {row['actual_accuracy']:.2f} | {row['gap']:+.2f} |\n")
        f.write("\n")

        f.write("## Information gain & learning efficiency\n\n")
        f.write(f"- Total info gain: {learning['total_info_gain']}\n")
        f.write(f"- Avg per experiment: {learning['avg_per_experiment']:.3f}\n")
        f.write("- By category:\n")
        for cat, val in learning["by_category"].items():
            f.write(f"  - {cat}: {val:.3f}\n")
        f.write("\n")

        f.write("## Experiment lineage (sample)\n\n")
        f.write("Ordered by timestamp; first 10 and last 10:\n\n")
        for entry in lineage[:10]:
            f.write(f"- {entry['label']} @ {entry['timestamp']} outcome={entry['outcome']}\n")
        f.write("...\n\n")
        for entry in lineage[-10:]:
            f.write(f"- {entry['label']} @ {entry['timestamp']} outcome={entry['outcome']}\n")
        f.write("\n")

        f.write("## Summary statistics\n\n")
        f.write(f"- Mean calibration error (all): {stats['mean_error']:.3f}\n")
        f.write(f"- Records with outcomes: {stats['total_records']}\n\n")

        f.write("## Comparison: first 20 vs last 40\n\n")
        f.write(f"- First 20 mean error: {mean_first:.3f}\n")
        f.write(f"- Last 40 mean error: {mean_last:.3f}\n")
        f.write(f"- Delta: {mean_last - mean_first:+.3f} (negative = improving)\n\n")

        f.write("## Honest assessment\n\n")
        improving = slope_data["improving"] or mean_last < mean_first
        f.write(f"- **Is error trending down?** {slope_data['improving']}\n")
        f.write(f"- **First 20 vs last 40:** {'Last 40 better' if mean_last < mean_first else 'No improvement or worse'}\n")
        f.write("- **Is the system learning from experience?** ")
        if improving and mean_last <= mean_first:
            f.write("Evidence suggests calibration is stable or improving with more data.\n")
        else:
            f.write("Inconclusive or flat; more experiments or explicit learning loops would be needed to claim learning.\n")


if __name__ == "__main__":
    main()
