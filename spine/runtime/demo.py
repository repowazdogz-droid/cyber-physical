#!/usr/bin/env python3
"""SPINE v8 One-Command Demo - 3 curated cases in <5 seconds."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition

analyzer = DecisionAnalyzer()

print("=" * 70)
print("SPINE v8 DEMO - Pre-Decision Analysis Runtime")
print("=" * 70)
print()

# Case 1: Passing design (from failure injection - one that should pass)
print("CASE 1: Passing Design (Baseline)")
print("-" * 70)
case1 = CaseInput(
    problem=ProblemDefinition(
        name="Well-designed gripper within all limits",
        domain="robotic_design"
    ),
    constraints=["total_mass_limit: 10kg", "max_force: 2N", "must_not_slip"],
    uncertainties=["tissue_compliance: unknown_range"],
    objectives=["safe_manipulation"]
)

design1 = {
    "total_mass_kg": 8.5,
    "max_force_n": 1.5,
    "normal_force_n": 10.0,
    "friction_coefficient": 0.6,
    "tangential_force_n": 3.0
}

result1 = analyzer.analyze(case1, design_data=design1)
violations1 = [fc for fc in result1.formal_constraints if fc.result == "proven_violated"]
evaluated1 = sum(1 for fc in result1.formal_constraints if fc.result != "unknown")
coverage1 = (evaluated1 / len(result1.formal_constraints) * 100) if result1.formal_constraints else 0

print(f"Constraints evaluated: {evaluated1}/47 ({coverage1:.1f}%)")
print(f"Violations found: {len(violations1)}")
if violations1:
    for v in violations1[:3]:
        print(f"  - {v.constraint_name}: margin={v.margin:.3f}")
else:
    print("  ✓ All constraints satisfied")
print(f"Top risks by RPN: {len(result1.failure_modes)} failure modes")
if result1.failure_modes:
    for fm in result1.failure_modes[:3]:
        print(f"  - {fm.mode} (RPN={fm.risk_priority_number})")
print(f"Missing fields: {len(result1.required_fields_missing or [])}")
if result1.falsification_tests:
    cheapest = min(result1.falsification_tests, key=lambda t: {"low": 0, "medium": 1, "high": 2}.get(t.estimated_cost, 3))
    print(f"Cheapest falsification test: {cheapest.test_description[:60]}...")
print()

# Case 2: Obvious failure (mass violation)
print("CASE 2: Obvious Failure (Mass Violation)")
print("-" * 70)
case2 = CaseInput(
    problem=ProblemDefinition(
        name="Payload exceeds rated capacity",
        domain="robotic_design"
    ),
    constraints=["payload_mass: 15kg", "arm_rated_capacity: 10kg", "must_not_exceed_mass_limit"],
    uncertainties=["dynamic_load_multiplier: 1.2-1.5"],
    objectives=["adequate_payload_capacity"]
)

design2 = {
    "total_mass_kg": 15.0,
    "max_force_n": 2.5
}

result2 = analyzer.analyze(case2, design_data=design2)
violations2 = [fc for fc in result2.formal_constraints if fc.result == "proven_violated"]
evaluated2 = sum(1 for fc in result2.formal_constraints if fc.result != "unknown")
coverage2 = (evaluated2 / len(result2.formal_constraints) * 100) if result2.formal_constraints else 0

print(f"Constraints evaluated: {evaluated2}/47 ({coverage2:.1f}%)")
print(f"Violations found: {len(violations2)}")
for v in violations2[:3]:
    print(f"  - {v.constraint_name}: value={v.value:.2f}, threshold={v.threshold:.2f}, margin={v.margin:.2f}")
print(f"Top risks by RPN: {len(result2.failure_modes)} failure modes")
if result2.failure_modes:
    for fm in result2.failure_modes[:3]:
        print(f"  - {fm.mode} (RPN={fm.risk_priority_number}, severity={fm.severity})")
print(f"Missing fields: {len(result2.required_fields_missing or [])}")
if result2.falsification_tests:
    cheapest = min(result2.falsification_tests, key=lambda t: {"low": 0, "medium": 1, "high": 2}.get(t.estimated_cost, 3))
    print(f"Cheapest falsification test: {cheapest.test_description[:60]}...")
print()

# Case 3: Subtle adversarial case (borderline/emergent)
print("CASE 3: Subtle Failure (Borderline/Emergent)")
print("-" * 70)
case3 = CaseInput(
    problem=ProblemDefinition(
        name="Three minor issues combine - borderline mass + marginal friction + slight misalignment",
        domain="robotic_design"
    ),
    constraints=["mass: 9.95kg (limit: 10kg)", "friction_coefficient: 0.35 (required: 0.4)", "misalignment: 0.8mm (limit: 1.0mm)"],
    uncertainties=["interaction_effects: unknown", "cascading_failure_probability: variable"],
    objectives=["combined_safety"]
)

design3 = {
    "total_mass_kg": 9.95,
    "normal_force_n": 8.0,
    "friction_coefficient": 0.35,
    "tangential_force_n": 2.0
}

result3 = analyzer.analyze(case3, design_data=design3)
violations3 = [fc for fc in result3.formal_constraints if fc.result == "proven_violated"]
evaluated3 = sum(1 for fc in result3.formal_constraints if fc.result != "unknown")
coverage3 = (evaluated3 / len(result3.formal_constraints) * 100) if result3.formal_constraints else 0

print(f"Constraints evaluated: {evaluated3}/47 ({coverage3:.1f}%)")
print(f"Violations found: {len(violations3)}")
for v in violations3[:3]:
    print(f"  - {v.constraint_name}: margin={v.margin:.3f}")
print(f"Top risks by RPN: {len(result3.failure_modes)} failure modes")
if result3.failure_modes:
    for fm in result3.failure_modes[:3]:
        print(f"  - {fm.mode} (RPN={fm.risk_priority_number}, category={fm.category.value})")
print(f"Missing fields: {len(result3.required_fields_missing or [])}")
if result3.falsification_tests:
    cheapest = min(result3.falsification_tests, key=lambda t: {"low": 0, "medium": 1, "high": 2}.get(t.estimated_cost, 3))
    print(f"Cheapest falsification test: {cheapest.test_description[:60]}...")
print()

# Summary
total_violations = len(violations1) + len(violations2) + len(violations3)
total_tests = len(result1.falsification_tests) + len(result2.falsification_tests) + len(result3.falsification_tests)

print("=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"3 cases analyzed")
print(f"{total_violations} violations detected")
print(f"{total_tests} falsification tests generated")
print(f"Average coverage: {(coverage1 + coverage2 + coverage3) / 3:.1f}%")
print()
