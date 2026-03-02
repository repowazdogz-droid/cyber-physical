"""Experiment proposal validation (baseline, ablation, determinism).

Master validator: orchestrates all checks and returns the most restrictive result.
"""

import re
from datetime import datetime

from omega_research.config import OmegaResearchConfig
from omega_research.governor import ScalingGovernor
from omega_research.models import (
    EnforcementAction,
    EnforcementResult,
    ExperimentProposal,
    HypothesisType,
    PolicyEvent,
    PolicyEventType,
)
from omega_research.registry import ExperimentRegistry

# SHA-256: 64 hex characters
SHA256_PATTERN = re.compile(r"^[a-fA-F0-9]{64}$")


class ExperimentProtocol:
    """Orchestrates ALL validation checks on an experiment proposal."""

    def __init__(self, config: OmegaResearchConfig, registry: ExperimentRegistry) -> None:
        self.config = config
        self.governor = ScalingGovernor(config)
        self.registry = registry

    def validate_proposal(self, proposal: ExperimentProposal) -> EnforcementResult:
        """
        Run ALL validation checks on a proposal.
        Returns the MOST RESTRICTIVE result (BLOCK > WARN > ALLOW).
        Aggregates all reasons and requirements.
        """
        results: list[EnforcementResult] = []

        # 3a. Baseline existence
        r = self._check_baseline_exists(proposal)
        if r is not None:
            results.append(r)

        # 3b. Baseline metrics consistency (only if baseline exists)
        if self.registry.exists(proposal.baseline.baseline_experiment_id):
            r = self._check_baseline_metrics(proposal)
            if r is not None:
                results.append(r)

        # 3c. Changed vs controlled variables
        r = self._check_variable_overlap(proposal)
        if r is not None:
            results.append(r)

        # 3d. Determinism config_hash
        r = self._check_config_hash(proposal)
        if r is not None:
            results.append(r)

        # 3e. Ablation for architecture hypothesis
        r = self._check_ablation_for_architecture(proposal)
        if r is not None:
            results.append(r)

        # 3f. Scaling governor (only if baseline exists and we have its budget)
        baseline_entry = self.registry.get(proposal.baseline.baseline_experiment_id)
        if baseline_entry is not None:
            scaling_result = self.governor.evaluate(proposal, baseline_entry.compute_budget)
            results.append(scaling_result)

        # 3g. Duplicate detection
        r = self._check_duplicate(proposal)
        if r is not None:
            results.append(r)

        # 3h. Previously falsified hypothesis
        r = self._check_falsified_hypothesis(proposal)
        if r is not None:
            results.append(r)

        if not results:
            return EnforcementResult(
                action=EnforcementAction.ALLOW,
                events=[],
                reasons=[],
                requirements=[],
                protocol_version=self.config.protocol_version,
                timestamp=datetime.now(),
            )

        return self._aggregate_results(results)

    def _check_baseline_exists(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        if self.registry.exists(proposal.baseline.baseline_experiment_id):
            return None
        return EnforcementResult(
            action=EnforcementAction.BLOCK,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.BLOCK_MISSING_BASELINE,
                    description=f"Baseline experiment {proposal.baseline.baseline_experiment_id} not found in registry.",
                    metadata={"baseline_experiment_id": proposal.baseline.baseline_experiment_id},
                )
            ],
            reasons=[f"Baseline experiment {proposal.baseline.baseline_experiment_id} not found in registry."],
            requirements=["Submit baseline experiment first, or reference existing experiment."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _check_baseline_metrics(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        if proposal.baseline.baseline_metrics:
            return None
        return EnforcementResult(
            action=EnforcementAction.BLOCK,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.BLOCK_MISSING_BASELINE,
                    description="Baseline metrics not declared.",
                    metadata={},
                )
            ],
            reasons=["Baseline metrics not declared."],
            requirements=["Provide baseline_metrics dict with at least one metric."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _check_variable_overlap(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        controlled = set(proposal.baseline.controlled_variables)
        changed = set(proposal.baseline.changed_variables)
        overlap = controlled & changed
        if not overlap:
            return None
        var = next(iter(overlap))
        return EnforcementResult(
            action=EnforcementAction.BLOCK,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.BLOCK_VARIABLE_OVERLAP,
                    description=f"Variable '{var}' appears in both changed and controlled.",
                    metadata={"variable": var},
                )
            ],
            reasons=[f"Variable '{var}' appears in both changed and controlled."],
            requirements=["Each variable must be in exactly one category."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _check_config_hash(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        h = proposal.determinism.config_hash.strip()
        if h and SHA256_PATTERN.match(h):
            return None
        return EnforcementResult(
            action=EnforcementAction.BLOCK,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.BLOCK_MISSING_DETERMINISM,
                    description="Invalid or missing config_hash.",
                    metadata={},
                )
            ],
            reasons=["Invalid or missing config_hash."],
            requirements=["Provide SHA-256 hash of full experiment configuration."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _check_ablation_for_architecture(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        hypothesis = self.registry.get_hypothesis(proposal.hypothesis_id)
        if hypothesis is None or hypothesis.type != HypothesisType.ARCHITECTURE:
            return None
        if proposal.ablation_plan is not None and len(proposal.ablation_plan.targets) > 0:
            return None
        return EnforcementResult(
            action=EnforcementAction.BLOCK,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.BLOCK_MISSING_ABLATION,
                    description="Architecture change hypothesis requires ablation plan.",
                    metadata={"hypothesis_id": proposal.hypothesis_id},
                )
            ],
            reasons=["Architecture change hypothesis requires ablation plan."],
            requirements=["Declare ablation targets with expected directional effects."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _check_duplicate(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        duplicates = self.registry.find_duplicates(
            proposal.hypothesis_id, proposal.determinism.config_hash
        )
        if not duplicates:
            return None
        existing_id = duplicates[0].id
        return EnforcementResult(
            action=EnforcementAction.WARN,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.WARN_DUPLICATE_EXPERIMENT,
                    description=f"Experiment with same hypothesis and config already exists: {existing_id}",
                    metadata={"existing_experiment_id": existing_id},
                )
            ],
            reasons=[f"Experiment with same hypothesis and config already exists: {existing_id}"],
            requirements=["Confirm this is intentional replication, not accidental duplicate."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _check_falsified_hypothesis(self, proposal: ExperimentProposal) -> EnforcementResult | None:
        if not self.registry.has_contradicting_experiments(proposal.hypothesis_id):
            return None
        contradicting_id = self.registry.get_contradicting_experiment_id(proposal.hypothesis_id)
        return EnforcementResult(
            action=EnforcementAction.WARN,
            events=[
                PolicyEvent(
                    event_type=PolicyEventType.WARN_FALSIFIED_HYPOTHESIS,
                    description=f"Hypothesis {proposal.hypothesis_id} was previously contradicted by experiment {contradicting_id or 'unknown'}.",
                    metadata={"hypothesis_id": proposal.hypothesis_id},
                )
            ],
            reasons=[
                f"Hypothesis {proposal.hypothesis_id} was previously contradicted by experiment {contradicting_id or 'unknown'}."
            ],
            requirements=["Explain what has changed to warrant revisiting this hypothesis."],
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )

    def _aggregate_results(self, results: list[EnforcementResult]) -> EnforcementResult:
        """Combine multiple check results: BLOCK > WARN > ALLOW; collect all reasons and requirements."""
        action = EnforcementAction.ALLOW
        for r in results:
            if r.action == EnforcementAction.BLOCK:
                action = EnforcementAction.BLOCK
                break
            if r.action == EnforcementAction.WARN:
                action = EnforcementAction.WARN
        events: list[PolicyEvent] = []
        reasons: list[str] = []
        requirements: list[str] = []
        for r in results:
            events.extend(r.events)
            reasons.extend(r.reasons)
            requirements.extend(r.requirements)
        return EnforcementResult(
            action=action,
            events=events,
            reasons=reasons,
            requirements=requirements,
            protocol_version=self.config.protocol_version,
            timestamp=datetime.now(),
        )
