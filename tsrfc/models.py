from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ProcedureDomain(str, Enum):
    SPINE = "spine"
    ENT = "ent"
    ENDOSCOPY = "endoscopy"
    OTHER = "other"


class Setting(str, Enum):
    TERTIARY = "tertiary_centre"
    DISTRICT = "district_general"
    PRIVATE = "private_hospital"
    OTHER = "other"


class TechRole(str, Enum):
    PREOP_PLANNING = "preop_planning"
    POSITIONING = "positioning"
    NAVIGATION = "navigation"
    RESECTION_ASSIST = "resection_assist"
    CLOSURE = "closure"
    MONITORING = "monitoring"
    WORKFLOW = "workflow"
    OTHER = "other"


class CostBand(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EvidenceLevel(str, Enum):
    OPINION = "expert_opinion"
    CASE_SERIES = "case_series"
    SINGLE_CENTER = "single_centre"
    MULTI_CENTER = "multi_centre"
    RCT = "rct"
    META_ANALYSIS = "meta_analysis"
    UNKNOWN = "unknown"


class AdoptionTrajectory(str, Enum):
    NICHE_THEN_PLATEAU = "niche_then_plateau"
    RAPID_ADOPTION = "rapid_adoption"
    SLOW_STEADY = "slow_steady"
    EARLY_HYPE_THEN_DECLINE = "early_hype_then_decline"
    UNLIKELY_TO_ADOPT = "unlikely_to_adopt"
    UNKNOWN = "unknown"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class ProcedureSpec:
    """High-level specification of a procedure context."""

    procedure_id: str
    domain: ProcedureDomain
    indication: str
    approach: str
    setting: Setting
    notes: Optional[str] = None


@dataclass
class TechConcept:
    """Specification of the innovation concept being evaluated."""

    name: str
    type: str  # free-text type, e.g. "navigation_assisted_tool"
    role: TechRole
    capital_cost_band: CostBand
    disposables_cost_band: CostBand
    learning_curve_cases: Optional[int] = None
    requires_advanced_nav: bool = False
    robotic_integration: str = "none"  # "none" | "optional" | "required"
    description: Optional[str] = None


@dataclass
class UnitOperation:
    """One unit operation in a procedure."""

    op_id: str
    name: str
    primary_goal: str
    typical_issues: List[str] = field(default_factory=list)
    innovation_hooks: List[str] = field(default_factory=list)


@dataclass
class FailureSurface:
    """A place where innovation can fail (technical, workflow, adoption, etc.)."""

    category: str  # "technical" | "workflow" | "adoption" | "evidence" | "economic" | ...
    code: str
    description: str
    risk: RiskLevel
    affected_ops: List[str] = field(default_factory=list)  # op_ids
    notes: Optional[str] = None


@dataclass
class EvidenceProfile:
    """Summary of evidence state and requirements."""

    current_level: EvidenceLevel
    target_level: EvidenceLevel
    key_endpoints: List[str] = field(default_factory=list)
    estimated_sample_size: Optional[int] = None
    estimated_centres: Optional[int] = None
    time_horizon_years: Optional[float] = None
    comments: Optional[str] = None


@dataclass
class AdoptionProfile:
    """Summary of adoption dynamics and friction."""

    trajectory: AdoptionTrajectory
    primary_barriers: List[str] = field(default_factory=list)
    leverage_points: List[str] = field(default_factory=list)
    kill_criteria: List[str] = field(default_factory=list)
    notes: Optional[str] = None


@dataclass
class CompileResult:
    """Top-level result for a given procedure + tech concept."""

    procedure: ProcedureSpec
    concept: TechConcept
    unit_operations: List[UnitOperation]
    failure_surfaces: List[FailureSurface]
    evidence_profile: EvidenceProfile
    adoption_profile: AdoptionProfile
    scores: Dict[str, float] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)






