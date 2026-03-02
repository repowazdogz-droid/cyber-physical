"""Claim ladder: observation → replicated → baseline-beating → graduated."""

from datetime import datetime

from omega_research.config import OmegaResearchConfig
from omega_research.models import (
    Claim,
    ClaimStatus,
    ExperimentProposal,
    PromotionResult,
    ReplicationVerdict,
)
from omega_research.registry import ExperimentRegistry
from omega_research.replication import ReplicationGate


VALID_TRANSITIONS = {
    ClaimStatus.OBSERVATION: ClaimStatus.REPLICATED,
    ClaimStatus.REPLICATED: ClaimStatus.BASELINE_BEATING,
    ClaimStatus.BASELINE_BEATING: ClaimStatus.GRADUATED,
}


class ClaimLifecycle:
    def __init__(self, config: OmegaResearchConfig, registry: ExperimentRegistry) -> None:
        self.config = config
        self.registry = registry
        self.replication_gate = ReplicationGate(config)

    def create_claim(self, hypothesis_id: str, experiment_id: str) -> Claim:
        """Create a new claim at OBSERVATION status from a single experiment."""
        claim = Claim(
            id=f"claim-{hypothesis_id}-{experiment_id}",
            hypothesis_id=hypothesis_id,
            experiment_ids=[experiment_id],
            status=ClaimStatus.OBSERVATION,
            mean_improvement=None,
            variance=None,
            effect_size=None,
            graduated_by=None,
            graduated_at=None,
        )
        self.registry.add_claim(claim)
        return claim

    def attempt_promotion(self, claim: Claim, target_status: ClaimStatus) -> PromotionResult:
        """
        Try to promote a claim to the next tier.
        No skipping tiers. Returns success/failure with reasons.
        """
        expected_next = VALID_TRANSITIONS.get(claim.status)
        if target_status != expected_next:
            return PromotionResult(
                success=False,
                from_status=claim.status,
                to_status=target_status,
                reasons=[
                    f"Cannot skip from {claim.status.value} to {target_status.value}. "
                    f"Next valid: {expected_next.value if expected_next else 'none'}."
                ],
                requirements_met=[],
                requirements_missing=[],
            )

        if expected_next == ClaimStatus.REPLICATED:
            return self._promote_observation_to_replicated(claim)
        if expected_next == ClaimStatus.BASELINE_BEATING:
            return self._promote_replicated_to_baseline_beating(claim)
        if expected_next == ClaimStatus.GRADUATED:
            return self._promote_baseline_beating_to_graduated(claim, approver="")

        return PromotionResult(
            success=False,
            from_status=claim.status,
            to_status=target_status,
            reasons=["Invalid transition."],
            requirements_met=[],
            requirements_missing=[],
        )

    def graduate(self, claim: Claim, approver: str) -> PromotionResult:
        """Final promotion to GRADUATED. Requires human approver identity."""
        if claim.status != ClaimStatus.BASELINE_BEATING:
            expected = VALID_TRANSITIONS.get(claim.status)
            return PromotionResult(
                success=False,
                from_status=claim.status,
                to_status=ClaimStatus.GRADUATED,
                reasons=[
                    f"Cannot graduate from {claim.status.value}. "
                    f"Claim must be at BASELINE_BEATING. Next valid: {expected.value if expected else 'none'}."
                ],
                requirements_met=[],
                requirements_missing=[],
            )
        if not (approver or "").strip():
            return PromotionResult(
                success=False,
                from_status=claim.status,
                to_status=ClaimStatus.GRADUATED,
                reasons=["Human approver identity required for graduation."],
                requirements_met=[],
                requirements_missing=["Provide approver identity (non-empty string)."],
            )
        return self._promote_baseline_beating_to_graduated(claim, approver=approver.strip())

    def _get_results_for_claim(self, claim: Claim) -> list[tuple[str, "ExperimentResult"]]:
        from omega_research.models import ExperimentResult
        out: list[tuple[str, ExperimentResult]] = []
        for eid in claim.experiment_ids:
            for r in self.registry.get_results_for_experiment(eid):
                out.append((eid, r))
        return out

    def _get_baseline_metrics_for_claim(self, claim: Claim) -> dict[str, float] | None:
        """Get baseline metrics from the first experiment's baseline declaration."""
        for eid in claim.experiment_ids:
            prop = self.registry.get_experiment(eid)
            if prop and prop.baseline.baseline_metrics:
                return prop.baseline.baseline_metrics
        return None

    def _promote_observation_to_replicated(self, claim: Claim) -> PromotionResult:
        results_tuples = self._get_results_for_claim(claim)
        results = [r for _, r in results_tuples]
        reasons: list[str] = []
        met: list[str] = []
        missing: list[str] = []

        if len(results) < self.config.min_replication_runs:
            reasons.append(
                f"Insufficient runs: need at least {self.config.min_replication_runs}, got {len(results)}."
            )
            missing.append(f"At least {self.config.min_replication_runs} results with different seeds.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.OBSERVATION,
                to_status=ClaimStatus.REPLICATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        seeds = {r.seed for r in results}
        if len(seeds) < len(results):
            reasons.append("Duplicate seeds across runs; all runs must use different seeds.")
            missing.append("Use distinct random seeds for each run.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.OBSERVATION,
                to_status=ClaimStatus.REPLICATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        baseline_metrics = self._get_baseline_metrics_for_claim(claim)
        if not baseline_metrics:
            reasons.append("No baseline metrics available for replication check.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.OBSERVATION,
                to_status=ClaimStatus.REPLICATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=["Baseline metrics required."],
            )

        target_metric = next(iter(baseline_metrics.keys()), "loss")
        verdict = self.replication_gate.evaluate_results(results, baseline_metrics, target_metric)

        if verdict.verdict == "high_variance" and verdict.coefficient_of_variation > self.config.max_acceptable_cv:
            reasons.append(
                f"High variance: CV {verdict.coefficient_of_variation:.4f} exceeds "
                f"max {self.config.max_acceptable_cv}."
            )
            missing.append("Reduce variance (more consistent runs) or collect more data.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.OBSERVATION,
                to_status=ClaimStatus.REPLICATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        if verdict.verdict not in ("pass", "insignificant_improvement"):
            reasons.append(f"Replication gate verdict: {verdict.verdict}. Need 'pass' or 'insignificant_improvement'.")
            missing.extend(verdict.details)
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.OBSERVATION,
                to_status=ClaimStatus.REPLICATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        met.append("Sufficient runs with different seeds.")
        met.append(f"Replication verdict: {verdict.verdict}.")
        updated = Claim(
            id=claim.id,
            hypothesis_id=claim.hypothesis_id,
            experiment_ids=claim.experiment_ids,
            status=ClaimStatus.REPLICATED,
            mean_improvement=verdict.mean_value,
            variance=verdict.variance,
            effect_size=abs(verdict.improvement_over_baseline) if verdict.improvement_over_baseline else None,
            graduated_by=None,
            graduated_at=None,
        )
        self.registry.update_claim(updated)
        return PromotionResult(
            success=True,
            from_status=ClaimStatus.OBSERVATION,
            to_status=ClaimStatus.REPLICATED,
            reasons=["Promoted to REPLICATED."],
            requirements_met=met,
            requirements_missing=[],
        )

    def _promote_replicated_to_baseline_beating(self, claim: Claim) -> PromotionResult:
        results_tuples = self._get_results_for_claim(claim)
        results = [r for _, r in results_tuples]
        reasons: list[str] = []
        met: list[str] = []
        missing: list[str] = []

        baseline_metrics = self._get_baseline_metrics_for_claim(claim)
        if not baseline_metrics:
            reasons.append("No baseline metrics for effect size check.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.REPLICATED,
                to_status=ClaimStatus.BASELINE_BEATING,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=["Baseline metrics required."],
            )

        target_metric = next(iter(baseline_metrics.keys()), "loss")
        verdict = self.replication_gate.evaluate_results(results, baseline_metrics, target_metric)

        if verdict.verdict != "pass":
            reasons.append(f"Replication verdict must be 'pass' for BASELINE_BEATING, got '{verdict.verdict}'.")
            missing.append("Replication gate must return 'pass' (not insignificant_improvement).")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.REPLICATED,
                to_status=ClaimStatus.BASELINE_BEATING,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        effect_size = abs(verdict.improvement_over_baseline)
        if effect_size < self.config.min_effect_size:
            reasons.append(
                f"Effect size {effect_size:.4f} below minimum {self.config.min_effect_size}."
            )
            missing.append(f"Effect size must be at least {self.config.min_effect_size}.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.REPLICATED,
                to_status=ClaimStatus.BASELINE_BEATING,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        hypothesis = self.registry.get_hypothesis(claim.hypothesis_id)
        if hypothesis:
            if "improve" in hypothesis.expected_effect_direction.lower() or "reduce" in hypothesis.expected_effect_direction.lower():
                if "loss" in target_metric.lower() and verdict.improvement_over_baseline > 0:
                    reasons.append("Improvement direction wrong: loss should decrease.")
                    missing.append("Improvement must match hypothesis expected direction.")
                    return PromotionResult(
                        success=False,
                        from_status=ClaimStatus.REPLICATED,
                        to_status=ClaimStatus.BASELINE_BEATING,
                        reasons=reasons,
                        requirements_met=met,
                        requirements_missing=missing,
                    )
            elif "increase" in hypothesis.expected_effect_direction.lower():
                if verdict.improvement_over_baseline < 0:
                    reasons.append("Improvement direction wrong: metric should increase.")
                    return PromotionResult(
                        success=False,
                        from_status=ClaimStatus.REPLICATED,
                        to_status=ClaimStatus.BASELINE_BEATING,
                        reasons=reasons,
                        requirements_met=met,
                        requirements_missing=missing,
                    )

        ablation_ok = True
        for eid in claim.experiment_ids:
            prop = self.registry.get_experiment(eid)
            if prop and prop.ablation_plan and prop.ablation_plan.targets:
                n_targets = len(prop.ablation_plan.targets)
                if len(claim.experiment_ids) < n_targets:
                    ablation_ok = False
                    missing.append(
                        f"Ablation plan has {n_targets} targets; need at least {n_targets} experiments."
                    )
                break
        if not ablation_ok:
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.REPLICATED,
                to_status=ClaimStatus.BASELINE_BEATING,
                reasons=reasons + ["Ablation plan declared but not fully executed."],
                requirements_met=met,
                requirements_missing=missing,
            )

        met.append("Replication verdict: pass.")
        met.append(f"Effect size {effect_size:.4f} >= {self.config.min_effect_size}.")
        updated = Claim(
            id=claim.id,
            hypothesis_id=claim.hypothesis_id,
            experiment_ids=claim.experiment_ids,
            status=ClaimStatus.BASELINE_BEATING,
            mean_improvement=verdict.mean_value,
            variance=verdict.variance,
            effect_size=effect_size,
            graduated_by=None,
            graduated_at=None,
        )
        self.registry.update_claim(updated)
        return PromotionResult(
            success=True,
            from_status=ClaimStatus.REPLICATED,
            to_status=ClaimStatus.BASELINE_BEATING,
            reasons=["Promoted to BASELINE_BEATING."],
            requirements_met=met,
            requirements_missing=[],
        )

    def _promote_baseline_beating_to_graduated(self, claim: Claim, approver: str) -> PromotionResult:
        reasons: list[str] = []
        met: list[str] = []
        missing: list[str] = []

        if not (approver or "").strip():
            reasons.append("Human approver identity required for graduation.")
            missing.append("Provide approver identity (non-empty string).")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.BASELINE_BEATING,
                to_status=ClaimStatus.GRADUATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        if self.registry.has_contradicting_experiments(claim.hypothesis_id):
            reasons.append("Contradicting evidence exists against this claim's experiments.")
            missing.append("Resolve or explain contradicting evidence before graduation.")
            return PromotionResult(
                success=False,
                from_status=ClaimStatus.BASELINE_BEATING,
                to_status=ClaimStatus.GRADUATED,
                reasons=reasons,
                requirements_met=met,
                requirements_missing=missing,
            )

        met.append("Approver provided.")
        met.append("No contradicting edges.")
        now = datetime.now()
        updated = Claim(
            id=claim.id,
            hypothesis_id=claim.hypothesis_id,
            experiment_ids=claim.experiment_ids,
            status=ClaimStatus.GRADUATED,
            mean_improvement=claim.mean_improvement,
            variance=claim.variance,
            effect_size=claim.effect_size,
            graduated_by=approver,
            graduated_at=now,
        )
        self.registry.update_claim(updated)
        return PromotionResult(
            success=True,
            from_status=ClaimStatus.BASELINE_BEATING,
            to_status=ClaimStatus.GRADUATED,
            reasons=["Graduated with human approval."],
            requirements_met=met,
            requirements_missing=[],
        )
