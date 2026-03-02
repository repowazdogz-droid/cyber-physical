"""
Failure modes reporter.

Lists non-GREEN dimensions with issues and knobs.
"""

from ..models import CompileResult, Status


def print_failure_modes(result: CompileResult) -> None:
    """
    Print sorted list of non-GREEN dimensions with:
    - Dimension name
    - Issues
    - Knobs (parameter → current, target, delta)
    """
    print("=" * 70)
    print("FAILURE MODES & ADJUSTMENT KNOBS")
    print("=" * 70)
    print()

    # Filter non-GREEN dimensions
    problem_dims = [
        (name, dim) for name, dim in result.dimensions.items()
        if dim.status != Status.GREEN
    ]

    if not problem_dims:
        print("No failure modes identified (all dimensions GREEN).")
        print()
        print("=" * 70)
        return

    # Sort by status severity (RED first), then by score (lowest first)
    problem_dims.sort(key=lambda x: (
        {"RED": 0, "AMBER": 1, "GREEN": 2}[x[1].status.value],
        x[1].score
    ))

    for dim_name, dim_result in problem_dims:
        print(f"{dim_name.upper()} [{dim_result.status.value}]")
        print(f"  Score: {dim_result.score:.3f}")
        print()

        if dim_result.issues:
            print("  Issues:")
            for issue in dim_result.issues:
                print(f"    • {issue}")
            print()

        if dim_result.knobs:
            print("  Adjustment Knobs:")
            for param_name, knob_data in dim_result.knobs.items():
                if isinstance(knob_data, dict):
                    current = knob_data.get("current", "?")
                    target = knob_data.get("target_max") or knob_data.get("target_min") or knob_data.get("target", "?")
                    delta = knob_data.get("delta", "?")
                    
                    if isinstance(current, float):
                        current_str = f"{current:.3f}"
                    else:
                        current_str = str(current)
                    
                    if isinstance(target, float):
                        target_str = f"{target:.3f}"
                    else:
                        target_str = str(target)
                    
                    if isinstance(delta, float):
                        delta_str = f"{delta:+.3f}"
                    else:
                        delta_str = str(delta)
                    
                    print(f"    {param_name}:")
                    print(f"      Current: {current_str}")
                    print(f"      Target:  {target_str}")
                    print(f"      Delta:   {delta_str}")
                else:
                    print(f"    {param_name}: {knob_data}")
            print()

        print("-" * 70)
        print()

    print("=" * 70)



