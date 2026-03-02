"""Policy constants and central configuration."""

from pydantic import BaseModel


class OmegaResearchConfig(BaseModel):
    """Central configuration. All governance thresholds live here."""

    # Protocol versioning — EVERY record embeds these
    protocol_version: str = "0.1.0"
    scaling_policy_version: str = "0.1.0"
    lifecycle_version: str = "0.1.0"

    # Scaling governor
    param_delta_threshold: float = 0.20
    flop_delta_threshold: float = 0.50
    minor_param_threshold: float = 0.05

    # Replication
    min_replication_runs: int = 3
    improvement_threshold: float = 0.01  # 1% improvement triggers replication requirement
    max_acceptable_cv: float = 0.10  # Coefficient of variation ceiling

    # Claim graduation
    min_effect_size: float = 0.05  # Minimum meaningful effect
    significance_threshold: float = 0.05  # p < 0.05 equivalent

    # Runtime
    max_runtime_minutes: int = 480  # 8 hour hard ceiling

    # Registry
    registry_path: str = "./omega_research_data"
