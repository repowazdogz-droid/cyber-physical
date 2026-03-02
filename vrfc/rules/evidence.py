from __future__ import annotations

from typing import Any, Dict

from ..models import DimensionResult, ProcedureSpec, Status
from ..presets import Presets


def evaluate(spec: ProcedureSpec, presets: Presets) -> DimensionResult:
    section = spec.section("evidence", {})
    risk_class = spec.risk_class

    num_studies = int(section.get("num_studies", 0))
    num_rcts = int(section.get("num_rcts", 0))
    total_patients = int(section.get("total_patients", 0))
    follow_up_months = float(section.get("follow_up_months", 0.0))

    rc_defaults: Dict[str, Any] = presets.regulatory.get("risk_classes", {}).get(
        risk_class, {"min_studies": 1, "min_patients": 20}
    )
    min_studies = int(rc_defaults.get("min_studies", 1))
    min_patients = int(rc_defaults.get("min_patients", 20))

    issues = []
    fatal_issues = []
    suggestions = []

    if num_studies == 0 or total_patients == 0:
        status = Status.RED
        fatal_issues.append("No meaningful clinical evidence available.")
        issues.append("No meaningful clinical evidence available.")
        suggestions.append(
            f"Generate at least {min_studies} studies with {min_patients} total patients for risk class {risk_class}."
        )
    elif num_studies < min_studies or total_patients < min_patients:
        # Check if gap is critically large (fatal for high risk classes)
        patient_gap_ratio = total_patients / max(min_patients, 1) if min_patients > 0 else 0.0
        study_gap_ratio = num_studies / max(min_studies, 1) if min_studies > 0 else 0.0
        
        # For IIb and III, if evidence is < 50% of required, mark as fatal
        if risk_class in ("IIb", "III") and (patient_gap_ratio < 0.5 or study_gap_ratio < 0.5):
            status = Status.RED
            fatal_issues.append(
                f"Evidence base critically insufficient for risk class {risk_class}: "
                f"only {total_patients} patients (required: {min_patients}) and {num_studies} studies (required: {min_studies})."
            )
            issues.append(
                f"Evidence volume is critically below thresholds for risk class {risk_class}."
            )
        else:
            status = Status.AMBER
            issues.append(
                f"Evidence volume is below expected thresholds for risk class {risk_class}."
            )
        
        if num_studies < min_studies:
            suggestions.append(f"Add {min_studies - num_studies} further studies.")
        if total_patients < min_patients:
            suggestions.append(f"Recruit {min_patients - total_patients} additional patients.")
    else:
        status = Status.GREEN
        suggestions.append("Evidence volume is broadly aligned with risk class expectations.")

    score = _score(num_studies, num_rcts, total_patients, follow_up_months, min_studies, min_patients)

    metrics: Dict[str, Any] = {
        "num_studies": num_studies,
        "num_rcts": num_rcts,
        "total_patients": total_patients,
        "follow_up_months": follow_up_months,
        "required_min_studies": min_studies,
        "required_min_patients": min_patients,
    }

    result = DimensionResult(
        name="evidence",
        status=status,
        score=score,
        issues=issues,
        metrics=metrics,
        suggestions=suggestions,
        fatal_issues=fatal_issues,
    )

    result.method = {
        "dimension": "evidence",
        "logic": "rule-based thresholds by risk_class and jurisdiction",
        "inputs": [
            "total_patients",
            "num_studies",
            "num_rcts",
            "follow_up_months",
            "risk_class",
            "jurisdiction",
        ],
        "notes": "No AI/ML used; thresholds loaded from presets/regulatory.yaml. Scoring weights: 35% study ratio, 35% patient ratio, 15% RCT bonus, 15% follow-up factor.",
    }

    return result


def _score(
    num_studies: int,
    num_rcts: int,
    total_patients: int,
    follow_up_months: float,
    min_studies: int,
    min_patients: int,
) -> float:
    if total_patients <= 0:
        return 0.0

    study_ratio = min(num_studies / max(min_studies, 1), 2.0)
    patient_ratio = min(total_patients / max(min_patients, 1), 2.0)
    rct_bonus = min(num_rcts, 3) / 3.0
    follow_up_factor = min(follow_up_months / 12.0, 2.0)

    raw = 0.35 * study_ratio + 0.35 * patient_ratio + 0.15 * rct_bonus + 0.15 * follow_up_factor
    return float(round(max(0.0, min(raw, 1.0)), 3))

