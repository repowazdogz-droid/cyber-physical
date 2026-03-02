"""Shared fixtures for omega_research tests."""

from datetime import datetime

import pytest

from omega_research.config import OmegaResearchConfig
from omega_research.models import (
    AblationPlan,
    AblationTarget,
    BaselineDeclaration,
    ComputeBudget,
    DeterminismControls,
    ExperimentProposal,
    ExperimentResult,
    Hypothesis,
    HypothesisType,
    RegistryEntry,
    ScalingHypothesis,
    ScalingHypothesisType,
)
from omega_research.registry import ExperimentRegistry


@pytest.fixture
def baseline_budget() -> ComputeBudget:
    """Standard baseline compute budget (1M params)."""
    return ComputeBudget(
        param_count=1_000_000,
        estimated_flops=1e15,
        max_runtime_minutes=120,
        max_gpu_memory_gb=24.0,
    )


@pytest.fixture
def valid_baseline_declaration() -> BaselineDeclaration:
    """Proper baseline declaration with changed variables."""
    return BaselineDeclaration(
        baseline_experiment_id="exp-baseline-001",
        baseline_metrics={"loss": 2.5, "accuracy": 0.92},
        controlled_variables=["dataset", "eval_split"],
        changed_variables=["learning_rate"],
    )


@pytest.fixture
def valid_hypothesis() -> Hypothesis:
    """Well-formed hypothesis with all required fields."""
    return Hypothesis(
        id="hyp-001",
        type=HypothesisType.OPTIMIZATION,
        statement="Lower learning rate improves convergence.",
        why_baseline_fails="Baseline uses fixed LR that plateaus.",
        expected_effect_direction="improve_metric_loss",
        falsification_condition="Loss does not decrease over 3 runs.",
        created_at=datetime.now(),
    )


@pytest.fixture
def architecture_hypothesis() -> Hypothesis:
    """Hypothesis with type ARCHITECTURE (requires ablation plan)."""
    return Hypothesis(
        id="hyp-arch-001",
        type=HypothesisType.ARCHITECTURE,
        statement="Wider layers improve capacity.",
        why_baseline_fails="Baseline is too narrow.",
        expected_effect_direction="improve_metric_loss",
        falsification_condition="No improvement at same scale.",
        created_at=datetime.now(),
    )


@pytest.fixture
def valid_proposal_same_scale(
    baseline_budget: ComputeBudget,
    valid_baseline_declaration: BaselineDeclaration,
) -> ExperimentProposal:
    """Proposal at same scale as baseline → should ALLOW."""
    return ExperimentProposal(
        id="prop-same-001",
        hypothesis_id="hyp-001",
        baseline=valid_baseline_declaration,
        compute_budget=ComputeBudget(
            param_count=1_000_000,
            estimated_flops=1e15,
            max_runtime_minutes=120,
            max_gpu_memory_gb=24.0,
        ),
        determinism=DeterminismControls(
            random_seed=42,
            dataset_version="v1",
            model_version="v1",
            config_hash="abc123",
        ),
        scaling_hypothesis=None,
        ablation_plan=None,
        proposed_at=datetime.now(),
    )


@pytest.fixture
def scaled_proposal_no_hypothesis(
    valid_baseline_declaration: BaselineDeclaration,
) -> ExperimentProposal:
    """Proposal with 2x params and 2.5x FLOPs, no scaling_hypothesis → should BLOCK."""
    return ExperimentProposal(
        id="prop-scaled-001",
        hypothesis_id="hyp-001",
        baseline=valid_baseline_declaration,
        compute_budget=ComputeBudget(
            param_count=2_000_000,
            estimated_flops=2.5e15,
            max_runtime_minutes=180,
            max_gpu_memory_gb=48.0,
        ),
        determinism=DeterminismControls(
            random_seed=42,
            dataset_version="v1",
            model_version="v1",
            config_hash="def456",
        ),
        scaling_hypothesis=None,
        ablation_plan=None,
        proposed_at=datetime.now(),
    )


@pytest.fixture
def valid_scaling_study_proposal(
    valid_baseline_declaration: BaselineDeclaration,
) -> ExperimentProposal:
    """Proper scaling study with intermediate scales and baseline scale → should ALLOW."""
    return ExperimentProposal(
        id="prop-scaling-study-001",
        hypothesis_id="hyp-001",
        baseline=valid_baseline_declaration,
        compute_budget=ComputeBudget(
            param_count=3_000_000,
            estimated_flops=3e15,
            max_runtime_minutes=240,
            max_gpu_memory_gb=48.0,
        ),
        determinism=DeterminismControls(
            random_seed=42,
            dataset_version="v1",
            model_version="v1",
            config_hash="ghi789",
        ),
        scaling_hypothesis=ScalingHypothesis(
            type=ScalingHypothesisType.SCALING_STUDY,
            justification="Studying scaling law for this architecture.",
            intermediate_scales=[1.5e6, 2.0e6],
            baseline_scale_included=True,
        ),
        ablation_plan=None,
        proposed_at=datetime.now(),
    )


@pytest.fixture
def governor_config() -> OmegaResearchConfig:
    """Default config for governor tests (overridable for threshold tests)."""
    return OmegaResearchConfig()


# --- Protocol / registry fixtures ---

# Valid 64-char hex SHA-256 for determinism checks
VALID_CONFIG_HASH = "a" * 64


@pytest.fixture
def populated_registry(
    tmp_path: str,
    baseline_budget: ComputeBudget,
    valid_hypothesis: Hypothesis,
) -> ExperimentRegistry:
    """Registry with a baseline experiment and hypothesis already stored."""
    config = OmegaResearchConfig(registry_path=str(tmp_path))
    registry = ExperimentRegistry(config)
    baseline_entry = RegistryEntry(
        experiment_id="exp-baseline-001",
        compute_budget=baseline_budget,
        hypothesis_id="hyp-001",
        config_hash="b" * 64,
    )
    registry.add(baseline_entry)
    registry.add_hypothesis(valid_hypothesis)
    return registry


@pytest.fixture
def good_proposal_for_registry(
    valid_baseline_declaration: BaselineDeclaration,
    baseline_budget: ComputeBudget,
    valid_hypothesis: Hypothesis,
) -> ExperimentProposal:
    """Well-formed proposal that matches populated_registry baseline (same scale, valid hash)."""
    return ExperimentProposal(
        id="prop-good-001",
        hypothesis_id="hyp-001",
        baseline=valid_baseline_declaration,
        compute_budget=baseline_budget,
        determinism=DeterminismControls(
            random_seed=42,
            dataset_version="v1",
            model_version="v1",
            config_hash=VALID_CONFIG_HASH,
        ),
        scaling_hypothesis=None,
        ablation_plan=None,
        proposed_at=datetime.now(),
    )


# --- Replication fixtures ---


@pytest.fixture
def three_good_results() -> list[ExperimentResult]:
    """Three experiment results with consistent, improving metrics (e.g. lower loss)."""
    base = datetime.now()
    return [
        ExperimentResult(
            experiment_id="run-1",
            metrics={"loss": 2.0, "accuracy": 0.94},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=1,
            completed_at=base,
        ),
        ExperimentResult(
            experiment_id="run-2",
            metrics={"loss": 2.02, "accuracy": 0.94},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=2,
            completed_at=base,
        ),
        ExperimentResult(
            experiment_id="run-3",
            metrics={"loss": 1.98, "accuracy": 0.94},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=3,
            completed_at=base,
        ),
    ]


@pytest.fixture
def three_noisy_results() -> list[ExperimentResult]:
    """Three results with high variance (CV > 10%)."""
    base = datetime.now()
    return [
        ExperimentResult(
            experiment_id="run-1",
            metrics={"loss": 1.5, "accuracy": 0.90},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=1,
            completed_at=base,
        ),
        ExperimentResult(
            experiment_id="run-2",
            metrics={"loss": 2.5, "accuracy": 0.92},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=2,
            completed_at=base,
        ),
        ExperimentResult(
            experiment_id="run-3",
            metrics={"loss": 3.0, "accuracy": 0.91},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=3,
            completed_at=base,
        ),
    ]


@pytest.fixture
def three_marginal_results() -> list[ExperimentResult]:
    """Three consistent results with < 1% improvement over baseline (e.g. baseline loss 2.5)."""
    base = datetime.now()
    # Mean ~2.49, so improvement ~0.4%
    return [
        ExperimentResult(
            experiment_id="run-1",
            metrics={"loss": 2.49, "accuracy": 0.92},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=1,
            completed_at=base,
        ),
        ExperimentResult(
            experiment_id="run-2",
            metrics={"loss": 2.50, "accuracy": 0.92},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=2,
            completed_at=base,
        ),
        ExperimentResult(
            experiment_id="run-3",
            metrics={"loss": 2.48, "accuracy": 0.92},
            runtime_minutes=10.0,
            actual_gpu_memory_gb=24.0,
            seed=3,
            completed_at=base,
        ),
    ]
