"""Classification logic for POSSIBLE/IMPOSSIBLE/INEVITABLE"""
from core.types import Classification, State

def classify_without_z3(state: State, constraints: List) -> Classification:
    """Basic classification without Z3 (fallback)"""
    # Check if state violates any constraints
    violations = []
    for constraint in constraints:
        if constraint.violating_assignments(state):
            violations.append(constraint.id)
    
    if violations:
        return Classification.IMPOSSIBLE
    else:
        # Without Z3, we can't determine inevitability
        return Classification.POSSIBLE
