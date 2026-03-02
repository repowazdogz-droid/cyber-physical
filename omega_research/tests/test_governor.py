"""Tests for ScalingGovernor policy logic."""

import pytest

from omega_research.config import OmegaResearchConfig
from omega_research.governor import ScalingGovernor
from omega_research.models import (
    ComputeBudget,
    EnforcementAction,
    ExperimentProposal,
    ScalingHypothesis,
    ScalingHypothesisType,
)


class TestScalingGovernor:
    def test_allow_same_scale_experiment(
        self,
        valid_proposal_same_scale: ExperimentProposal,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """No scaling delta → ALLOW."""
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(valid_proposal_same_scale, baseline_budget)
        assert result.action == EnforcementAction.ALLOW

    def test_allow_minor_param_increase(
        self,
        valid_baseline_declaration: BaselineDeclaration,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """< 5% increase → ALLOW with note."""
        from datetime import datetime

        from omega_research.models import ComputeBudget, DeterminismControls, ExperimentProposal

        proposal = ExperimentProposal(
            id="prop-minor-001",
            hypothesis_id="hyp-001",
            baseline=valid_baseline_declaration,
            compute_budget=ComputeBudget(
                param_count=1_060_000,  # 6% increase (> 5% minor threshold, < 20% scaling)
                estimated_flops=1e15,
                max_runtime_minutes=120,
                max_gpu_memory_gb=24.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="x",
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(proposal, baseline_budget)
        assert result.action == EnforcementAction.ALLOW
        assert any("Minor parameter increase" in r for r in result.reasons)

    def test_block_scaling_without_hypothesis(
        self,
        scaled_proposal_no_hypothesis: ExperimentProposal,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """20%+ param increase, no scaling_hypothesis → BLOCK."""
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(scaled_proposal_no_hypothesis, baseline_budget)
        assert result.action == EnforcementAction.BLOCK
        assert any("scaling hypothesis" in r.lower() for r in result.reasons)

    def test_block_flop_scaling_without_hypothesis(
        self,
        valid_baseline_declaration: BaselineDeclaration,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """50%+ FLOP increase, no scaling_hypothesis → BLOCK."""
        from datetime import datetime

        from omega_research.models import ComputeBudget, DeterminismControls, ExperimentProposal

        # Params same, FLOPs 2x (100% increase > 50% threshold)
        proposal = ExperimentProposal(
            id="prop-flop-001",
            hypothesis_id="hyp-001",
            baseline=valid_baseline_declaration,
            compute_budget=ComputeBudget(
                param_count=1_000_000,
                estimated_flops=2e15,
                max_runtime_minutes=120,
                max_gpu_memory_gb=24.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="y",
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(proposal, baseline_budget)
        assert result.action == EnforcementAction.BLOCK

    def test_allow_scaling_study_with_intermediates(
        self,
        valid_scaling_study_proposal: ExperimentProposal,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """Proper scaling study with intermediate scales → ALLOW."""
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(valid_scaling_study_proposal, baseline_budget)
        assert result.action == EnforcementAction.ALLOW

    def test_block_scaling_study_without_intermediates(
        self,
        valid_baseline_declaration: BaselineDeclaration,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Scaling study missing intermediate scales → validation error."""
        import pytest
        from datetime import datetime
        from pydantic import ValidationError

        from omega_research.models import (
            ComputeBudget,
            DeterminismControls,
            ExperimentProposal,
            ScalingHypothesis,
            ScalingHypothesisType,
        )

        with pytest.raises(ValidationError):
            ExperimentProposal(
                id="prop-bad-study",
                hypothesis_id="hyp-001",
                baseline=valid_baseline_declaration,
                compute_budget=ComputeBudget(
                    param_count=2_000_000,
                    estimated_flops=2e15,
                    max_runtime_minutes=120,
                    max_gpu_memory_gb=24.0,
                ),
                determinism=DeterminismControls(
                    random_seed=42,
                    dataset_version="v1",
                    model_version="v1",
                    config_hash="z",
                ),
                scaling_hypothesis=ScalingHypothesis(
                    type=ScalingHypothesisType.SCALING_STUDY,
                    justification="Study.",
                    intermediate_scales=[],  # invalid
                    baseline_scale_included=True,
                ),
                ablation_plan=None,
                proposed_at=datetime.now(),
            )

    def test_block_scaling_study_without_baseline_scale(self) -> None:
        """Scaling study that doesn't test at baseline scale → validation error."""
        import pytest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            ScalingHypothesis(
                type=ScalingHypothesisType.SCALING_STUDY,
                justification="Study.",
                intermediate_scales=[1.5],
                baseline_scale_included=False,
            )

    def test_warn_architecture_change_with_ablation(
        self,
        valid_baseline_declaration: BaselineDeclaration,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """Architecture change with proper ablation → WARN (not block)."""
        from datetime import datetime

        from omega_research.models import (
            AblationPlan,
            AblationTarget,
            ComputeBudget,
            DeterminismControls,
            ExperimentProposal,
        )

        proposal = ExperimentProposal(
            id="prop-arch-001",
            hypothesis_id="hyp-001",
            baseline=valid_baseline_declaration,
            compute_budget=ComputeBudget(
                param_count=2_500_000,
                estimated_flops=2.5e15,
                max_runtime_minutes=180,
                max_gpu_memory_gb=48.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="a",
            ),
            scaling_hypothesis=ScalingHypothesis(
                type=ScalingHypothesisType.ARCHITECTURE_CHANGE,
                justification="Wider layers for capacity.",
                intermediate_scales=[],
                baseline_scale_included=True,
            ),
            ablation_plan=AblationPlan(
                targets=[
                    AblationTarget(
                        variable="width",
                        expected_direction="increase",
                        rationale="Ablate at original scale.",
                    )
                ]
            ),
            proposed_at=datetime.now(),
        )
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(proposal, baseline_budget)
        assert result.action == EnforcementAction.WARN
        assert any("unjustified" in r.lower() or "significant" in r.lower() for r in result.reasons)

    def test_block_architecture_change_without_ablation(
        self,
        valid_baseline_declaration: BaselineDeclaration,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """Architecture change, scaling delta, no ablation → BLOCK."""
        from datetime import datetime

        from omega_research.models import ComputeBudget, DeterminismControls, ExperimentProposal

        proposal = ExperimentProposal(
            id="prop-arch-no-ablation",
            hypothesis_id="hyp-001",
            baseline=valid_baseline_declaration,
            compute_budget=ComputeBudget(
                param_count=2_500_000,
                estimated_flops=2.5e15,
                max_runtime_minutes=180,
                max_gpu_memory_gb=48.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="b",
            ),
            scaling_hypothesis=ScalingHypothesis(
                type=ScalingHypothesisType.ARCHITECTURE_CHANGE,
                justification="Wider layers.",
                intermediate_scales=[],
                baseline_scale_included=True,
            ),
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(proposal, baseline_budget)
        assert result.action == EnforcementAction.BLOCK
        assert any("ablation" in r.lower() for r in result.requirements)

    def test_combined_param_and_flop_trigger(
        self,
        scaled_proposal_no_hypothesis: ExperimentProposal,
        baseline_budget: ComputeBudget,
        governor_config: OmegaResearchConfig,
    ) -> None:
        """Both thresholds exceeded → single coherent enforcement result."""
        gov = ScalingGovernor(governor_config)
        result = gov.evaluate(scaled_proposal_no_hypothesis, baseline_budget)
        assert result.action == EnforcementAction.BLOCK
        assert len(result.events) >= 1
        assert result.protocol_version == governor_config.scaling_policy_version
        assert result.reasons == [e.description for e in result.events]
