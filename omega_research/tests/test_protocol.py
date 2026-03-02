"""Tests for experiment proposal validation (protocol)."""

from datetime import datetime

import pytest

from omega_research.config import OmegaResearchConfig
from omega_research.models import (
    AblationPlan,
    AblationTarget,
    BaselineDeclaration,
    ComputeBudget,
    DeterminismControls,
    EnforcementAction,
    ExperimentProposal,
    Hypothesis,
    HypothesisType,
    RegistryEdge,
    RegistryEdgeType,
    RegistryEntry,
)
from omega_research.protocol import ExperimentProtocol
from omega_research.registry import ExperimentRegistry

from .conftest import VALID_CONFIG_HASH


class TestExperimentProtocol:
    def test_valid_proposal_passes(
        self,
        populated_registry: ExperimentRegistry,
        good_proposal_for_registry: ExperimentProposal,
    ) -> None:
        """Well-formed proposal with existing baseline → ALLOW."""
        protocol = ExperimentProtocol(
            OmegaResearchConfig(), populated_registry
        )
        result = protocol.validate_proposal(good_proposal_for_registry)
        assert result.action == EnforcementAction.ALLOW

    def test_block_missing_baseline_in_registry(
        self,
        good_proposal_for_registry: ExperimentProposal,
    ) -> None:
        """Baseline ID not in registry → BLOCK."""
        config = OmegaResearchConfig()
        registry = ExperimentRegistry(config)
        protocol = ExperimentProtocol(config, registry)
        result = protocol.validate_proposal(good_proposal_for_registry)
        assert result.action == EnforcementAction.BLOCK
        assert any("not found in registry" in r for r in result.reasons)

    def test_block_empty_baseline_metrics(
        self,
        populated_registry: ExperimentRegistry,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Empty baseline_metrics dict → BLOCK."""
        proposal = ExperimentProposal(
            id="prop-empty-metrics",
            hypothesis_id="hyp-001",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp-baseline-001",
                baseline_metrics={},
                controlled_variables=["dataset"],
                changed_variables=["lr"],
            ),
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
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("Baseline metrics not declared" in r for r in result.reasons)

    def test_block_variable_in_both_changed_and_controlled(
        self,
        populated_registry: ExperimentRegistry,
        good_proposal_for_registry: ExperimentProposal,
    ) -> None:
        """Variable overlap → BLOCK."""
        proposal = ExperimentProposal(
            id="prop-overlap",
            hypothesis_id="hyp-001",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp-baseline-001",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset", "lr"],
                changed_variables=["lr"],
            ),
            compute_budget=good_proposal_for_registry.compute_budget,
            determinism=good_proposal_for_registry.determinism,
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("appears in both" in r for r in result.reasons)

    def test_block_invalid_config_hash(
        self,
        populated_registry: ExperimentRegistry,
        good_proposal_for_registry: ExperimentProposal,
    ) -> None:
        """Non-SHA-256 config_hash → BLOCK."""
        proposal = ExperimentProposal(
            id="prop-bad-hash",
            hypothesis_id="hyp-001",
            baseline=good_proposal_for_registry.baseline,
            compute_budget=good_proposal_for_registry.compute_budget,
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="not-a-sha256",
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("config_hash" in r for r in result.reasons)

    def test_block_architecture_without_ablation(
        self,
        populated_registry: ExperimentRegistry,
        architecture_hypothesis: Hypothesis,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Architecture hypothesis, no ablation plan → BLOCK."""
        populated_registry.add_hypothesis(architecture_hypothesis)
        proposal = ExperimentProposal(
            id="prop-arch-no-ablation",
            hypothesis_id="hyp-arch-001",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp-baseline-001",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset"],
                changed_variables=["width"],
            ),
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
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("ablation" in r.lower() for r in result.reasons)

    def test_allow_architecture_with_ablation(
        self,
        populated_registry: ExperimentRegistry,
        architecture_hypothesis: Hypothesis,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Architecture hypothesis with ablation → ALLOW (or WARN)."""
        populated_registry.add_hypothesis(architecture_hypothesis)
        proposal = ExperimentProposal(
            id="prop-arch-ablation",
            hypothesis_id="hyp-arch-001",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp-baseline-001",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset"],
                changed_variables=["width"],
            ),
            compute_budget=baseline_budget,
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash=VALID_CONFIG_HASH,
            ),
            scaling_hypothesis=None,
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
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action in (EnforcementAction.ALLOW, EnforcementAction.WARN)

    def test_warn_duplicate_experiment(
        self,
        populated_registry: ExperimentRegistry,
        good_proposal_for_registry: ExperimentProposal,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Same hypothesis + config already in registry → WARN."""
        duplicate_entry = RegistryEntry(
            experiment_id="exp-duplicate-001",
            compute_budget=baseline_budget,
            hypothesis_id="hyp-001",
            config_hash=VALID_CONFIG_HASH,
        )
        populated_registry.add(duplicate_entry)
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(good_proposal_for_registry)
        assert result.action == EnforcementAction.WARN
        assert any("already exists" in r for r in result.reasons)

    def test_warn_previously_falsified_hypothesis(
        self,
        populated_registry: ExperimentRegistry,
        good_proposal_for_registry: ExperimentProposal,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Hypothesis has CONTRADICTS edge → WARN."""
        other_id = "exp-other-001"
        populated_registry.add(
            RegistryEntry(
                experiment_id=other_id,
                compute_budget=baseline_budget,
                hypothesis_id="hyp-001",
                config_hash="c" * 64,
            )
        )
        populated_registry.add_edge(
            RegistryEdge(
                from_experiment_id=other_id,
                to_experiment_id="exp-baseline-001",
                edge_type=RegistryEdgeType.CONTRADICTS,
                evidence="Prior run contradicted hypothesis.",
            )
        )
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(good_proposal_for_registry)
        assert result.action == EnforcementAction.WARN
        assert any("contradicted" in r for r in result.reasons)

    def test_scaling_check_integrated(
        self,
        populated_registry: ExperimentRegistry,
        valid_baseline_declaration: BaselineDeclaration,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Scaling governor fires through protocol → BLOCK propagated."""
        proposal = ExperimentProposal(
            id="prop-scaled",
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
                config_hash=VALID_CONFIG_HASH,
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("scaling" in r.lower() or "hypothesis" in r.lower() for r in result.reasons)

    def test_aggregation_block_trumps_warn(
        self,
        populated_registry: ExperimentRegistry,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Multiple checks: one BLOCK + one WARN → overall BLOCK."""
        duplicate_entry = RegistryEntry(
            experiment_id="exp-dup",
            compute_budget=baseline_budget,
            hypothesis_id="hyp-001",
            config_hash="x" * 64,
        )
        populated_registry.add(duplicate_entry)
        proposal = ExperimentProposal(
            id="prop-mixed",
            hypothesis_id="hyp-001",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp-baseline-001",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset"],
                changed_variables=["lr"],
            ),
            compute_budget=baseline_budget,
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="x",  # invalid → BLOCK
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("config_hash" in r or "Invalid" in r for r in result.reasons)

    def test_aggregation_collects_all_reasons(
        self,
        populated_registry: ExperimentRegistry,
        baseline_budget: ComputeBudget,
    ) -> None:
        """Multiple failures → all reasons present in result."""
        proposal = ExperimentProposal(
            id="prop-multi-fail",
            hypothesis_id="hyp-001",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp-baseline-001",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["lr", "data"],
                changed_variables=["lr"],
            ),
            compute_budget=baseline_budget,
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1",
                model_version="v1",
                config_hash="short",
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        protocol = ExperimentProtocol(OmegaResearchConfig(), populated_registry)
        result = protocol.validate_proposal(proposal)
        assert result.action == EnforcementAction.BLOCK
        assert any("appears in both" in r for r in result.reasons)
        assert any("config_hash" in r or "Invalid" in r for r in result.reasons)
        assert len(result.reasons) >= 2
