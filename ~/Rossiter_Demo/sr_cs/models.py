"""
Core data models for SR-CS v0.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict


class RiskLevel(str, Enum):
    """Risk level classification."""
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


class DimensionName(str, Enum):
    """Constraint dimension names."""
    MATERIALS = "MATERIALS"
    ACTUATION = "ACTUATION"
    MORPHOLOGY = "MORPHOLOGY"
    CONTROL_LATENCY = "CONTROL_LATENCY"
    ENVIRONMENT_INTERFACE = "ENVIRONMENT_INTERFACE"
    INTEGRATION = "INTEGRATION"


@dataclass
class DimensionResult:
    """Result for a single constraint dimension."""
    name: DimensionName
    status: RiskLevel
    score: float  # 0.0-1.0
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

    def __post_init__(self):
        """Validate score range."""
        if not 0.0 <= self.score <= 1.0:
            raise ValueError(f"Score must be between 0.0 and 1.0, got {self.score}")


@dataclass
class CompileResult:
    """Complete compilation result for a soft robotics spec."""
    case_name: str
    overall_status: RiskLevel
    overall_score: float  # 0.0-1.0
    dimensions: List[DimensionResult]
    frontier_notes: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    metadata: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        """Validate score range."""
        if not 0.0 <= self.overall_score <= 1.0:
            raise ValueError(f"Overall score must be between 0.0 and 1.0, got {self.overall_score}")

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "case_name": self.case_name,
            "overall_status": self.overall_status.value,
            "overall_score": self.overall_score,
            "dimensions": [
                {
                    "name": d.name.value,
                    "status": d.status.value,
                    "score": d.score,
                    "issues": d.issues,
                    "suggestions": d.suggestions,
                }
                for d in self.dimensions
            ],
            "frontier_notes": self.frontier_notes,
            "created_at": self.created_at,
            "metadata": self.metadata,
        }

    def pretty_print(self) -> str:
        """Generate deterministic multi-line text output."""
        lines = []
        lines.append("=" * 70)
        lines.append(f"SR-CS v0 Evaluation: {self.case_name}")
        lines.append("=" * 70)
        lines.append("")
        lines.append(f"Overall Status: {self.overall_status.value}")
        lines.append(f"Overall Score: {self.overall_score:.2f}/1.00")
        lines.append("")
        lines.append("-" * 70)
        lines.append("Dimension Results:")
        lines.append("-" * 70)
        lines.append("")

        for dim in self.dimensions:
            lines.append(f"[{dim.status.value}] {dim.name.value}")
            lines.append(f"  Score: {dim.score:.2f}/1.00")
            if dim.issues:
                lines.append("  Issues:")
                for issue in dim.issues:
                    lines.append(f"    - {issue}")
            if dim.suggestions:
                lines.append("  Suggestions:")
                for suggestion in dim.suggestions:
                    lines.append(f"    + {suggestion}")
            lines.append("")

        if self.frontier_notes:
            lines.append("-" * 70)
            lines.append("Frontier Notes:")
            lines.append("-" * 70)
            for note in self.frontier_notes:
                lines.append(f"  • {note}")
            lines.append("")

        lines.append(f"Generated: {self.created_at}")
        lines.append("=" * 70)

        return "\n".join(lines)


