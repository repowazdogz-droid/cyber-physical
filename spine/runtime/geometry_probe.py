"""Geometry feature extractor for design analysis."""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import math


@dataclass
class PartTolerance:
    """Tolerance specification for a part."""
    nominal_dim_mm: float
    tolerance_mm: float
    count: int = 1


@dataclass
class AssemblyStage:
    """Assembly stage with positioning error."""
    positioning_error_mm: float
    stage_name: str = ""


def tolerance_stack_analysis(
    parts: List[PartTolerance],
    assembly_clearance_mm: float
) -> Dict[str, float]:
    """
    Analyze tolerance stack-up.
    
    Args:
        parts: List of parts with nominal dimensions and tolerances
        assembly_clearance_mm: Initial clearance in assembly
        
    Returns:
        Dict with total_stack_mm, worst_case_clearance_remaining_mm, rss_stack_mm
    """
    worst_case_stack = 0.0
    rss_sum_sq = 0.0
    nominal_total = 0.0
    
    for part in parts:
        part_dim = part.nominal_dim_mm * part.count
        part_tolerance = part.tolerance_mm * part.count
        
        nominal_total += part_dim
        worst_case_stack += part_dim + part_tolerance
        rss_sum_sq += (part_tolerance ** 2) * part.count
    
    rss_stack = math.sqrt(rss_sum_sq)
    worst_case_clearance = assembly_clearance_mm - (worst_case_stack - nominal_total)
    
    return {
        "total_stack_mm": worst_case_stack,
        "worst_case_clearance_remaining_mm": worst_case_clearance,
        "rss_stack_mm": rss_stack,
        "nominal_total_mm": nominal_total
    }


def thermal_dimensional_change(
    material_cte: float,
    length_mm: float,
    delta_temp_c: float
) -> float:
    """
    Compute thermal expansion.
    
    Args:
        material_cte: Coefficient of thermal expansion (1/°C)
        length_mm: Initial length in mm
        delta_temp_c: Temperature change in °C
        
    Returns:
        Expansion in mm
    """
    return material_cte * length_mm * delta_temp_c


def thermal_expansion_mismatch(
    part1_cte: float,
    part1_length_mm: float,
    part2_cte: float,
    part2_length_mm: float,
    delta_temp_c: float,
    initial_clearance_mm: float
) -> Dict[str, float]:
    """
    Compute thermal expansion mismatch between two parts.
    
    Returns:
        Dict with expansion1_mm, expansion2_mm, net_mismatch_mm, clearance_after_thermal_mm
    """
    expansion1 = thermal_dimensional_change(part1_cte, part1_length_mm, delta_temp_c)
    expansion2 = thermal_dimensional_change(part2_cte, part2_length_mm, delta_temp_c)
    
    net_mismatch = abs(expansion1 - expansion2)
    clearance_after = initial_clearance_mm - net_mismatch
    
    return {
        "expansion1_mm": expansion1,
        "expansion2_mm": expansion2,
        "net_mismatch_mm": net_mismatch,
        "clearance_after_thermal_mm": clearance_after
    }


def deflection_clearance_loss(
    force_n: float,
    length_mm: float,
    EI_nmm2: float,
    initial_clearance_mm: float
) -> Dict[str, float]:
    """
    Compute deflection and remaining clearance (cantilever beam approximation).
    
    Args:
        force_n: Applied force in Newtons
        length_mm: Beam length in mm
        EI_nmm2: Flexural rigidity in N·mm²
        initial_clearance_mm: Initial clearance
        
    Returns:
        Dict with deflection_mm, remaining_clearance_mm
    """
    # Cantilever deflection: δ = FL³/(3EI)
    # Convert length to meters for consistency, but keep result in mm
    length_m = length_mm / 1000.0
    EI_nm2 = EI_nmm2 / 1e6  # Convert N·mm² to N·m²
    
    if EI_nm2 <= 0:
        deflection_mm = 0.0
    else:
        deflection_m = (force_n * length_m ** 3) / (3 * EI_nm2)
        deflection_mm = deflection_m * 1000.0
    
    remaining_clearance = initial_clearance_mm - deflection_mm
    
    return {
        "deflection_mm": deflection_mm,
        "remaining_clearance_mm": remaining_clearance
    }


def assembly_error_propagation(
    stages: List[AssemblyStage],
    error_budget_mm: float
) -> Dict[str, Any]:
    """
    Compute cumulative assembly error.
    
    Args:
        stages: List of assembly stages with positioning errors
        error_budget_mm: Maximum allowed cumulative error
        
    Returns:
        Dict with total_assembly_error_mm, exceeds_budget (bool)
    """
    error_sum_sq = sum(stage.positioning_error_mm ** 2 for stage in stages)
    total_error = math.sqrt(error_sum_sq)
    
    return {
        "total_assembly_error_mm": total_error,
        "exceeds_budget": total_error > error_budget_mm,
        "error_budget_mm": error_budget_mm
    }


def trajectory_sweep_check(
    trajectory_clearances: List[float],
    min_clearance_threshold_mm: float = 1.0
) -> Dict[str, Any]:
    """
    Check clearance over entire trajectory.
    
    Args:
        trajectory_clearances: List of clearance values at each pose
        min_clearance_threshold_mm: Minimum acceptable clearance
        
    Returns:
        Dict with min_clearance_over_trajectory, worst_pose_index, collision_events
    """
    if not trajectory_clearances:
        return {
            "min_clearance_over_trajectory": 0.0,
            "worst_pose_index": -1,
            "collision_events": []
        }
    
    min_clearance = min(trajectory_clearances)
    worst_pose_index = trajectory_clearances.index(min_clearance)
    
    collision_events = [
        i for i, clearance in enumerate(trajectory_clearances)
        if clearance < min_clearance_threshold_mm
    ]
    
    return {
        "min_clearance_over_trajectory": min_clearance,
        "worst_pose_index": worst_pose_index,
        "collision_events": collision_events,
        "violates_threshold": min_clearance < min_clearance_threshold_mm
    }


def extract_geometry_features(design_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract canonical geometry features from design data.
    
    Args:
        design_data: Dictionary containing design parameters
        
    Returns:
        Dict with canonical geometry feature blob
    """
    features = {
        "clearance_map": {},
        "narrow_passage": {},
        "reachability": {},
        "tolerance_stackup": {},
        "thermal_expansion": {},
        "assembly_error": {},
        "backlash": {}
    }
    
    # Clearance map
    min_clearance = design_data.get("min_clearance_mm")
    if min_clearance is not None:
        features["clearance_map"] = {
            "min_clearance_mm": min_clearance,
            "critical_gaps": []
        }
        # Add critical gaps if provided
        if "critical_gaps" in design_data:
            features["clearance_map"]["critical_gaps"] = design_data["critical_gaps"]
    
    # Narrow passage
    min_passage_width = design_data.get("min_passage_width_mm")
    required_width = design_data.get("required_width_mm")
    if min_passage_width is not None and required_width is not None:
        margin = min_passage_width - required_width
        features["narrow_passage"] = {
            "min_width_mm": min_passage_width,
            "required_width_mm": required_width,
            "margin_mm": margin
        }
    
    # Reachability
    ik_feasible = design_data.get("ik_feasible")
    joint_margin = design_data.get("joint_margin_deg")
    collision_free = design_data.get("collision_free_approach")
    if ik_feasible is not None or joint_margin is not None:
        features["reachability"] = {
            "ik_feasible": ik_feasible if ik_feasible is not None else True,
            "joint_margin_deg": joint_margin if joint_margin is not None else 10.0,
            "collision_free_approach": collision_free if collision_free is not None else True
        }
    
    # Tolerance stackup
    parts_data = design_data.get("parts")
    assembly_clearance = design_data.get("assembly_clearance_mm")
    if parts_data and assembly_clearance is not None:
        if isinstance(parts_data, list) and len(parts_data) > 0:
            parts = []
            for part_data in parts_data:
                if isinstance(part_data, dict):
                    parts.append(PartTolerance(
                        nominal_dim_mm=part_data.get("nominal_dim_mm", 0.0),
                        tolerance_mm=part_data.get("tolerance_mm", 0.0),
                        count=part_data.get("count", 1)
                    ))
            if parts:
                analysis = tolerance_stack_analysis(parts, assembly_clearance)
                features["tolerance_stackup"] = {
                    "total_stack_mm": analysis["total_stack_mm"],
                    "rss_stack_mm": analysis["rss_stack_mm"],
                    "worst_case_clearance_mm": analysis["worst_case_clearance_remaining_mm"]
                }
    
    # Thermal expansion
    part1_cte = design_data.get("part1_cte")
    part2_cte = design_data.get("part2_cte")
    if part1_cte is not None and part2_cte is not None:
        part1_length = design_data.get("part1_length_mm", 0.0)
        part2_length = design_data.get("part2_length_mm", 0.0)
        delta_temp = design_data.get("delta_temp_c", 0.0)
        initial_clearance = design_data.get("initial_clearance_mm", 0.0)
        analysis = thermal_expansion_mismatch(
            part1_cte, part1_length,
            part2_cte, part2_length,
            delta_temp, initial_clearance
        )
        features["thermal_expansion"] = {
            "total_expansion_mm": max(analysis["expansion1_mm"], analysis["expansion2_mm"]),
            "net_mismatch_mm": analysis["net_mismatch_mm"],
            "clearance_after_thermal_mm": analysis["clearance_after_thermal_mm"]
        }
    elif design_data.get("material_cte") is not None:
        expansion = thermal_dimensional_change(
            design_data.get("material_cte"),
            design_data.get("part_length_mm", 0.0),
            design_data.get("delta_temp_c", 0.0)
        )
        features["thermal_expansion"] = {
            "total_expansion_mm": expansion,
            "net_mismatch_mm": expansion,
            "clearance_after_thermal_mm": design_data.get("initial_clearance_mm", 0.0) - expansion
        }
    
    # Assembly error
    stages_data = design_data.get("assembly_stages")
    error_budget = design_data.get("error_budget_mm")
    if stages_data and error_budget is not None and isinstance(stages_data, list):
        stages = []
        for stage_data in stages_data:
            if isinstance(stage_data, dict):
                stages.append(AssemblyStage(
                    positioning_error_mm=stage_data.get("positioning_error_mm", 0.0),
                    stage_name=stage_data.get("stage_name", "")
                ))
        if stages:
            analysis = assembly_error_propagation(stages, error_budget)
            features["assembly_error"] = {
                "total_error_mm": analysis["total_assembly_error_mm"],
                "error_budget_mm": error_budget,
                "exceeds_budget": analysis["exceeds_budget"]
            }
    
    # Backlash
    backlash_per_cycle = design_data.get("backlash_per_cycle_mm")
    n_cycles = design_data.get("n_cycles")
    positioning_tolerance = design_data.get("positioning_tolerance_mm")
    if backlash_per_cycle is not None and n_cycles is not None and positioning_tolerance is not None:
        total_backlash = backlash_per_cycle * n_cycles
        tolerance_consumed_pct = (total_backlash / positioning_tolerance * 100) if positioning_tolerance > 0 else 0
        features["backlash"] = {
            "total_backlash_mm": total_backlash,
            "tolerance_consumed_pct": tolerance_consumed_pct
        }
    
    return features
