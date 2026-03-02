from __future__ import annotations

from typing import Any, Dict, List

from ..models import DimensionResult, ProcedureSpec, Status
from ..presets import Presets


def evaluate(spec: ProcedureSpec, presets: Presets) -> DimensionResult:
    section = spec.section("reimbursement", {})
    payer_mix: List[str] = spec.payer_mix or ["default"]

    has_code = bool(section.get("has_procedure_code", False))
    estimated_cost = float(section.get("estimated_cost_per_case", 0.0))
    estimated_savings = float(section.get("estimated_savings_per_case", 0.0))

    net_benefit = estimated_savings - estimated_cost

    issues = []
    suggestions = []

    thresholds: Dict[str, Any] = presets.reimbursement
    required_roi_values: List[float] = []
    for payer in payer_mix:
        cfg = thresholds.get(payer, thresholds.get("default", {}))
        required_roi_values.append(float(cfg.get("min_roi_per_case", 0.0)))
    required_roi = max(required_roi_values) if required_roi_values else 0.0

    if net_benefit < 0:
        status = Status.RED
        issues.append("Negative net economic benefit per case.")
        suggestions.append("Reduce costs or increase savings to at least break even.")
    elif net_benefit < required_roi:
        status = Status.AMBER
        issues.append("Net benefit positive but below payer ROI expectations.")
        gap = required_roi - net_benefit
        suggestions.append(f"Improve economics by approximately {gap:.0f} per case.")
    else:
        status = Status.GREEN
        suggestions.append("Economic case meets or exceeds payer ROI thresholds.")

    if not has_code:
        if status is Status.GREEN:
            status = Status.AMBER
        issues.append("No established procedure code.")
        suggestions.append("Work with payers/coding bodies to establish or map to a code.")

    score = _score(net_benefit, required_roi, has_code)

    metrics = {
        "estimated_cost_per_case": estimated_cost,
        "estimated_savings_per_case": estimated_savings,
        "net_benefit_per_case": net_benefit,
        "required_roi_per_case": required_roi,
        "has_procedure_code": has_code,
        "payer_mix": payer_mix,
    }

    result = DimensionResult(
        name="reimbursement",
        status=status,
        score=score,
        issues=issues,
        metrics=metrics,
        suggestions=suggestions,
    )

    result.method = {
        "dimension": "reimbursement",
        "logic": "rule-based net benefit calculation against payer ROI thresholds",
        "inputs": [
            "payer_mix",
            "estimated_cost_per_case",
            "estimated_savings_per_case",
            "has_procedure_code",
        ],
        "notes": f"No AI/ML used; ROI thresholds loaded from presets/reimbursement.yaml. Payer mix: {', '.join(payer_mix)}. Net benefit = savings - cost, compared to required ROI per payer type.",
    }

    return result


def _score(net_benefit: float, required_roi: float, has_code: bool) -> float:
    if net_benefit <= 0:
        base = 0.1
    elif net_benefit < required_roi:
        base = 0.5
    else:
        base = 0.9
    if not has_code:
        base -= 0.15
    return float(round(max(0.0, min(base, 1.0)), 3))

