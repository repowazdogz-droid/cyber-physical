"""Scaling policy and compute budget enforcement."""

from datetime import datetime

from omega_research.config import OmegaResearchConfig
from omega_research.models import (
    ComputeBudget,
    EnforcementAction,
    EnforcementResult,
    ExperimentProposal,
    PolicyEvent,
    PolicyEventType,
    ScalingHypothesisType,
)


class ScalingGovernor:
    def __init__(self, config: OmegaResearchConfig) -> None:
        self.config = config

    def evaluate(
        self, proposal: ExperimentProposal, baseline_budget: ComputeBudget
    ) -> EnforcementResult:
        """
        Core governance logic:
        1. Compute param_delta and flop_delta vs baseline
        2. Apply scaling policy
        3. Return ALLOW / WARN / BLOCK with reasons
        """
        events: list[PolicyEvent] = []
        action = EnforcementAction.ALLOW

        if baseline_budget.param_count <= 0 or baseline_budget.estimated_flops <= 0:
            events.append(
                PolicyEvent(
                    event_type=PolicyEventType.TRIGGER_SCALING_REVIEW,
                    description="Invalid baseline budget: param_count or estimated_flops must be positive.",
                    metadata={},
                )
            )
            action = EnforcementAction.BLOCK
        else:
            param_delta = (
                proposal.compute_budget.param_count - baseline_budget.param_count
            ) / baseline_budget.param_count
            flop_delta = (
                proposal.compute_budget.estimated_flops - baseline_budget.estimated_flops
            ) / baseline_budget.estimated_flops

            param_threshold = self.config.param_delta_threshold
            flop_threshold = self.config.flop_delta_threshold
            minor_threshold = self.config.minor_param_threshold

            if param_delta > param_threshold or flop_delta > flop_threshold:
                events.append(
                    PolicyEvent(
                        event_type=PolicyEventType.TRIGGER_SCALING_REVIEW,
                        description=f"Compute delta detected: params {param_delta:+.0%}, FLOPs {flop_delta:+.0%}",
                        metadata={"param_delta": param_delta, "flop_delta": flop_delta},
                    )
                )

                if proposal.scaling_hypothesis is None:
                    events.append(
                        PolicyEvent(
                            event_type=PolicyEventType.REQUIRE_SCALING_HYPOTHESIS,
                            description="No scaling hypothesis declared for significant compute increase.",
                            metadata={"param_delta": param_delta, "flop_delta": flop_delta},
                        )
                    )
                    action = EnforcementAction.BLOCK
                elif proposal.scaling_hypothesis.type == ScalingHypothesisType.SCALING_STUDY:
                    action = EnforcementAction.ALLOW
                elif proposal.scaling_hypothesis.type in (
                    ScalingHypothesisType.ARCHITECTURE_CHANGE,
                    ScalingHypothesisType.CAPACITY_REQUIREMENT,
                ):
                    events.append(
                        PolicyEvent(
                            event_type=PolicyEventType.WARN_UNJUSTIFIED_SCALING,
                            description=f"Scaling justified as {proposal.scaling_hypothesis.type.value} but compute delta is significant.",
                            metadata={"scaling_type": proposal.scaling_hypothesis.type.value},
                        )
                    )
                    action = EnforcementAction.WARN

                    if proposal.ablation_plan is None:
                        events.append(
                            PolicyEvent(
                                event_type=PolicyEventType.REQUIRE_ABLATION_AT_ORIGINAL_SCALE,
                                description="Architecture/capacity scaling without ablation at original scale.",
                                metadata={},
                            )
                        )
                        action = EnforcementAction.BLOCK

            elif param_delta > minor_threshold:
                events.append(
                    PolicyEvent(
                        event_type=PolicyEventType.NOTE_MINOR_PARAM_INCREASE,
                        description=f"Minor parameter increase ({param_delta:+.0%}). Logged.",
                        metadata={"param_delta": param_delta},
                    )
                )
                action = EnforcementAction.ALLOW
            else:
                action = EnforcementAction.ALLOW

        reasons = [e.description for e in events]
        requirements = [
            e.description
            for e in events
            if e.event_type.value.startswith("require_")
        ]

        return EnforcementResult(
            action=action,
            events=events,
            reasons=reasons,
            requirements=requirements,
            protocol_version=self.config.scaling_policy_version,
            timestamp=datetime.now(),
        )
