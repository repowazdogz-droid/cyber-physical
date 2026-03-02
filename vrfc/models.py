from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class Status(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


@dataclass
class DimensionResult:
    name: str
    status: Status
    score: float
    issues: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    suggestions: List[str] = field(default_factory=list)
    sensitivity: Dict[str, Any] = field(default_factory=dict)
    fatal_issues: List[str] = field(default_factory=list)
    method: Dict[str, Any] = field(default_factory=dict)
    uncertainty: Optional[Dict[str, float]] = None


@dataclass
class VRFCResult:
    spec_id: str
    spec_name: str
    overall_status: Status
    overall_score: float
    dimensions: Dict[str, DimensionResult]
    notes: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProcedureSpec:
    """Thin wrapper around a raw dict with a few convenience fields."""

    id: str
    name: str
    domain: str
    subdomain: Optional[str]
    risk_class: str
    jurisdiction: str
    payer_mix: List[str]
    data: Dict[str, Any]

    @classmethod
    def from_dict(cls, raw: Dict[str, Any]) -> "ProcedureSpec":
        return cls(
            id=raw.get("id", "unknown"),
            name=raw.get("name", "Unnamed procedure"),
            domain=raw.get("domain", "unknown"),
            subdomain=raw.get("subdomain"),
            risk_class=str(raw.get("risk_class", "unknown")),
            jurisdiction=raw.get("jurisdiction", "unknown"),
            payer_mix=list(raw.get("payer_mix", [])),
            data=raw,
        )

    def section(self, key: str, default: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        value = self.data.get(key, {})
        if not isinstance(value, dict):
            return default or {}
        return value

