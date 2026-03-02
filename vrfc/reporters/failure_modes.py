from __future__ import annotations

from ..models import Status, VRFCResult


def render_failure_modes(result: VRFCResult) -> str:
    lines = []
    lines.append("VRFC FAILURE MODES")
    lines.append(f"Spec: {result.spec_name} [{result.spec_id}]")
    lines.append("")

    for name, dim in result.dimensions.items():
        if dim.status in (Status.AMBER, Status.RED):
            lines.append(f"{name.upper()} — {dim.status.value}")
            for issue in dim.issues or []:
                lines.append(f"  • {issue}")
            if dim.sensitivity:
                lines.append("  Knobs:")
                for param, info in dim.sensitivity.items():
                    lines.append(
                        f"    - {param}: current={info.get('current')} "
                        f"→ target={info.get('target')} (Δ={info.get('delta')}) "
                        f"[impact={info.get('impact')}]"
                    )
            lines.append("")

    if len(lines) == 3:
        lines.append("No non-green dimensions — no failure modes surfaced.")
    return "\n".join(lines)



