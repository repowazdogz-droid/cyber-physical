"""Core types for governance determination"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Union
from enum import Enum
from datetime import datetime
import uuid

class GovernabilityStatus(Enum):
    GOVERNABLE = "governable"
    NOT_GOVERNABLE = "not_governable"
    CONDITIONALLY_GOVERNABLE = "conditionally_governable"
    INSUFFICIENT_INFORMATION = "insufficient_information"

class GovernanceViolationType(Enum):
    INFORMATION_ASYMMETRY = "information_asymmetry"
    POWER_CONSEQUENCE_MISMATCH = "power_consequence_mismatch"
    ROLLBACK_FICTION = "rollback_fiction"
    DELEGATED_AGENCY_WITHOUT_HALT = "delegated_agency_without_halt"
    SCOPE_BOUNDARY_VIOLATION = "scope_boundary_violation"
    ACCOUNTABILITY_GAP = "accountability_gap"

class SystemType(Enum):
    AI_SYSTEM = "ai_system"
    AUTONOMOUS_AGENT = "autonomous_agent" 
    DECISION_SUPPORT = "decision_support"
    INFRASTRUCTURE = "infrastructure"
    HYBRID_SYSTEM = "hybrid_system"
    UNKNOWN = "unknown"

@dataclass
class SystemSpecification:
    """Specification of system to be assessed"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    system_type: SystemType = SystemType.UNKNOWN
    
    # Core system properties
    autonomous_components: List[str] = field(default_factory=list)
    human_oversight_points: List[str] = field(default_factory=list)
    decision_authority_structure: Dict[str, str] = field(default_factory=dict)
    
    # Deployment characteristics
    deployment_scope: str = ""
    stakeholder_impact: List[str] = field(default_factory=list)
    reversibility_characteristics: Dict[str, bool] = field(default_factory=dict)
    
    # Risk characteristics
    potential_harms: List[str] = field(default_factory=list)
    failure_modes: List[str] = field(default_factory=list)
    control_mechanisms: List[str] = field(default_factory=list)
    
    # Information flow
    information_visibility: Dict[str, str] = field(default_factory=dict)
    feedback_loops: List[str] = field(default_factory=list)
    
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class GovernanceEvidence:
    """Evidence supporting governance determination"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    evidence_type: str = ""
    source: str = ""
    description: str = ""
    
    # Evidence content
    findings: List[str] = field(default_factory=list)
    supporting_data: Dict[str, Any] = field(default_factory=dict)
    confidence_level: str = "medium"  # high, medium, low
    
    # Methodology
    collection_method: str = ""
    analysis_approach: str = ""
    limitations: List[str] = field(default_factory=list)
    
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class GovernanceViolation:
    """Identified governance violation"""
    violation_type: GovernanceViolationType
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    severity: str = "medium"  # critical, high, medium, low
    
    # Violation details
    description: str = ""
    affected_components: List[str] = field(default_factory=list)
    risk_factors: List[str] = field(default_factory=list)
    
    # Evidence
    supporting_evidence: List[str] = field(default_factory=list)  # Evidence IDs
    confidence: str = "medium"
    
    # Potential mitigations
    possible_mitigations: List[str] = field(default_factory=list)
    mitigation_feasibility: Dict[str, str] = field(default_factory=dict)

@dataclass
class GovernanceDetermination:
    """Formal governance determination"""
    system_specification: SystemSpecification
    status: GovernabilityStatus
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    determination_number: str = ""  # e.g., "OMEGA-F-2026-001"
    summary: str = ""
    
    # Analysis
    violations: List[GovernanceViolation] = field(default_factory=list)
    evidence: List[GovernanceEvidence] = field(default_factory=list)
    risk_assessment: Dict[str, Any] = field(default_factory=dict)
    
    # Conditions (for conditional governability)
    enabling_conditions: List[str] = field(default_factory=list)
    boundary_conditions: List[str] = field(default_factory=list)
    
    # Formal components
    basis: List[str] = field(default_factory=list)  # Legal/theoretical basis
    limits: List[str] = field(default_factory=list)  # Scope limitations
    invalidation_conditions: List[str] = field(default_factory=list)
    
    # Metadata
    assessed_by: str = "OMEGA-F Assessment Protocol v1.0"
    assessment_date: datetime = field(default_factory=datetime.utcnow)
    public_release_date: Optional[datetime] = None
    version: str = "1.0"
    
    def to_public_record(self) -> Dict[str, Any]:
        """Convert to public determination record format"""
        return {
            "determination_number": self.determination_number,
            "status": self.status.value,
            "system_name": self.system_specification.name,
            "summary": self.summary,
            "assessment_date": self.assessment_date.isoformat(),
            "public_release_date": self.public_release_date.isoformat() if self.public_release_date else None,
            "basis": self.basis,
            "limits": self.limits,
            "violations_count": len(self.violations),
            "evidence_count": len(self.evidence)
        }
