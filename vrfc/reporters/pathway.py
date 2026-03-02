from __future__ import annotations

from ..models import VRFCResult, Status


def render_pathway(result: VRFCResult) -> str:
    lines = []
    lines.append("VRFC TRANSLATION PATHWAY VIEW")
    lines.append(f"Spec: {result.spec_name} [{result.spec_id}]")
    lines.append("")

    ev = result.dimensions.get("evidence")
    rg = result.dimensions.get("regulatory")
    rb = result.dimensions.get("reimbursement")
    ad = result.dimensions.get("adoption")

    lines.append("Benchtop → Clinical → Reimbursement → Adoption\n")

    if ev:
        lines.append(f"Evidence: {ev.status.value}")
        for s in ev.suggestions[:3]:
            lines.append(f"  • {s}")
        lines.append("")
    if rg:
        lines.append(f"Regulatory: {rg.status.value}")
        for s in rg.suggestions[:3]:
            lines.append(f"  • {s}")
        lines.append("")
    if rb:
        lines.append(f"Reimbursement: {rb.status.value}")
        for s in rb.suggestions[:3]:
            lines.append(f"  • {s}")
        lines.append("")
    if ad:
        lines.append(f"Adoption: {ad.status.value}")
        for s in ad.suggestions[:3]:
            lines.append(f"  • {s}")
        lines.append("")

    if result.overall_status is Status.RED:
        lines.append("Overall: RED — treat this as a concept to salvage or kill fast.")
    elif result.overall_status is Status.AMBER:
        lines.append("Overall: AMBER — feasible with focused work on highlighted stages.")
    else:
        lines.append("Overall: GREEN — translation pathway looks viable under current assumptions.")

    return "\n".join(lines)



