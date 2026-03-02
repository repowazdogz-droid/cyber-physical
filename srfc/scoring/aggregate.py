"""
Aggregate dimension results into overall feasibility score.
"""

from ..models import (
    CompileResult,
    DimensionResult,
    Status,
    ProcedureContext,
    RobotConcept,
    AnatomySpec,
)
from ..scoring.interactions import analyse_interactions
from ..crosswalk import derive_translation_implications


def _compute_uncertainty(result: DimensionResult) -> dict[str, float]:
    """
    Simple status-based uncertainty model.
    GREEN → narrow band
    AMBER → medium band
    RED → wider band
    """
    base = result.score
    if result.status == Status.GREEN:
        delta = 0.05
    elif result.status == Status.AMBER:
        delta = 0.10
    else:
        delta = 0.15
    low = max(0.0, base - delta)
    high = min(1.0, base + delta)
    return {"low": low, "high": high}


def aggregate_dimensions(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
    dimensions: dict[str, DimensionResult],
) -> CompileResult:
    """
    Aggregate dimension results into overall feasibility.

    Rules:
    - Overall_status: RED if any RED, else AMBER if any AMBER, else GREEN
    - Overall_score: Weighted average of dimension scores (equal weights for v1)
    - Notes: Summary of blocking issues or all-clear
    """
    # Compute uncertainty bands for each dimension
    for dim_result in dimensions.values():
        dim_result.uncertainty = _compute_uncertainty(dim_result)

    # Determine overall status
    overall_status = Status.GREEN
    for dim_result in dimensions.values():
        if dim_result.status == Status.RED:
            overall_status = Status.RED
            break
        elif dim_result.status == Status.AMBER:
            overall_status = Status.AMBER

    # Calculate weighted average score (equal weights for v1)
    if len(dimensions) == 0:
        overall_score = 0.0
    else:
        total_score = sum(dim.score for dim in dimensions.values())
        overall_score = total_score / len(dimensions)

    # Generate notes
    notes = []
    red_dims = [name for name, dim in dimensions.items() if dim.status == Status.RED]
    amber_dims = [name for name, dim in dimensions.items() if dim.status == Status.AMBER]

    if red_dims:
        notes.append(
            f"Blocking feasibility issues present in: {', '.join(red_dims)}"
        )
    if amber_dims and not red_dims:
        notes.append(
            f"Non-blocking issues in: {', '.join(amber_dims)}"
        )
    if overall_status == Status.GREEN:
        notes.append("No blocking feasibility issues under current presets")

    # Create initial result
    result = CompileResult(
        procedure=procedure,
        robot=robot,
        anatomy=anatomy,
        dimensions=dimensions,
        overall_status=overall_status,
        overall_score=overall_score,
        notes=notes,
    )

    # Analyse interactions
    result.interactions = analyse_interactions(result)

    # Derive translation implications
    result.translation_implications = derive_translation_implications(result)

    return result

