"""Core types for Orientation Lab with explicit uncertainty boundaries"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Set, Union
from enum import Enum
import uuid
from datetime import datetime

class AssumptionType(Enum):
    OBSERVABLE_FACT = "observable_fact"      # Can be verified
    INFERENCE = "inference"                  # Logical deduction
    PREDICTION = "prediction"                # Future-oriented claim
    VALUE_JUDGMENT = "value_judgment"        # Normative statement
    CONSTRAINT = "constraint"                # Boundary condition
    CAUSAL_CLAIM = "causal_claim"           # X causes Y
    DEFINITIONAL = "definitional"           # What we mean by terms

class ConfidenceLevel(Enum):
    HIGH = "high"           # Very confident in this
    MEDIUM = "medium"       # Moderately confident  
    LOW = "low"            # Low confidence
    SPECULATION = "speculation"  # Pure speculation

class EnergyLevel(Enum):
    HIGH = "high"          # Want to defend this actively
    MEDIUM = "medium"      # Will discuss if prompted
    LOW = "low"           # Not invested in defending
    WITHDRAWN = "withdrawn" # Don't want to engage on this

@dataclass
class Assumption:
    """Single assumption with boundaries and metadata"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    statement: str = ""
    type: AssumptionType = AssumptionType.INFERENCE
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    owner: Optional[str] = None  # Who made this assumption
    
    # Boundaries - what this assumption does/doesn't cover
    scope: str = ""              # What domain this applies to
    limitations: List[str] = field(default_factory=list)  # Known limits
    dependencies: List[str] = field(default_factory=list) # Other assumption IDs
    
    # Evidence and reasoning
    evidence: List[str] = field(default_factory=list)     # Supporting evidence
    reasoning: str = ""          # Why this assumption is made
    
    # Uncertainty tracking
    uncertain_about: List[str] = field(default_factory=list)  # What's unknown
    would_change_if: List[str] = field(default_factory=list)  # Falsification conditions
    
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Model:
    """Mental model with explicit uncertainty boundaries"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    owner: Optional[str] = None
    description: str = ""
    
    # Core components
    assumptions: List[Assumption] = field(default_factory=list)
    relationships: List[str] = field(default_factory=list)  # How assumptions relate
    
    # Boundaries - what this model does/doesn't explain
    explains: List[str] = field(default_factory=list)      # What it accounts for
    doesnt_explain: List[str] = field(default_factory=list) # Known gaps
    scope: str = ""                                        # Domain of applicability
    
    # Meta-properties
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    energy: EnergyLevel = EnergyLevel.MEDIUM
    
    # Uncertainty tracking
    uncertain_variables: List[str] = field(default_factory=list)
    sensitivity_analysis: Dict[str, str] = field(default_factory=dict)  # How changes affect model
    
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def get_assumptions_by_type(self, assumption_type: AssumptionType) -> List[Assumption]:
        """Get assumptions of specific type"""
        return [a for a in self.assumptions if a.type == assumption_type]

@dataclass
class DisagreementPoint:
    """Point where models diverge"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: str = ""
    
    # Models that disagree
    model_ids: List[str] = field(default_factory=list)
    
    # Nature of disagreement
    disagreement_type: str = ""  # "assumption", "inference", "prediction", etc.
    crux_statement: str = ""     # Core point of divergence
    
    # What would resolve this
    resolution_criteria: List[str] = field(default_factory=list)
    resolvable: bool = True      # Can this be resolved with more info?
    
    # Assumption differences
    conflicting_assumptions: List[str] = field(default_factory=list)  # Assumption IDs

@dataclass
class OrientationSession:
    """Complete orientation session with all models and analysis"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    context: str = ""            # What are we trying to understand?
    
    # Participants and models
    participants: List[str] = field(default_factory=list)
    models: List[Model] = field(default_factory=list)
    
    # Analysis results  
    common_ground: List[str] = field(default_factory=list)     # Shared assumptions
    disagreement_points: List[DisagreementPoint] = field(default_factory=list)
    unresolved_uncertainties: List[str] = field(default_factory=list)
    
    # Session metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    facilitator: Optional[str] = None
    
    # Anti-optimization safeguards
    _authority_claims: List[str] = field(default_factory=list)  # Track any authority claims
    _optimization_attempts: List[str] = field(default_factory=list)  # Track optimization attempts

@dataclass
class UncertaintyBoundary:
    """Explicit boundary of what we know vs don't know"""
    domain: str = ""
    known_with_confidence: List[str] = field(default_factory=list)
    suspected_but_uncertain: List[str] = field(default_factory=list) 
    completely_unknown: List[str] = field(default_factory=list)
    unknowable: List[str] = field(default_factory=list)  # Inherently unknowable
    
    # Meta-uncertainty
    uncertain_about_uncertainty: List[str] = field(default_factory=list)
