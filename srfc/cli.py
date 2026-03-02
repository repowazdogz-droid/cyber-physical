"""
Command-line interface for SRFC.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Any

from .models import (
    ProcedureContext,
    RobotConcept,
    RobotGeometrySpec,
    RobotMaterialSpec,
    RobotActuationSpec,
    SafetyEnvelopeSpec,
    ControlSpec,
    TetherSpec,
    ManufacturingSpec,
)
from .presets import load_anatomy, load_safety_defaults, load_all_presets
from .rules import (
    evaluate_geometry,
    evaluate_mechanics,
    evaluate_materials,
    evaluate_actuation,
    evaluate_safety,
    evaluate_control,
    evaluate_tether,
    evaluate_manufacturing,
)
from .scoring import aggregate_dimensions
from .reporters import print_summary, print_failure_modes, export_sim_scenarios
from .history import append_history


def load_json_spec(filepath: Path) -> Dict[str, Any]:
    """Load JSON specification file."""
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filepath}: {e}", file=sys.stderr)
        sys.exit(1)


def parse_robot_concept(data: Dict[str, Any]) -> RobotConcept:
    """Parse robot concept from JSON data."""
    geom_data = data["robot"]["geometry"]
    geometry = RobotGeometrySpec(
        outer_diameter_mm=float(geom_data["outer_diameter_mm"]),
        length_mm=float(geom_data["length_mm"]),
        min_bend_radius_mm=float(geom_data["min_bend_radius_mm"]),
        wall_thickness_mm=float(geom_data["wall_thickness_mm"]),
    )

    mat_data = data["robot"]["materials"]
    materials = RobotMaterialSpec(
        name=mat_data["name"],
        youngs_modulus_kpa=float(mat_data["youngs_modulus_kpa"]),
        shore_hardness=float(mat_data["shore_hardness"]),
        friction_coeff=float(mat_data["friction_coeff"]),
        max_strain=float(mat_data["max_strain"]),
        notes=mat_data.get("notes", ""),
    )

    act_data = data["robot"]["actuation"]
    actuation = RobotActuationSpec(
        mode=act_data["mode"],
        max_pressure_kpa=act_data.get("max_pressure_kpa"),
        max_tendon_force_n=act_data.get("max_tendon_force_n"),
        response_time_ms=act_data.get("response_time_ms"),
    )

    safety_data = data["robot"].get("safety")
    if safety_data:
        safety = SafetyEnvelopeSpec(
            max_tip_force_n=float(safety_data["max_tip_force_n"]),
            max_contact_pressure_kpa=float(safety_data["max_contact_pressure_kpa"]),
            max_dwell_time_min=float(safety_data["max_dwell_time_min"]),
        )
    else:
        # Use defaults from anatomy
        anatomy_name = data["procedure"]["anatomy"]
        safety = load_safety_defaults(anatomy_name)

    control_data = data["robot"]["control"]
    control = ControlSpec(
        control_mode=control_data["control_mode"],
        closed_loop=bool(control_data.get("closed_loop", False)),
        sensing_modalities=control_data.get("sensing_modalities", []),
    )

    tether_data = data["robot"]["tether"]
    tether = TetherSpec(
        has_tether=bool(tether_data.get("has_tether", True)),
        num_lines=int(tether_data.get("num_lines", 0)),
        total_bundle_diameter_mm=float(tether_data.get("total_bundle_diameter_mm", 0.0)),
    )

    manufacturing = None
    if "manufacturing" in data.get("robot", {}):
        mf_data = data["robot"]["manufacturing"]
        manufacturing = ManufacturingSpec(
            unit_cost_estimate=float(mf_data["unit_cost_estimate"]),
            expected_volume_per_year=int(mf_data["expected_volume_per_year"]),
            reusable=bool(mf_data.get("reusable", False)),
            sterilization_method=mf_data["sterilization_method"],
            tolerance_mm=float(mf_data["tolerance_mm"]),
            special_tooling_required=bool(mf_data.get("special_tooling_required", False)),
        )

    return RobotConcept(
        geometry=geometry,
        materials=materials,
        actuation=actuation,
        safety=safety,
        control=control,
        tether=tether,
        manufacturing=manufacturing,
    )


def parse_procedure_context(data: Dict[str, Any]) -> ProcedureContext:
    """Parse procedure context from JSON data."""
    proc_data = data["procedure"]
    return ProcedureContext(
        procedure_id=proc_data["procedure_id"],
        domain=proc_data["domain"],
        anatomy=proc_data["anatomy"],
        description=proc_data.get("description", ""),
        notes=proc_data.get("notes", ""),
    )


def compile_feasibility(json_file: Path):
    """Compile feasibility for a JSON specification."""
    from datetime import datetime, timezone
    
    data = load_json_spec(json_file)
    
    procedure = parse_procedure_context(data)
    robot = parse_robot_concept(data)
    
    # Load anatomy
    anatomy = load_anatomy(procedure.anatomy)
    
    # Load presets
    presets = load_all_presets()
    
    # Evaluate all dimensions
    dimensions = {
        "geometry": evaluate_geometry(procedure, robot, anatomy),
        "mechanics": evaluate_mechanics(procedure, robot, anatomy),
        "materials": evaluate_materials(procedure, robot, anatomy),
        "actuation": evaluate_actuation(procedure, robot, anatomy),
        "safety": evaluate_safety(procedure, robot, anatomy),
        "control": evaluate_control(procedure, robot, anatomy),
        "tether": evaluate_tether(procedure, robot, anatomy),
        "manufacturing": evaluate_manufacturing(procedure, robot, anatomy, presets),
    }
    
    # Aggregate
    result = aggregate_dimensions(procedure, robot, anatomy, dimensions)
    
    # Set version and timestamp
    result.version = "v2"
    result.timestamp = datetime.now(timezone.utc).isoformat()
    
    return result


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SRFC: Surgical Robotics Feasibility Compiler"
    )
    parser.add_argument(
        "spec_file",
        type=Path,
        help="JSON specification file",
    )
    parser.add_argument(
        "--view",
        choices=["summary", "failure-modes", "sim", "all"],
        default="summary",
        help="Output view (default: summary)",
    )
    
    args = parser.parse_args()
    
    # Compile
    try:
        result = compile_feasibility(args.spec_file)
        # Append to history
        append_history(result)
    except Exception as e:
        print(f"Error during compilation: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Dispatch to reporters
    if args.view == "summary" or args.view == "all":
        print_summary(result)
        if args.view == "summary":
            return
    
    if args.view == "failure-modes" or args.view == "all":
        if args.view != "all":
            print()  # Add spacing if not "all"
        print_failure_modes(result)
        if args.view == "failure-modes":
            return
    
    if args.view == "sim" or args.view == "all":
        if args.view != "all":
            print()  # Add spacing if not "all"
        scenarios = export_sim_scenarios(result)
        print("=" * 70)
        print("SIMULATION SCENARIOS")
        print("=" * 70)
        print()
        print(json.dumps(scenarios, indent=2))
        print()
        print("=" * 70)


if __name__ == "__main__":
    main()

