"""Pydantic models — the schema IS the governance."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, field_validator, model_validator


# --- Scaling ---


class ScalingHypothesisType(str, Enum):
    SCALING_STUDY = "scaling_study"
    ARCHITECTURE_CHANGE = "architecture_change"
    CAPACITY_REQUIREMENT = "capacity_requirement"


class ScalingHypothesis(BaseModel):
    type: ScalingHypothesisType
    justification: str
    intermediate_scales: list[float]
    baseline_scale_included: bool

    @model_validator(mode="after")
    def validate_scaling_study(self) -> "ScalingHypothesis":
        if self.type == ScalingHypothesisType.SCALING_STUDY:
            if len(self.intermediate_scales) < 1:
                raise ValueError("Scaling study must include at least one intermediate scale point")
            if not self.baseline_scale_included:
                raise ValueError("Scaling study must include baseline scale for comparison")
        return self


# --- Compute ---


class ComputeBudget(BaseModel):
    param_count: int
    estimated_flops: float
    max_runtime_minutes: int
    max_gpu_memory_gb: float

    @field_validator("param_count")
    @classmethod
    def param_count_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("param_count must be positive")
        return v


# --- Baseline ---


class BaselineDeclaration(BaseModel):
    baseline_experiment_id: str
    baseline_metrics: dict[str, float]
    controlled_variables: list[str]
    changed_variables: list[str]

    @field_validator("changed_variables")
    @classmethod
    def must_change_something(cls, v: list[str]) -> list[str]:
        if len(v) == 0:
            raise ValueError("Must declare at least one changed variable")
        return v


# --- Ablation ---


class AblationTarget(BaseModel):
    variable: str
    expected_direction: str  # "increase", "decrease", "no_change"
    rationale: str


class AblationPlan(BaseModel):
    targets: list[AblationTarget]

    @field_validator("targets")
    @classmethod
    def must_have_targets(cls, v: list[AblationTarget]) -> list[AblationTarget]:
        if len(v) == 0:
            raise ValueError("Ablation plan must have at least one target")
        return v


# --- Determinism ---


class DeterminismControls(BaseModel):
    random_seed: int
    dataset_version: str
    model_version: str
    config_hash: str  # SHA-256 of full experiment config


# --- Hypothesis ---


class HypothesisType(str, Enum):
    ARCHITECTURE = "architecture"
    OPTIMIZATION = "optimization"
    DATA = "data"
    TRAINING_REGIME = "training_regime"
    OBJECTIVE = "objective"
    SCALING = "scaling"


class Hypothesis(BaseModel):
    id: str
    type: HypothesisType
    statement: str
    why_baseline_fails: str
    expected_effect_direction: str
    falsification_condition: str
    created_at: datetime


# --- Proposal ---


class ExperimentProposal(BaseModel):
    id: str
    hypothesis_id: str
    baseline: BaselineDeclaration
    compute_budget: ComputeBudget
    determinism: DeterminismControls
    scaling_hypothesis: ScalingHypothesis | None = None
    ablation_plan: AblationPlan | None = None
    proposed_at: datetime


# --- Result ---


class ExperimentResult(BaseModel):
    experiment_id: str
    metrics: dict[str, float]
    runtime_minutes: float
    actual_gpu_memory_gb: float
    seed: int
    completed_at: datetime


# --- Claim ---


class ClaimStatus(str, Enum):
    OBSERVATION = "observation"
    REPLICATED = "replicated"
    BASELINE_BEATING = "baseline_beating"
    GRADUATED = "graduated"


class Claim(BaseModel):
    id: str
    hypothesis_id: str
    experiment_ids: list[str]
    status: ClaimStatus
    mean_improvement: float | None = None
    variance: float | None = None
    effect_size: float | None = None
    graduated_by: str | None = None
    graduated_at: datetime | None = None


# --- Policy events ---


class PolicyEventType(str, Enum):
    TRIGGER_SCALING_REVIEW = "trigger_scaling_review"
    REQUIRE_SCALING_HYPOTHESIS = "require_scaling_hypothesis"
    REQUIRE_INTERMEDIATE_SCALE = "require_intermediate_scale"
    REQUIRE_BASELINE_SCALE = "require_baseline_scale"
    REQUIRE_ABLATION_AT_ORIGINAL_SCALE = "require_ablation_at_original_scale"
    WARN_UNJUSTIFIED_SCALING = "warn_unjustified_scaling"
    NOTE_MINOR_PARAM_INCREASE = "note_minor_param_increase"
    BLOCK_MISSING_BASELINE = "block_missing_baseline"
    BLOCK_MISSING_DETERMINISM = "block_missing_determinism"
    BLOCK_VARIABLE_OVERLAP = "block_variable_overlap"
    BLOCK_MISSING_ABLATION = "block_missing_ablation"
    WARN_DUPLICATE_EXPERIMENT = "warn_duplicate_experiment"
    WARN_FALSIFIED_HYPOTHESIS = "warn_falsified_hypothesis"


class PolicyEvent(BaseModel):
    event_type: PolicyEventType
    description: str
    metadata: dict[str, str | float | int] = {}


# --- Enforcement ---


class EnforcementAction(str, Enum):
    ALLOW = "allow"
    WARN = "warn"
    BLOCK = "block"


class EnforcementResult(BaseModel):
    action: EnforcementAction
    events: list[PolicyEvent]
    reasons: list[str]
    requirements: list[str]
    protocol_version: str
    timestamp: datetime


# --- Registry ---


class RegistryEdgeType(str, Enum):
    SUPPORTS = "supports"
    CONTRADICTS = "contradicts"
    INCONCLUSIVE = "inconclusive"


class RegistryEdge(BaseModel):
    from_experiment_id: str
    to_experiment_id: str
    edge_type: RegistryEdgeType
    evidence: str


# --- Registry entry (minimal record for protocol / registry) ---


class RegistryEntry(BaseModel):
    """Minimal experiment record stored in registry for lookups."""

    experiment_id: str
    compute_budget: ComputeBudget
    hypothesis_id: str = ""
    config_hash: str = ""


# --- Replication ---


class ReplicationVerdict(BaseModel):
    """Verdict from replication gate after evaluating multiple runs."""

    sufficient_runs: bool
    run_count: int
    required_runs: int
    mean_value: float
    variance: float
    std_dev: float
    coefficient_of_variation: float
    improvement_over_baseline: float
    improvement_significant: bool
    verdict: str  # "pass", "insufficient_runs", "high_variance", "insignificant_improvement"
    details: list[str]


# --- Lifecycle ---


class PromotionResult(BaseModel):
    """Result of attempting to promote a claim to the next tier."""

    success: bool
    from_status: ClaimStatus
    to_status: ClaimStatus
    reasons: list[str]
    requirements_met: list[str]
    requirements_missing: list[str]


# --- Registry hash chain (base for all stored records) ---


class RegistryRecord(BaseModel):
    """Base for all registry entries. Every JSONL line includes these."""

    record_hash: str
    previous_record_hash: str
    protocol_version: str
    recorded_at: datetime


# Stored variants: chain fields + payload. We use payload-as-dict for flexibility.
class StoredHypothesis(RegistryRecord):
    """Hypothesis plus chain fields for registry."""

    id: str
    type: HypothesisType
    statement: str
    why_baseline_fails: str
    expected_effect_direction: str
    falsification_condition: str
    created_at: datetime


class StoredExperiment(RegistryRecord):
    """Experiment proposal plus chain fields."""

    experiment_id: str
    proposal: dict  # ExperimentProposal.model_dump(mode='json')


class StoredResult(RegistryRecord):
    """Experiment result plus chain fields."""

    result: dict  # ExperimentResult.model_dump(mode='json')


class StoredClaim(RegistryRecord):
    """Claim plus chain fields. Updates append new record with supersedes."""

    claim_id: str
    hypothesis_id: str
    experiment_ids: list[str]
    status: ClaimStatus
    mean_improvement: float | None = None
    variance: float | None = None
    effect_size: float | None = None
    graduated_by: str | None = None
    graduated_at: datetime | None = None
    supersedes: str | None = None  # previous record_hash or claim record id


class StoredEdge(RegistryRecord):
    """Registry edge plus chain fields."""

    from_experiment_id: str
    to_experiment_id: str
    edge_type: RegistryEdgeType
    evidence: str
