import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition

# Case with design data that violates mass constraint
case = CaseInput(
    problem=ProblemDefinition(name="Heavy gripper", domain="surgical_robotics"),
    constraints=["max_force: 2N", "must_not_slip"],
    uncertainties=["tissue_compliance: unknown_range"],
    objectives=["safe_manipulation"]
)

# Design data with violation: mass exceeds 10kg limit
design_data = {
    "total_mass_kg": 12.5,      # VIOLATES 10kg limit
    "max_force_n": 1.5,         # OK
    "max_acceleration_mps2": 30.0,  # OK
    "min_clearance_mm": 2.0,    # OK
    "self_collision_detected": False  # OK
}

analyzer = DecisionAnalyzer()
result = analyzer.analyze(case, design_data=design_data)

print("=== FORMAL CONSTRAINTS ===")
for fc in result.formal_constraints:
    print(f"{fc.constraint_name}: {fc.result} (value={fc.value}, threshold={fc.threshold}, margin={fc.margin})")
    print(f"  Evidence: {fc.evidence}")
    print()
