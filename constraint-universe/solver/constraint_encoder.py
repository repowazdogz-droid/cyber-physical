"""Constraint encoding utilities for Z3"""
from typing import Dict, List
from core.types import Constraint

try:
    import z3
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False
    z3 = None

def encode_constraints_for_z3(constraints: List[Constraint], 
                             variables: Dict[str, z3.ExprRef]) -> List[z3.BoolRef]:
    """Encode list of constraints to Z3 expressions"""
    if not Z3_AVAILABLE:
        raise ImportError("Z3 not available")
    
    z3_constraints = []
    for constraint in constraints:
        try:
            z3_expr = constraint.to_z3(variables)
            z3_constraints.append(z3_expr)
        except Exception as e:
            # Skip constraints that can't be encoded
            continue
    
    return z3_constraints
