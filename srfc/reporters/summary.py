"""
Human-readable summary reporter.
"""

from ..models import CompileResult, Status


def print_summary(result: CompileResult) -> None:
    """
    Print human-readable, 1-screen summary.

    Shows:
    - Procedure ID, anatomy
    - Overall status + score
    - Each dimension: status, score, 1-2 issues or suggestions
    """
    print("=" * 70)
    print("SRFC FEASIBILITY COMPILATION SUMMARY")
    print("=" * 70)
    print()
    print(f"Procedure: {result.procedure.procedure_id}")
    print(f"Domain:    {result.procedure.domain}")
    print(f"Anatomy:   {result.anatomy.name}")
    if result.procedure.description:
        print(f"Desc:      {result.procedure.description}")
    print()
    print("-" * 70)
    print(f"OVERALL STATUS: {result.overall_status.value}")
    print(f"OVERALL SCORE:  {result.overall_score:.3f}")
    print("-" * 70)
    print()

    # Status legend
    status_colors = {
        Status.GREEN: "✓",
        Status.AMBER: "⚠",
        Status.RED: "✗",
    }

    # Print each dimension
    for dim_name, dim_result in sorted(result.dimensions.items()):
        icon = status_colors.get(dim_result.status, "?")
        print(f"{icon} {dim_name.upper()}")
        print(f"   Status: {dim_result.status.value}")
        
        # Show score with uncertainty band if available
        if dim_result.uncertainty:
            low = dim_result.uncertainty["low"]
            high = dim_result.uncertainty["high"]
            print(f"   Score:  {dim_result.score:.3f} ({low:.2f}–{high:.2f})")
        else:
            print(f"   Score:  {dim_result.score:.3f}")
        
        if dim_result.issues:
            print(f"   Issues:")
            for issue in dim_result.issues[:2]:  # Max 2 issues
                print(f"     • {issue}")
        
        if dim_result.suggestions and not dim_result.issues:
            print(f"   Notes:")
            for suggestion in dim_result.suggestions[:2]:  # Max 2 suggestions
                print(f"     • {suggestion}")
        
        print()

    # Overall notes
    if result.notes:
        print("-" * 70)
        print("NOTES:")
        for note in result.notes:
            print(f"  • {note}")
        print()

    # Interaction notes
    if result.interactions:
        print("-" * 70)
        print("INTERACTION NOTES:")
        for interaction in result.interactions:
            print(f"  • {interaction}")
        print()

    # Translation implications
    if result.translation_implications:
        print("-" * 70)
        print("TRANSLATION IMPLICATIONS:")
        if result.translation_implications.get("regulatory"):
            print("  Regulatory:")
            for impl in result.translation_implications["regulatory"]:
                print(f"    • {impl}")
        if result.translation_implications.get("economic"):
            print("  Economic:")
            for impl in result.translation_implications["economic"]:
                print(f"    • {impl}")
        print()

    print("=" * 70)

