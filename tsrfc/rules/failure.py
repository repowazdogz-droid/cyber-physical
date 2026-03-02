from __future__ import annotations

from typing import List

from ..models import (
    FailureSurface,
    ProcedureSpec,
    TechConcept,
    UnitOperation,
    RiskLevel,
    TechRole,
)


def _op_ids_matching(unit_ops: List[UnitOperation], substrings) -> List[str]:
    """Return op_ids whose names contain any of the given substrings (case-insensitive)."""
    ids: List[str] = []
    lower_subs = [s.lower() for s in substrings]
    for op in unit_ops:
        name_lower = op.name.lower()
        if any(s in name_lower for s in lower_subs):
            ids.append(op.op_id)
    return ids


def analyze_failure_surfaces(
    procedure: ProcedureSpec,
    concept: TechConcept,
    unit_ops: List[UnitOperation],
) -> List[FailureSurface]:
    """Derive a set of failure surfaces for a given procedure + concept.

    This is a heuristic v0: explicit rules, no magic. The goal is to surface
    the kinds of failure domains that matter in practice:
      - technical (e.g. dural tears, incomplete decompression)
      - workflow (setup complexity, equipment burden)
      - adoption (capital cost, learning curve)
      - evidence (gap between claims and data)
    """
    surfaces: List[FailureSurface] = []

    domain = procedure.domain
    proc_id = procedure.procedure_id
    role = concept.role

    # ----- TECHNICAL: Spine MIS lumbar decompression + resection assist -----
    if domain.value == "spine" and proc_id == "mis_lumbar_decompression":
        # Dural tear risk (high impact technical failure)
        dural_ops = _op_ids_matching(unit_ops, ["decompression", "laminotomy"])
        surfaces.append(
            FailureSurface(
                category="technical",
                code="DURAL_TEAR_RISK",
                description="Risk of dural tear during decompression (especially undercutting and contralateral work).",
                risk=RiskLevel.HIGH,
                affected_ops=dural_ops,
                notes="Any tool that modifies decompression technique must not increase this risk.",
            )
        )

        # Incomplete decompression (residual stenosis / re-op)
        surfaces.append(
            FailureSurface(
                category="technical",
                code="INCOMPLETE_DECOMPRESSION",
                description="Risk of residual stenosis due to under-decompression, leading to persistent symptoms or re-operation.",
                risk=RiskLevel.MEDIUM,
                affected_ops=dural_ops,
                notes="Navigation/guardrails that restrict resection envelope may inadvertently cause under-decompression.",
            )
        )

        # Over-decompression / instability
        surfaces.append(
            FailureSurface(
                category="technical",
                code="OVER_DECOMPRESSION_INSTABILITY",
                description="Risk of excessive bone removal leading to segmental instability.",
                risk=RiskLevel.MEDIUM,
                affected_ops=dural_ops,
                notes="Guardrails that do not respect bony stabilising structures may increase long-term instability.",
            )
        )

    # ----- WORKFLOW: navigation / robotics / setup complexity -----
    if concept.requires_advanced_nav or concept.robotic_integration != "none":
        # Setup complexity: extra time, staff, and failure modes
        surfaces.append(
            FailureSurface(
                category="workflow",
                code="SETUP_COMPLEXITY",
                description="Increased OR setup complexity due to navigation/robotics stack.",
                risk=RiskLevel.MEDIUM,
                affected_ops=_op_ids_matching(unit_ops, ["positioning", "setup", "imaging"]),
                notes="More devices and steps increase risk of delays, misconfiguration, and cancellations.",
            )
        )

        # Equipment burden: another tower/stack in theatre
        surfaces.append(
            FailureSurface(
                category="workflow",
                code="EQUIPMENT_BURDEN",
                description="Additional equipment in theatre (navigation/robotics tower) competing for space and attention.",
                risk=RiskLevel.MEDIUM,
                affected_ops=[],
                notes="Physical and cognitive clutter can reduce resilience in complex cases.",
            )
        )

        # Navigation dependency: fragility when nav fails mid-case
        surfaces.append(
            FailureSurface(
                category="technical",
                code="NAV_DEPENDENCY",
                description="Dependence on navigation; failure mid-case may leave the surgeon worse off than baseline.",
                risk=RiskLevel.MEDIUM,
                affected_ops=_op_ids_matching(unit_ops, ["imaging", "decompression", "screw placement"]),
                notes="Rescue workflows must exist when navigation is unavailable or inaccurate.",
            )
        )

    # ----- ADOPTION: learning curve, cost, workflow friction -----
    if concept.learning_curve_cases is not None and concept.learning_curve_cases > 20:
        surfaces.append(
            FailureSurface(
                category="adoption",
                code="LEARNING_CURVE_STEEP",
                description="Steep learning curve; early cases may show worse outcomes than baseline.",
                risk=RiskLevel.MEDIUM,
                affected_ops=[],
                notes="Requires structured proctoring, case selection, and transparent outcome monitoring.",
            )
        )

    # Capital cost vs unclear ROI
    cap_band = concept.capital_cost_band
    if cap_band.value in ("medium", "high"):
        surfaces.append(
            FailureSurface(
                category="economic",
                code="CAPITAL_COST_UNCLEAR_ROI",
                description="Non-trivial capital cost with uncertain return on investment.",
                risk=RiskLevel.MEDIUM,
                affected_ops=[],
                notes="Without clear improvements in outcomes, throughput, or staff utilisation, adoption may stall.",
            )
        )

    # ---- EVIDENCE: generic gap for any new concept ----
    surfaces.append(
        FailureSurface(
            category="evidence",
            code="EVIDENCE_GAP_UNKNOWN_BENEFIT",
            description="Evidence gap between claimed benefits and existing data.",
            risk=RiskLevel.LOW,
            affected_ops=[],
            notes="Requires at least prospective data collection, ideally multicentre, before broad adoption.",
        )
    )

    return surfaces






