#!/usr/bin/env python3
"""Example: Governance viability assessment using formal verification"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from core.types import ConstraintUniverse, Variable, State
from constraints.governance import create_governance_constraint_set
from solver.z3_backend import Z3ConstraintSolver

def main():
    print("=== Constraint Universe: Governance Assessment ===\n")
    
    # Create governance variables
    variables = [
        Variable("information_asymmetry", "boolean", "boolean", "Operators cannot see downstream behavior"),
        Variable("downstream_autonomy", "boolean", "boolean", "Downstream systems act autonomously"),
        Variable("real_world_impact", "boolean", "boolean", "System affects real world"),
        Variable("halt_authority", "boolean", "boolean", "Operators can halt system"),
        Variable("irreversible_action", "boolean", "boolean", "Actions cannot be undone"),
        Variable("post_hoc_mitigation_only", "boolean", "boolean", "Only post-deployment controls"),
        Variable("autonomous_agent", "boolean", "boolean", "System acts autonomously"),
        Variable("real_time_halt", "boolean", "boolean", "System can be halted in real-time")
    ]
    
    # Create governance constraints
    constraints = create_governance_constraint_set()
    
    # Create constraint universe
    universe = ConstraintUniverse(
        name="governance_assessment",
        variables=variables,
        constraints=constraints,
        metadata={"purpose": "Assess system governability"}
    )
    
    print(f"Universe: {universe.name}")
    print(f"Variables: {len(variables)}")
    print(f"Constraints: {len(constraints)}\n")
    
    # Test scenarios
    scenarios = [
        {
            "name": "Ungovernable: Information asymmetry + autonomy",
            "state": State({
                "information_asymmetry": True,
                "downstream_autonomy": True,
                "real_world_impact": False,
                "halt_authority": False,
                "irreversible_action": False,
                "post_hoc_mitigation_only": False,
                "autonomous_agent": False,
                "real_time_halt": False
            })
        },
        {
            "name": "Governable: Real-world impact with halt authority",
            "state": State({
                "information_asymmetry": False,
                "downstream_autonomy": False,
                "real_world_impact": True,
                "halt_authority": True,
                "irreversible_action": False,
                "post_hoc_mitigation_only": False,
                "autonomous_agent": False,
                "real_time_halt": False
            })
        },
        {
            "name": "Ungovernable: Irreversible actions with only post-hoc controls",
            "state": State({
                "information_asymmetry": False,
                "downstream_autonomy": False,
                "real_world_impact": False,
                "halt_authority": False,
                "irreversible_action": True,
                "post_hoc_mitigation_only": True,
                "autonomous_agent": False,
                "real_time_halt": False
            })
        }
    ]
    
    try:
        solver = Z3ConstraintSolver()
        
        for scenario in scenarios:
            print(f"Scenario: {scenario['name']}")
            print(f"State: {scenario['state'].assignments}")
            
            result = solver.classify_state(universe, scenario['state'])
            
            print(f"Classification: {result.classification.value.upper()}")
            print(f"Computation time: {result.computation_time:.4f}s")
            print(f"Proof:\n{result.proof.to_human_readable()}")
            print()
            
    except ImportError as e:
        print(f"Z3 not available: {e}")
        print("Install with: pip install z3-solver")
        print("\nRunning without Z3 (basic constraint checking only)...")
        
        # Fallback to basic constraint checking
        for scenario in scenarios:
            print(f"\nScenario: {scenario['name']}")
            violations = []
            for constraint in constraints:
                if constraint.violating_assignments(scenario['state']):
                    violations.append(constraint.id)
            
            if violations:
                print(f"Violations: {violations}")
                print("Classification: IMPOSSIBLE")
            else:
                print("No violations")
                print("Classification: POSSIBLE")

if __name__ == "__main__":
    main()
