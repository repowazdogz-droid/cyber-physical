"""Replication gate and variance enforcement.

Evaluates multiple experiment runs: run count, variance, improvement over baseline.
"""

import math
import statistics

from omega_research.config import OmegaResearchConfig
from omega_research.models import ExperimentResult, ReplicationVerdict


class ReplicationGate:
    """Evaluates whether replication is sufficient and improvement is significant."""

    def __init__(self, config: OmegaResearchConfig) -> None:
        self.config = config

    def evaluate_results(
        self,
        results: list[ExperimentResult],
        baseline_metrics: dict[str, float],
        target_metric: str,
    ) -> ReplicationVerdict:
        """
        Given multiple runs of the same experiment:
        1. Check if enough runs exist
        2. Compute mean, variance, coefficient of variation
        3. Check if improvement over baseline is real
        4. Return verdict
        """
        required = self.config.min_replication_runs
        details: list[str] = []

        if target_metric not in baseline_metrics:
            raise ValueError(
                f"Baseline metrics missing target metric '{target_metric}'. "
                f"Available: {list(baseline_metrics.keys())}"
            )

        values: list[float] = []
        for r in results:
            if target_metric not in r.metrics:
                raise ValueError(
                    f"Target metric '{target_metric}' not in result metrics. "
                    f"Available: {list(r.metrics.keys())}"
                )
            values.append(r.metrics[target_metric])

        run_count = len(results)
        if run_count < required:
            return ReplicationVerdict(
                sufficient_runs=False,
                run_count=run_count,
                required_runs=required,
                mean_value=statistics.mean(values) if values else 0.0,
                variance=statistics.pvariance(values) if len(values) >= 2 else 0.0,
                std_dev=statistics.stdev(values) if len(values) >= 2 else 0.0,
                coefficient_of_variation=0.0,
                improvement_over_baseline=0.0,
                improvement_significant=False,
                verdict="insufficient_runs",
                details=[f"Need at least {required} runs, got {run_count}."],
            )

        mean_val = statistics.mean(values)
        baseline_value = baseline_metrics[target_metric]

        if len(values) == 1:
            variance_val = 0.0
            std_dev_val = 0.0
        else:
            variance_val = statistics.pvariance(values)
            std_dev_val = statistics.stdev(values)

        cv = std_dev_val / abs(mean_val) if mean_val != 0 else float("inf")
        if math.isinf(cv):
            cv = 0.0

        abs_baseline = abs(baseline_value)
        if abs_baseline == 0:
            improvement = 0.0
            details.append("Baseline value is zero; improvement fraction undefined.")
        else:
            improvement = (mean_val - baseline_value) / abs_baseline

        improvement_significant = False
        verdict = "pass"

        if cv > self.config.max_acceptable_cv:
            verdict = "high_variance"
            details.append(f"CV {cv:.4f} exceeds max {self.config.max_acceptable_cv}.")
        elif abs(improvement) < self.config.improvement_threshold:
            verdict = "insignificant_improvement"
            details.append(
                f"Improvement {improvement:.4f} below threshold {self.config.improvement_threshold}."
            )
        elif std_dev_val > abs(mean_val - baseline_value):
            verdict = "high_variance"
            details.append(
                "std_dev exceeds improvement magnitude — effect may be noise"
            )
        else:
            improvement_significant = True

        return ReplicationVerdict(
            sufficient_runs=True,
            run_count=run_count,
            required_runs=required,
            mean_value=mean_val,
            variance=variance_val,
            std_dev=std_dev_val,
            coefficient_of_variation=cv,
            improvement_over_baseline=improvement,
            improvement_significant=improvement_significant,
            verdict=verdict,
            details=details,
        )
