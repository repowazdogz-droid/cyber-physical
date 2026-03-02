from __future__ import annotations

from typing import Any, Dict

from ..models import DimensionResult, ProcedureSpec, Status
from ..presets import Presets


def evaluate(spec: ProcedureSpec, presets: Presets) -> DimensionResult:
    section = spec.section("regulatory", {})
    risk_class = spec.risk_class
    jurisdiction = spec.jurisdiction

    has_ce_mark = bool(section.get("has_ce_mark", False))
    pathway = str(section.get("pathway", "unknown"))
    strategy_defined = bool(section.get("strategy_defined", False))

    issues = []
    fatal_issues = []
    suggestions = []

    rc_defaults: Dict[str, Any] = presets.regulatory.get("risk_classes", {}).get(
        risk_class, {}
    )
    agency_info: Dict[str, Any] = presets.regulatory.get("jurisdictions", {}).get(
        jurisdiction, {}
    )

    if has_ce_mark or section.get("has_clearance", False):
        status = Status.GREEN
        suggestions.append("Device already holds clearance/marking for this indication.")
    elif strategy_defined and pathway != "unknown":
        status = Status.AMBER
        issues.append("Regulatory strategy defined but not yet executed.")
        suggestions.append(f"Execute planned pathway: {pathway}.")
    else:
        status = Status.RED
        # For high-risk classes (IIb, III), missing regulatory plan is fatal
        if risk_class in ("IIb", "III"):
            fatal_issues.append(
                f"No regulatory pathway defined for high-risk class {risk_class} in {jurisdiction}."
            )
        issues.append("No clear regulatory pathway defined.")
        suggestions.append(
            f"Define pathway for risk class {risk_class} with {agency_info.get('agency', 'regulator')}."
        )

    base_score = 1.0 if has_ce_mark else (0.5 if strategy_defined else 0.1)
    score = float(round(base_score, 3))

    metrics = {
        "risk_class": risk_class,
        "jurisdiction": jurisdiction,
        "has_ce_mark_or_clearance": has_ce_mark or section.get("has_clearance", False),
        "pathway": pathway,
        "strategy_defined": strategy_defined,
    }

    result = DimensionResult(
        name="regulatory",
        status=status,
        score=score,
        issues=issues,
        metrics=metrics,
        suggestions=suggestions,
        fatal_issues=fatal_issues,
    )

    result.method = {
        "dimension": "regulatory",
        "logic": "rule-based assessment of clearance status and regulatory pathway",
        "inputs": [
            "risk_class",
            "jurisdiction",
            "has_ce_mark",
            "has_clearance",
            "pathway",
            "strategy_defined",
        ],
        "notes": f"No AI/ML used; agency info loaded from presets/regulatory.yaml. Risk class {risk_class}, jurisdiction {jurisdiction} ({agency_info.get('agency', 'regulator')}).",
    }

    return result

