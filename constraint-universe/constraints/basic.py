"""Basic constraint types (NOT_TOGETHER, REQUIRES, etc.)"""
from typing import Dict, List, Set, Any
from core.types import Constraint, State

try:
    import z3
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False
    z3 = None

class NotTogetherConstraint(Constraint):
    """A and B cannot both exist"""
    
    def __init__(self, constraint_id: str, var_a: str, var_b: str):
        super().__init__(constraint_id, f"{var_a} and {var_b} cannot both be true")
        self.var_a = var_a
        self.var_b = var_b
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        var_a_expr = variables.get(self.var_a, z3.BoolVal(False))
        var_b_expr = variables.get(self.var_b, z3.BoolVal(False))
        return z3.Not(z3.And(var_a_expr, var_b_expr))
    
    def violating_assignments(self, state: State) -> bool:
        return (state.assignments.get(self.var_a, False) and 
                state.assignments.get(self.var_b, False))
    
    def to_human_readable(self) -> str:
        return f"{self.var_a} and {self.var_b} cannot both be true"

class RequiresConstraint(Constraint):
    """If A exists, B must exist"""
    
    def __init__(self, constraint_id: str, var_a: str, var_b: str):
        super().__init__(constraint_id, f"If {var_a} then {var_b}")
        self.var_a = var_a
        self.var_b = var_b
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        var_a_expr = variables.get(self.var_a, z3.BoolVal(False))
        var_b_expr = variables.get(self.var_b, z3.BoolVal(False))
        return z3.Implies(var_a_expr, var_b_expr)
    
    def violating_assignments(self, state: State) -> bool:
        return (state.assignments.get(self.var_a, False) and 
                not state.assignments.get(self.var_b, False))
    
    def to_human_readable(self) -> str:
        return f"If {self.var_a} is true, then {self.var_b} must be true"

class AtMostKOfSetConstraint(Constraint):
    """At most k members of set S may exist"""
    
    def __init__(self, constraint_id: str, variables: List[str], k: int):
        super().__init__(constraint_id, f"At most {k} of {variables} can be true")
        self.variables = variables
        self.k = k
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        var_exprs = [variables.get(var, z3.BoolVal(False)) for var in self.variables]
        if not var_exprs:
            return z3.BoolVal(True)
        
        # Count true variables
        count = sum(z3.If(expr, 1, 0) for expr in var_exprs)
        return count <= self.k
    
    def violating_assignments(self, state: State) -> bool:
        true_count = sum(1 for var in self.variables if state.assignments.get(var, False))
        return true_count > self.k
    
    def to_human_readable(self) -> str:
        return f"At most {self.k} of {self.variables} can be true"

class ExactlyKOfSetConstraint(Constraint):
    """Exactly k members of set S must exist"""
    
    def __init__(self, constraint_id: str, variables: List[str], k: int):
        super().__init__(constraint_id, f"Exactly {k} of {variables} must be true")
        self.variables = variables
        self.k = k
    
    def to_z3(self, variables: Dict[str, Any]) -> Any:
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available")
        var_exprs = [variables.get(var, z3.BoolVal(False)) for var in self.variables]
        if not var_exprs:
            return z3.BoolVal(self.k == 0)
        
        # Count true variables
        count = sum(z3.If(expr, 1, 0) for expr in var_exprs)
        return count == self.k
    
    def violating_assignments(self, state: State) -> bool:
        true_count = sum(1 for var in self.variables if state.assignments.get(var, False))
        return true_count != self.k
    
    def to_human_readable(self) -> str:
        return f"Exactly {self.k} of {self.variables} must be true"
