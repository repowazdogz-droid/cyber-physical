"""Z3 integration tests"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import z3
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False

def test_z3_basic():
    """Test basic Z3 functionality"""
    if not Z3_AVAILABLE:
        print("Z3 not available, skipping test")
        return
    
    solver = z3.Solver()
    x = z3.Bool('x')
    y = z3.Bool('y') 
    solver.add(z3.Implies(x, y))
    solver.add(x)
    assert solver.check() == z3.sat
    model = solver.model()
    assert model[y] == True
    print("✓ Basic Z3 test passed")

def test_governance_constraints():
    """Test governance constraint creation"""
    from constraints.governance import create_governance_constraint_set
    
    constraints = create_governance_constraint_set()
    assert len(constraints) == 4
    assert all(hasattr(c, 'to_z3') for c in constraints)
    assert all(hasattr(c, 'violating_assignments') for c in constraints)
    print("✓ Governance constraints test passed")

def test_basic_constraints():
    """Test basic constraint types"""
    from constraints.basic import NotTogetherConstraint, RequiresConstraint
    from core.types import State
    
    # Test NOT_TOGETHER
    constraint = NotTogetherConstraint("test1", "A", "B")
    state1 = State({"A": True, "B": True})
    state2 = State({"A": True, "B": False})
    
    assert constraint.violating_assignments(state1) == True
    assert constraint.violating_assignments(state2) == False
    
    # Test REQUIRES
    constraint2 = RequiresConstraint("test2", "A", "B")
    state3 = State({"A": True, "B": False})
    state4 = State({"A": True, "B": True})
    
    assert constraint2.violating_assignments(state3) == True
    assert constraint2.violating_assignments(state4) == False
    
    print("✓ Basic constraints test passed")

if __name__ == "__main__":
    print("Running Z3 integration tests...\n")
    test_z3_basic()
    test_governance_constraints()
    test_basic_constraints()
    print("\nAll tests passed!")
