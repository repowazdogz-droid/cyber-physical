"""Tests for Pydantic models (governance schema validation)."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from omega_research.models import (
    AblationPlan,
    AblationTarget,
    BaselineDeclaration,
    ComputeBudget,
    Hypothesis,
    HypothesisType,
    ScalingHypothesis,
    ScalingHypothesisType,
)


class TestModels:
    def test_baseline_requires_changed_variables(self) -> None:
        """BaselineDeclaration with empty changed_variables → validation error."""
        with pytest.raises(ValidationError) as exc_info:
            BaselineDeclaration(
                baseline_experiment_id="exp-001",
                baseline_metrics={"loss": 1.0},
                controlled_variables=["data"],
                changed_variables=[],
            )
        assert "Must declare at least one changed variable" in str(exc_info.value)

    def test_hypothesis_requires_all_fields(self) -> None:
        """Hypothesis missing falsification_condition → validation error."""
        with pytest.raises(ValidationError):
            Hypothesis(
                id="hyp-001",
                type=HypothesisType.ARCHITECTURE,
                statement="Test.",
                why_baseline_fails="Reason.",
                expected_effect_direction="improve",
                created_at=datetime.now(),
            )

    def test_compute_budget_rejects_zero_params(self) -> None:
        """param_count = 0 → validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ComputeBudget(
                param_count=0,
                estimated_flops=1e15,
                max_runtime_minutes=60,
                max_gpu_memory_gb=24.0,
            )
        assert "param_count must be positive" in str(exc_info.value)

    def test_compute_budget_rejects_negative_params(self) -> None:
        """param_count < 0 → validation error."""
        with pytest.raises(ValidationError):
            ComputeBudget(
                param_count=-1,
                estimated_flops=1e15,
                max_runtime_minutes=60,
                max_gpu_memory_gb=24.0,
            )

    def test_scaling_hypothesis_validates_intermediate_scales(self) -> None:
        """SCALING_STUDY with no intermediate scales → validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ScalingHypothesis(
                type=ScalingHypothesisType.SCALING_STUDY,
                justification="Study scaling.",
                intermediate_scales=[],
                baseline_scale_included=True,
            )
        assert "at least one intermediate scale point" in str(exc_info.value)

    def test_scaling_hypothesis_validates_baseline_scale_included(self) -> None:
        """Scaling study that doesn't test at baseline scale → validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ScalingHypothesis(
                type=ScalingHypothesisType.SCALING_STUDY,
                justification="Study scaling.",
                intermediate_scales=[1.5],
                baseline_scale_included=False,
            )
        assert "baseline scale" in str(exc_info.value)

    def test_ablation_plan_requires_targets(self) -> None:
        """AblationPlan with empty targets → validation error."""
        with pytest.raises(ValidationError) as exc_info:
            AblationPlan(targets=[])
        assert "at least one target" in str(exc_info.value)

    def test_ablation_plan_accepts_valid_targets(self) -> None:
        """AblationPlan with one or more targets → valid."""
        plan = AblationPlan(
            targets=[
                AblationTarget(
                    variable="dropout",
                    expected_direction="decrease",
                    rationale="Test regularization.",
                )
            ]
        )
        assert len(plan.targets) == 1
        assert plan.targets[0].variable == "dropout"
