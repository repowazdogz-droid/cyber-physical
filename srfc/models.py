"""
Core data models for SRFC.

All dataclasses representing surgical soft robotics concepts,
anatomy specifications, and compilation results.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any


class Status(str, Enum):
    """Feasibility status levels."""
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"

    def __lt__(self, other: Status) -> bool:
        """Order: GREEN < AMBER < RED."""
        order = {Status.GREEN: 0, Status.AMBER: 1, Status.RED: 2}
        return order[self] < order[other]

    def __le__(self, other: Status) -> bool:
        return self == other or self < other


def status_order(status: Status) -> int:
    """Return numeric order for status (0=GREEN, 1=AMBER, 2=RED)."""
    return {Status.GREEN: 0, Status.AMBER: 1, Status.RED: 2}[status]


@dataclass
class AnatomySpec:
    """Anatomical context specification."""
    name: str  # e.g. "colon", "trachea"
    lumen_min_mm: float
    lumen_max_mm: float
    max_curvature_deg_per_cm: float  # rough curvature severity
    max_contact_pressure_kpa: float  # safe pressure
    notes: str = ""


@dataclass
class RobotGeometrySpec:
    """Robot geometric parameters."""
    outer_diameter_mm: float
    length_mm: float
    min_bend_radius_mm: float
    wall_thickness_mm: float


@dataclass
class RobotMaterialSpec:
    """Robot material properties."""
    name: str  # e.g. "silicone_shore_00_50"
    youngs_modulus_kpa: float
    shore_hardness: float
    friction_coeff: float
    max_strain: float  # max allowable strain (0–1)
    notes: str = ""


@dataclass
class RobotActuationSpec:
    """Robot actuation parameters."""
    mode: str  # "pneumatic", "tendon", "hydraulic", "cable"
    max_pressure_kpa: Optional[float] = None
    max_tendon_force_n: Optional[float] = None
    response_time_ms: Optional[float] = None


@dataclass
class SafetyEnvelopeSpec:
    """Safety constraints."""
    max_tip_force_n: float
    max_contact_pressure_kpa: float
    max_dwell_time_min: float


@dataclass
class ControlSpec:
    """Control system specification."""
    control_mode: str  # "manual", "teleop", "semi_autonomous"
    closed_loop: bool
    sensing_modalities: List[str]  # e.g. ["force", "position"]


@dataclass
class TetherSpec:
    """Tether/routing specification."""
    has_tether: bool
    num_lines: int  # gas + electrical + others
    total_bundle_diameter_mm: float


@dataclass
class ManufacturingSpec:
    """Manufacturing specification."""
    unit_cost_estimate: float  # in whatever currency, assume GBP for now
    expected_volume_per_year: int
    reusable: bool
    sterilization_method: str  # e.g. "steam", "gamma", "EO"
    tolerance_mm: float  # representative tightest mechanical tolerance
    special_tooling_required: bool = False


@dataclass
class ProcedureContext:
    """Surgical procedure context."""
    procedure_id: str
    domain: str  # "spine", "endoscopy", "ENT", etc.
    anatomy: str  # must match an AnatomySpec in presets
    description: str = ""
    notes: str = ""


@dataclass
class RobotConcept:
    """Complete robot concept specification."""
    geometry: RobotGeometrySpec
    materials: RobotMaterialSpec
    actuation: RobotActuationSpec
    safety: SafetyEnvelopeSpec
    control: ControlSpec
    tether: TetherSpec
    manufacturing: Optional[ManufacturingSpec] = None


@dataclass
class DimensionResult:
    """Result for a single feasibility dimension."""
    name: str
    status: Status
    score: float  # 0.0–1.0
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    knobs: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    method: Dict[str, Any] = field(default_factory=dict)
    uncertainty: Optional[Dict[str, float]] = None  # e.g. {"low": 0.83, "high": 0.91}


@dataclass
class CompileResult:
    """Complete compilation result."""
    procedure: ProcedureContext
    robot: RobotConcept
    anatomy: AnatomySpec
    dimensions: Dict[str, DimensionResult]
    overall_status: Status
    overall_score: float
    notes: List[str] = field(default_factory=list)
    interactions: List[str] = field(default_factory=list)
    translation_implications: Dict[str, List[str]] = field(default_factory=dict)
    version: str = "v2"
    timestamp: str = ""

