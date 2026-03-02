"""Tests for replication gate and variance enforcement."""

import pytest

from omega_research.config import OmegaResearchConfig
from omega_research.models import ExperimentResult
from omega_research.replication import ReplicationGate


class TestReplicationGate:
    def test_insufficient_runs_single(
        self,
        three_good_results: list[ExperimentResult],
    ) -> None:
        """1 run when 3 required → insufficient_runs."""
        gate = ReplicationGate(OmegaResearchConfig())
        one_result = three_good_results[:1]
        baseline = {"loss": 2.5}
        verdict = gate.evaluate_results(one_result, baseline, "loss")
        assert verdict.verdict == "insufficient_runs"
        assert not verdict.sufficient_runs
        assert verdict.run_count == 1
        assert verdict.required_runs == 3

    def test_insufficient_runs_two(
        self,
        three_good_results: list[ExperimentResult],
    ) -> None:
        """2 runs when 3 required → insufficient_runs."""
        gate = ReplicationGate(OmegaResearchConfig())
        two_results = three_good_results[:2]
        baseline = {"loss": 2.5}
        verdict = gate.evaluate_results(two_results, baseline, "loss")
        assert verdict.verdict == "insufficient_runs"
        assert verdict.run_count == 2

    def test_pass_three_consistent_runs(
        self,
        three_good_results: list[ExperimentResult],
    ) -> None:
        """3 runs, low variance, clear improvement → pass."""
        gate = ReplicationGate(OmegaResearchConfig())
        baseline = {"loss": 2.5}
        verdict = gate.evaluate_results(three_good_results, baseline, "loss")
        assert verdict.verdict == "pass"
        assert verdict.sufficient_runs
        assert verdict.improvement_significant
        assert verdict.run_count == 3

    def test_high_variance_rejects(
        self,
        three_noisy_results: list[ExperimentResult],
    ) -> None:
        """3 runs but CV > 10% → high_variance."""
        gate = ReplicationGate(OmegaResearchConfig())
        baseline = {"loss": 2.0}
        verdict = gate.evaluate_results(three_noisy_results, baseline, "loss")
        assert verdict.verdict == "high_variance"
        assert verdict.sufficient_runs
        assert verdict.coefficient_of_variation > 0.10

    def test_insignificant_improvement_rejects(
        self,
        three_marginal_results: list[ExperimentResult],
    ) -> None:
        """3 runs, low variance, but < 1% improvement → insignificant_improvement."""
        gate = ReplicationGate(OmegaResearchConfig())
        baseline = {"loss": 2.5}
        verdict = gate.evaluate_results(three_marginal_results, baseline, "loss")
        assert verdict.verdict == "insignificant_improvement"
        assert abs(verdict.improvement_over_baseline) < 0.01

    def test_identical_runs_zero_variance(
        self,
        three_good_results: list[ExperimentResult],
    ) -> None:
        """All runs identical → cv = 0, passes."""
        from datetime import datetime

        base = datetime.now()
        identical = [
            ExperimentResult(
                experiment_id=f"run-{i}",
                metrics={"loss": 2.0},
                runtime_minutes=10.0,
                actual_gpu_memory_gb=24.0,
                seed=i,
                completed_at=base,
            )
            for i in range(3)
        ]
        gate = ReplicationGate(OmegaResearchConfig())
        baseline = {"loss": 2.5}
        verdict = gate.evaluate_results(identical, baseline, "loss")
        assert verdict.verdict == "pass"
        assert verdict.coefficient_of_variation == 0.0
        assert verdict.variance == 0.0

    def test_missing_target_metric_raises(
        self,
        three_good_results: list[ExperimentResult],
    ) -> None:
        """Target metric not in results → clear error."""
        gate = ReplicationGate(OmegaResearchConfig())
        baseline = {"loss": 2.5}
        with pytest.raises(ValueError) as exc_info:
            gate.evaluate_results(three_good_results, baseline, "nonexistent_metric")
        assert "nonexistent_metric" in str(exc_info.value)
        assert "not in result" in str(exc_info.value).lower() or "missing" in str(exc_info.value).lower()

    def test_baseline_metric_missing_raises(
        self,
        three_good_results: list[ExperimentResult],
    ) -> None:
        """Baseline doesn't have target metric → clear error."""
        gate = ReplicationGate(OmegaResearchConfig())
        baseline = {"accuracy": 0.9}
        with pytest.raises(ValueError) as exc_info:
            gate.evaluate_results(three_good_results, baseline, "loss")
        assert "loss" in str(exc_info.value)
        assert "baseline" in str(exc_info.value).lower() or "missing" in str(exc_info.value).lower()
