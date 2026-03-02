"""Enhanced constraint types with formal verification support"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Set, Union
from enum import Enum
from abc import ABC, abstractmethod

try:
    import z3
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False
    z3 = None

class ConstraintType(Enum):
    # Basic constraints (existing)
    NOT_TOGETHER = "not_together"
    REQUIRES = "requires"
    AT_MOST_K_OF_SET = "at_most_k_of_set"
    EXACTLY_K_OF_SET = "exactly_k_of_set"
    
    # Enhanced constraints (new)
    TEMPORAL_ORDER = "temporal_order"
    RESOURCE_BUDGET = "resource_budget"
    MUTEX_GROUPS = "mutex_groups"
    DEPENDENCY_CHAIN = "dependency_chain"
    CONDITIONAL = "conditional"
    THRESHOLD = "threshold"

class Classification(Enum):
    POSSIBLE = "possible"
    IMPOSSIBLE = "impossible" 
    INEVITABLE = "inevitable"

@dataclass
class Variable:
    """State variable in constraint universe"""
    name: str
    domain: Union[str, List[Any]]  # "boolean", "integer", or list of values
    type: str = "boolean"
    description: str = ""

@dataclass
class State:
    """Assignment of values to variables"""
    assignments: Dict[str, Any]
    
    def __hash__(self):
        return hash(tuple(sorted(self.assignments.items())))

@dataclass
class ReasoningStep:
    """Single step in logical reasoning"""
    rule: str                    # Type of inference rule applied
    premises: List[str]          # Constraint/fact IDs used as premises
    conclusion: str              # What was derived
    justification: str           # Human-readable explanation
    z3_proof_step: Optional[Any] = None  # Z3-specific proof data

@dataclass
class LogicalProof:
    """Complete formal proof of classification"""
    classification: Classification
    reasoning_steps: List[ReasoningStep]
    constraint_dependencies: List[str]  # Which constraints were essential
    counterexample: Optional[State] = None      # For IMPOSSIBLE
    witness: Optional[State] = None             # For POSSIBLE
    z3_model: Optional[Any] = None              # Z3 model data
    
    def to_human_readable(self) -> str:
        """Generate human-readable proof explanation"""
        proof_text = f"Classification: {self.classification.value.upper()}\n\n"
        
        proof_text += "Reasoning:\n"
        for i, step in enumerate(self.reasoning_steps, 1):
            proof_text += f"{i}. {step.justification}\n"
            if step.premises:
                proof_text += f"   Based on: {', '.join(step.premises)}\n"
        
        if self.counterexample:
            proof_text += f"\nCounterexample: {self.counterexample.assignments}\n"
        elif self.witness:
            proof_text += f"\nWitness: {self.witness.assignments}\n"
            
        return proof_text

@dataclass
class ClassificationResult:
    """Result of classifying a state"""
    state: State
    classification: Classification
    proof: LogicalProof
    constraints_used: List['Constraint']
    computation_time: float = 0.0

class Constraint(ABC):
    """Abstract base class for all constraints"""
    
    def __init__(self, constraint_id: str, description: str = ""):
        self.id = constraint_id
        self.description = description
        
    @abstractmethod
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        """Convert constraint to Z3 boolean expression"""
        pass
    
    @abstractmethod
    def violating_assignments(self, state: State) -> bool:
        """Check if state violates this constraint"""
        pass
    
    @abstractmethod
    def to_human_readable(self) -> str:
        """Human-readable description"""
        pass

@dataclass
class ConstraintUniverse:
    """Complete constraint universe with variables and constraints"""
    name: str
    variables: List[Variable]
    constraints: List[Constraint]
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_variable_dict(self) -> Dict[str, Variable]:
        """Get variables as dictionary"""
        return {var.name: var for var in self.variables}
    
    def get_constraint_dict(self) -> Dict[str, Constraint]:
        """Get constraints as dictionary"""
        return {c.id: c for c in self.constraints}

@dataclass
class GovernanceAssessment:
    """Assessment of governance viability"""
    system_name: str
    governable: bool
    violations: List[str]
    enabling_conditions: List[str] 
    boundary_analysis: Dict[str, Any]
    recommendation: str
