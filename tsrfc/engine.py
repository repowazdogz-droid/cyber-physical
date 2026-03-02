from __future__ import annotations

from typing import Any, Dict, List

from .models import (
    AdoptionProfile,
    AdoptionTrajectory,
    EvidenceLevel,
    EvidenceProfile,
    FailureSurface,
    ProcedureDomain,
    ProcedureSpec,
    RiskLevel,
    Setting,
    TechConcept,
    TechRole,
    UnitOperation,
    CompileResult,
)
from .presets import get_procedure_preset, get_unit_ops_preset
from .rules.failure import analyze_failure_surfaces


def _parse_procedure_spec(data: Dict[str, Any]) -> ProcedureSpec:
    """Parse a procedure spec dict into a ProcedureSpec dataclass.

    Falls back to presets for domain/setting when possible.
    """
    proc_block = data or {}
    procedure_id = proc_block.get("procedure_id")
    if not procedure_id:
        raise ValueError("procedure.procedure_id is required")

    preset = get_procedure_preset(procedure_id) or {}

    # Domain
    domain_str = proc_block.get("domain") or preset.get("domain") or ProcedureDomain.OTHER.value
    try:
        domain = ProcedureDomain(domain_str)
    except ValueError:
        domain = ProcedureDomain.OTHER

    # Setting
    setting_str = proc_block.get("setting") or preset.get("setting_default") or Setting.OTHER.value
    try:
        setting = Setting(setting_str)
    except ValueError:
        setting = Setting.OTHER

    indication = proc_block.get("indication") or (preset.get("indication_examples") or [""])[0]
    approach = proc_block.get("approach") or (preset.get("approach_examples") or [""])[0]
    notes = proc_block.get("notes") or preset.get("notes")

    return ProcedureSpec(
        procedure_id=procedure_id,
        domain=domain,
        indication=indication,
        approach=approach,
        setting=setting,
        notes=notes,
    )


def _parse_tech_concept(data: Dict[str, Any]) -> TechConcept:
    """Parse a tech_concept dict into a TechConcept dataclass."""
    if not data:
        raise ValueError("tech_concept block is required")

    name = data.get("name") or "<unnamed concept>"
    type_str = data.get("type") or "unspecified"

    role_str = data.get("role") or TechRole.OTHER.value
    try:
        role = TechRole(role_str)
    except ValueError:
        role = TechRole.OTHER

    cap_band_str = data.get("capital_cost_band") or "medium"
    disp_band_str = data.get("disposables_cost_band") or "medium"

    # Simple normalisation for cost bands
    cap_band_str = cap_band_str.lower()
    disp_band_str = disp_band_str.lower()

    from .models import CostBand

    def _to_cost_band(value: str) -> CostBand:
        try:
            return CostBand(value)
        except ValueError:
            # Try loose mapping
            if value.startswith("low"):
                return CostBand.LOW
            if value.startswith("high"):
                return CostBand.HIGH
            return CostBand.MEDIUM

    cap_band = _to_cost_band(cap_band_str)
    disp_band = _to_cost_band(disp_band_str)

    learning_curve = data.get("learning_curve_cases")
    requires_advanced_nav = bool(data.get("requires_advanced_nav", False))
    robotic_integration = data.get("robotic_integration", "none")
    description = data.get("description")

    return TechConcept(
        name=name,
        type=type_str,
        role=role,
        capital_cost_band=cap_band,
        disposables_cost_band=disp_band,
        learning_curve_cases=learning_curve,
        requires_advanced_nav=requires_advanced_nav,
        robotic_integration=robotic_integration,
        description=description,
    )


def _unit_ops_for_procedure(procedure: ProcedureSpec) -> List[UnitOperation]:
    """Retrieve unit operations for a given procedure from presets."""
    raw_ops = get_unit_ops_preset(procedure.procedure_id)
    unit_ops: List[UnitOperation] = []

    for op in raw_ops:
        unit_ops.append(
            UnitOperation(
                op_id=op["op_id"],
                name=op["name"],
                primary_goal=op.get("primary_goal", ""),
                typical_issues=list(op.get("typical_issues", [])),
                innovation_hooks=list(op.get("innovation_hooks", [])),
            )
        )

    return unit_ops


def _score_failure_surfaces(failure_surfaces: List[FailureSurface]) -> Dict[str, float]:
    """Compute simple risk scores per category based on HIGH/MEDIUM counts."""
    scores: Dict[str, float] = {}
    by_cat: Dict[str, Dict[str, int]] = {}

    for fs in failure_surfaces:
        cat = fs.category
        if cat not in by_cat:
            by_cat[cat] = {"high": 0, "medium": 0, "low": 0}
        if fs.risk == RiskLevel.HIGH:
            by_cat[cat]["high"] += 1
        elif fs.risk == RiskLevel.MEDIUM:
            by_cat[cat]["medium"] += 1
        else:
            by_cat[cat]["low"] += 1

    for cat, counts in by_cat.items():
        value = counts["high"] + 0.5 * counts["medium"]
        scores[f"risk_{cat}"] = float(value)

    return scores


def compile_from_dict(spec: Dict[str, Any]) -> CompileResult:
    """Compile a high-level spec dict into a CompileResult.

    v0: focuses on Unit Operation Mapping. Other dimensions are stubbed.
    """
    proc_data = spec.get("procedure", {})
    tech_data = spec.get("tech_concept", {})

    procedure = _parse_procedure_spec(proc_data)
    concept = _parse_tech_concept(tech_data)

    unit_operations = _unit_ops_for_procedure(procedure)

    failure_surfaces = analyze_failure_surfaces(procedure, concept, unit_operations)

    evidence_profile = EvidenceProfile(
        current_level=EvidenceLevel.UNKNOWN,
        target_level=EvidenceLevel.UNKNOWN,
        key_endpoints=[],
        estimated_sample_size=None,
        estimated_centres=None,
        time_horizon_years=None,
        comments="Evidence reasoning not yet implemented (v0).",
    )

    adoption_profile = AdoptionProfile(
        trajectory=AdoptionTrajectory.UNKNOWN,
        primary_barriers=[],
        leverage_points=[],
        kill_criteria=[],
        notes="Adoption dynamics not yet implemented (v0).",
    )

    scores: Dict[str, float] = {}
    scores["coverage_unit_ops"] = float(len(unit_operations))
    scores.update(_score_failure_surfaces(failure_surfaces))

    metadata: Dict[str, Any] = {
        "engine_version": "0.1.1",
        "notes": "Unit Operation Mapper + Failure Surface Explorer v0.",
    }

    return CompileResult(
        procedure=procedure,
        concept=concept,
        unit_operations=unit_operations,
        failure_surfaces=failure_surfaces,
        evidence_profile=evidence_profile,
        adoption_profile=adoption_profile,
        scores=scores,
        metadata=metadata,
    )






