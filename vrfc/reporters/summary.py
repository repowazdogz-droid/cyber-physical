from __future__ import annotations

from ..models import VRFCResult


def render_summary(result: VRFCResult) -> str:
    lines = []
    lines.append(f"VRFC SUMMARY — {result.spec_name} [{result.spec_id}]")
    lines.append(f"Overall status: {result.overall_status.value}")
    lines.append(f"Overall score:  {result.overall_score:.3f}")
    lines.append("")

    meta = result.metadata
    lines.append(
        f"Domain: {meta.get('domain')} / {meta.get('subdomain')} | "
        f"Risk class: {meta.get('risk_class')} | "
        f"Jurisdiction: {meta.get('jurisdiction')}"
    )
    lines.append(f"Payer mix: {', '.join(meta.get('payer_mix', [])) or '-'}")
    lines.append("")

    lines.append("Dimensions:")
    for name, dim in result.dimensions.items():
        lines.append(f"  - {name}: {dim.status.value} (score={dim.score:.3f})")
        if dim.issues:
            lines.append("      Issues:")
            for issue in dim.issues:
                lines.append(f"        • {issue}")
        if dim.fatal_issues:
            lines.append("      Fatal Issues:")
            for fatal in dim.fatal_issues:
                lines.append(f"        • {fatal}")
        if dim.suggestions:
            lines.append("      Suggestions:")
            for s in dim.suggestions:
                lines.append(f"        • {s}")
        if dim.method:
            logic = dim.method.get("logic")
            if logic:
                lines.append(f"      Method: {logic}")
    lines.append("")

    if result.notes:
        lines.append("Notes:")
        for n in result.notes:
            lines.append(f"  • {n}")

    return "\n".join(lines)

