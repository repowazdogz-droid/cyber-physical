"""Governance-specific constraints for system viability assessment"""
from typing import Dict
from core.types import Constraint, State

try:
    import z3
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False
    z3 = None

class InformationAsymmetryConstraint(Constraint):
    """Systems with information asymmetry cannot have downstream autonomy"""
    
    def __init__(self):
        super().__init__(
            constraint_id="info_asymmetry",
            description="Operators must have visibility into downstream behavior"
        )
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        info_asymmetry = variables.get("information_asymmetry", z3.BoolVal(False))
        downstream_autonomy = variables.get("downstream_autonomy", z3.BoolVal(False))
        
        return z3.Not(z3.And(info_asymmetry, downstream_autonomy))
    
    def violating_assignments(self, state: State) -> bool:
        return (state.assignments.get("information_asymmetry", False) and 
                state.assignments.get("downstream_autonomy", False))
    
    def to_human_readable(self) -> str:
        return ("Systems cannot have both information asymmetry and downstream autonomy. " +
                "If operators cannot see what downstream systems do, those systems cannot act autonomously.")

class PowerConsequenceMismatchConstraint(Constraint):
    """Power to control must match scope of consequences"""
    
    def __init__(self):
        super().__init__(
            constraint_id="power_consequence_mismatch", 
            description="Authority must match scope of impact"
        )
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        real_world_impact = variables.get("real_world_impact", z3.BoolVal(False))
        halt_authority = variables.get("halt_authority", z3.BoolVal(False))
        
        return z3.Implies(real_world_impact, halt_authority)
    
    def violating_assignments(self, state: State) -> bool:
        return (state.assignments.get("real_world_impact", False) and
                not state.assignments.get("halt_authority", False))
    
    def to_human_readable(self) -> str:
        return ("Systems with real-world impact require halt authority. " +
                "If a system can affect the real world, someone must be able to stop it.")

class RollbackFictionConstraint(Constraint):
    """Post-deployment mitigation is insufficient for irreversible actions"""
    
    def __init__(self):
        super().__init__(
            constraint_id="rollback_fiction",
            description="Irreversible actions require pre-deployment controls"
        )
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        irreversible = variables.get("irreversible_action", z3.BoolVal(False))
        post_hoc_only = variables.get("post_hoc_mitigation_only", z3.BoolVal(False))
        
        return z3.Not(z3.And(irreversible, post_hoc_only))
    
    def violating_assignments(self, state: State) -> bool:
        return (state.assignments.get("irreversible_action", False) and
                state.assignments.get("post_hoc_mitigation_only", False))
    
    def to_human_readable(self) -> str:
        return ("Irreversible actions cannot rely solely on post-hoc mitigation. " +
                "If an action cannot be undone, prevention is required, not just response.")

class DelegatedAgencyConstraint(Constraint):
    """Delegated agency requires real-time halt capability"""
    
    def __init__(self):
        super().__init__(
            constraint_id="delegated_agency",
            description="Autonomous agents require interruptible operation"
        )
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        autonomous = variables.get("autonomous_agent", z3.BoolVal(False))
        real_time_halt = variables.get("real_time_halt", z3.BoolVal(False))
        
        return z3.Implies(autonomous, real_time_halt)
    
    def violating_assignments(self, state: State) -> bool:
        return (state.assignments.get("autonomous_agent", False) and
                not state.assignments.get("real_time_halt", False))
    
    def to_human_readable(self) -> str:
        return ("Autonomous agents require real-time halt capability. " +
                "If a system can act independently, it must be immediately interruptible.")

def create_governance_constraint_set() -> List[Constraint]:
    """Create standard set of governance constraints"""
    return [
        InformationAsymmetryConstraint(),
        PowerConsequenceMismatchConstraint(),
        RollbackFictionConstraint(),
        DelegatedAgencyConstraint()
    ]
