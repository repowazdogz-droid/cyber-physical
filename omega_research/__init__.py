"""omega_research — deterministic experiment governance runtime for autonomous ML research agents."""

from omega_research.config import OmegaResearchConfig
from omega_research.governor import ScalingGovernor
from omega_research.lifecycle import ClaimLifecycle
from omega_research.protocol import ExperimentProtocol
from omega_research.registry import ExperimentRegistry
from omega_research.replication import ReplicationGate
from omega_research.trust import canonical_json, compute_hash, create_experiment_record

__all__ = [
    "OmegaResearchConfig",
    "ScalingGovernor",
    "ClaimLifecycle",
    "ExperimentProtocol",
    "ExperimentRegistry",
    "ReplicationGate",
    "canonical_json",
    "compute_hash",
    "create_experiment_record",
]
