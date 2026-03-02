"""Integration tests for omega_research governance flow."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from omega_research.config import OmegaResearchConfig
from omega_research.lifecycle import ClaimLifecycle
from omega_research.models import (
    BaselineDeclaration,
    ClaimStatus,
    ComputeBudget,
    DeterminismControls,
    ExperimentProposal,
    ExperimentResult,
    Hypothesis,
    HypothesisType,
    ScalingHypothesis,
    ScalingHypothesisType,
)
from omega_research.protocol import ExperimentProtocol
from omega_research.registry import ExperimentRegistry
from omega_research.trust import (
    create_experiment_record,
    compute_hash,
    canonical_json,
)


@pytest.fixture
def bigger_trap_setup(tmp_path):
    """Set up registry with baseline for the Bigger Hidden Size Trap scenario."""
    config = OmegaResearchConfig(registry_path=str(tmp_path))
    registry = ExperimentRegistry(config)
    protocol = ExperimentProtocol(config, registry)
    lifecycle = ClaimLifecycle(config, registry)

    baseline_hypothesis = Hypothesis(
        id="hyp_baseline",
        type=HypothesisType.ARCHITECTURE,
        statement="Baseline transformer with hidden_size=512",
        why_baseline_fails="N/A — this IS the baseline",
        expected_effect_direction="establish_baseline",
        falsification_condition="N/A",
        created_at=datetime.now(),
    )
    registry.add_hypothesis(baseline_hypothesis)

    baseline_budget = ComputeBudget(
        param_count=10_000_000,
        estimated_flops=1e15,
        max_runtime_minutes=60,
        max_gpu_memory_gb=8.0,
    )

    baseline_proposal = ExperimentProposal(
        id="exp_baseline",
        hypothesis_id="hyp_baseline",
        baseline=BaselineDeclaration(
            baseline_experiment_id="exp_baseline",
            baseline_metrics={"loss": 2.5},
            controlled_variables=["dataset", "optimizer", "learning_rate"],
            changed_variables=["hidden_size"],
        ),
        compute_budget=baseline_budget,
        determinism=DeterminismControls(
            random_seed=42,
            dataset_version="v1.0",
            model_version="v1.0",
            config_hash="a" * 64,
        ),
        scaling_hypothesis=None,
        ablation_plan=None,
        proposed_at=datetime.now(),
    )
    registry.add_experiment(baseline_proposal)

    scaling_hypothesis = Hypothesis(
        id="hyp_bigger_is_better",
        type=HypothesisType.SCALING,
        statement="Larger hidden size improves loss",
        why_baseline_fails="512 may be capacity-limited",
        expected_effect_direction="improve_metric_loss",
        falsification_condition="Larger model does not improve loss",
        created_at=datetime.now(),
    )
    registry.add_hypothesis(scaling_hypothesis)

    hyp_scaling = Hypothesis(
        id="hyp_scaling",
        type=HypothesisType.SCALING,
        statement="Scaling hidden size 512→1024 improves loss",
        why_baseline_fails="N/A",
        expected_effect_direction="improve_metric_loss",
        falsification_condition="No improvement at 1024",
        created_at=datetime.now(),
    )
    registry.add_hypothesis(hyp_scaling)

    return type("TrapSetup", (), {
        "config": config,
        "registry": registry,
        "protocol": protocol,
        "lifecycle": lifecycle,
        "baseline_hypothesis": baseline_hypothesis,
        "baseline_budget": baseline_budget,
        "baseline_proposal": baseline_proposal,
    })()


class TestBiggerHiddenSizeTrap:
    """Simulate Karpathy's documented failure mode: agent proposes bigger = better."""

    def test_step1_block_naive_scaling(self, bigger_trap_setup):
        """Agent proposes hidden_size 512→1024 (doubles params). No scaling hypothesis. EXPECTED: BLOCK."""
        s = bigger_trap_setup
        proposal = ExperimentProposal(
            id="exp_naive_scaling",
            hypothesis_id="hyp_bigger_is_better",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp_baseline",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset", "optimizer", "learning_rate"],
                changed_variables=["hidden_size"],
            ),
            compute_budget=ComputeBudget(
                param_count=20_000_000,
                estimated_flops=3e15,
                max_runtime_minutes=120,
                max_gpu_memory_gb=16.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1.0",
                model_version="v1.0",
                config_hash="b" * 64,
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        result = s.protocol.validate_proposal(proposal)
        assert result.action.value == "block"
        assert any("scaling hypothesis" in r.lower() for r in result.reasons)

    def test_step2_block_scaling_study_without_intermediate(self):
        """Scaling study with empty intermediate_scales. EXPECTED: ValidationError."""
        with pytest.raises(ValidationError):
            ScalingHypothesis(
                type=ScalingHypothesisType.SCALING_STUDY,
                justification="Testing if larger model improves loss",
                intermediate_scales=[],
                baseline_scale_included=True,
            )

    def test_step3_allow_proper_scaling_study(self, bigger_trap_setup):
        """Proper scaling study: 512 → 768 → 1024 with baseline. EXPECTED: ALLOW."""
        s = bigger_trap_setup
        proposal = ExperimentProposal(
            id="exp_scaling_1024",
            hypothesis_id="hyp_scaling",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp_baseline",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset", "optimizer", "learning_rate"],
                changed_variables=["hidden_size"],
            ),
            compute_budget=ComputeBudget(
                param_count=20_000_000,
                estimated_flops=3e15,
                max_runtime_minutes=120,
                max_gpu_memory_gb=16.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1.0",
                model_version="v1.0",
                config_hash="c" * 64,
            ),
            scaling_hypothesis=ScalingHypothesis(
                type=ScalingHypothesisType.SCALING_STUDY,
                justification="Investigating hidden size scaling law",
                intermediate_scales=[768],
                baseline_scale_included=True,
            ),
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        result = s.protocol.validate_proposal(proposal)
        assert result.action.value == "allow"

    def test_step4_single_run_blocks_claim_promotion(self, bigger_trap_setup):
        """Single run then promote to REPLICATED. EXPECTED: BLOCK — insufficient runs."""
        s = bigger_trap_setup
        claim = s.lifecycle.create_claim("hyp_scaling", "exp_scaling_1024")
        promotion = s.lifecycle.attempt_promotion(claim, ClaimStatus.REPLICATED)
        assert not promotion.success
        assert "insufficient" in promotion.reasons[0].lower()

    def test_step5_high_variance_blocks_graduation(self, bigger_trap_setup):
        """Three runs but noisy. EXPECTED: high_variance."""
        s = bigger_trap_setup
        results = [
            ExperimentResult(
                experiment_id="exp_scaling_1024",
                metrics={"loss": 2.1},
                runtime_minutes=10.0,
                actual_gpu_memory_gb=16.0,
                seed=1,
                completed_at=datetime.now(),
            ),
            ExperimentResult(
                experiment_id="exp_scaling_1024",
                metrics={"loss": 2.8},
                runtime_minutes=10.0,
                actual_gpu_memory_gb=16.0,
                seed=2,
                completed_at=datetime.now(),
            ),
            ExperimentResult(
                experiment_id="exp_scaling_1024",
                metrics={"loss": 1.9},
                runtime_minutes=10.0,
                actual_gpu_memory_gb=16.0,
                seed=3,
                completed_at=datetime.now(),
            ),
        ]
        verdict = s.lifecycle.replication_gate.evaluate_results(
            results,
            baseline_metrics={"loss": 2.5},
            target_metric="loss",
        )
        assert verdict.verdict == "high_variance"

    def test_step6_clean_run_graduates_with_human_approval(self, bigger_trap_setup):
        """Full lifecycle: OBS → REPLICATED → BASELINE_BEATING → GRADUATED only with approver."""
        s = bigger_trap_setup
        # Add scaling experiment proposal so we have baseline_metrics for the claim
        proposal = ExperimentProposal(
            id="exp_scaling_1024",
            hypothesis_id="hyp_scaling",
            baseline=BaselineDeclaration(
                baseline_experiment_id="exp_baseline",
                baseline_metrics={"loss": 2.5},
                controlled_variables=["dataset"],
                changed_variables=["hidden_size"],
            ),
            compute_budget=ComputeBudget(
                param_count=20_000_000,
                estimated_flops=3e15,
                max_runtime_minutes=120,
                max_gpu_memory_gb=16.0,
            ),
            determinism=DeterminismControls(
                random_seed=42,
                dataset_version="v1.0",
                model_version="v1.0",
                config_hash="d" * 64,
            ),
            scaling_hypothesis=ScalingHypothesis(
                type=ScalingHypothesisType.SCALING_STUDY,
                justification="Scaling study",
                intermediate_scales=[768],
                baseline_scale_included=True,
            ),
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        s.registry.add_experiment(proposal)

        # Three consistent results (clear improvement)
        base = datetime.now()
        for seed, loss in [(1, 2.0), (2, 2.02), (3, 1.98)]:
            s.registry.add_result(
                ExperimentResult(
                    experiment_id="exp_scaling_1024",
                    metrics={"loss": loss},
                    runtime_minutes=10.0,
                    actual_gpu_memory_gb=16.0,
                    seed=seed,
                    completed_at=base,
                )
            )

        claim = s.lifecycle.create_claim("hyp_scaling", "exp_scaling_1024")
        claim = s.registry.get_claim(claim.id)
        assert claim is not None

        promotion = s.lifecycle.attempt_promotion(claim, ClaimStatus.REPLICATED)
        assert promotion.success, promotion.reasons
        claim = s.registry.get_claim(claim.id)
        assert claim.status == ClaimStatus.REPLICATED

        promotion = s.lifecycle.attempt_promotion(claim, ClaimStatus.BASELINE_BEATING)
        assert promotion.success, promotion.reasons
        claim = s.registry.get_claim(claim.id)
        assert claim.status == ClaimStatus.BASELINE_BEATING

        promotion = s.lifecycle.attempt_promotion(claim, ClaimStatus.GRADUATED)
        assert not promotion.success
        assert "approver" in promotion.reasons[0].lower()

        promotion = s.lifecycle.graduate(claim, "warren@omega.org")
        assert promotion.success, promotion.reasons
        claim = s.registry.get_claim(claim.id)
        assert claim.status == ClaimStatus.GRADUATED
        assert claim.graduated_by == "warren@omega.org"

    def test_step7_record_is_tamper_evident(self, bigger_trap_setup):
        """Complete experiment produces hash-chained record. Tampering breaks chain."""
        from omega_research.models import EnforcementAction, EnforcementResult

        s = bigger_trap_setup
        proposal = s.baseline_proposal
        result = ExperimentResult(
            experiment_id="exp_baseline",
            metrics={"loss": 2.5},
            runtime_minutes=5.0,
            actual_gpu_memory_gb=8.0,
            seed=42,
            completed_at=datetime.now(),
        )
        enforcement = EnforcementResult(
            action=EnforcementAction.ALLOW,
            events=[],
            reasons=[],
            requirements=[],
            protocol_version=s.config.protocol_version,
            timestamp=datetime.now(),
        )
        record = create_experiment_record(proposal, result, enforcement)

        expected_record_hash = compute_hash(
            record.proposal_hash + record.result_hash + record.enforcement_hash
        )
        assert record.record_hash == expected_record_hash

        tampered_result = result.model_copy(update={"metrics": {"loss": 0.001}})
        tampered_hash = compute_hash(canonical_json(tampered_result))
        assert tampered_hash != record.result_hash
