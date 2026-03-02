from __future__ import annotations

from typing import Dict

from ..models import DimensionResult, ProcedureSpec
from ..presets import Presets


def compute_sensitivity(
    spec: ProcedureSpec,
    dimensions: Dict[str, DimensionResult],
    presets: Presets,
) -> Dict[str, Dict]:
    sens: Dict[str, Dict] = {}

    ev = dimensions.get("evidence")
    if ev is not None:
        m = ev.metrics
        needed_patients = max(0, int(m.get("required_min_patients", 0) - m.get("total_patients", 0)))
        needed_studies = max(0, int(m.get("required_min_studies", 0) - m.get("num_studies", 0)))
        sens["evidence"] = {
            "total_patients": {
                "current": m.get("total_patients", 0),
                "target": m.get("required_min_patients", 0),
                "delta": needed_patients,
                "impact": "high" if needed_patients > 0 else "none",
            },
            "num_studies": {
                "current": m.get("num_studies", 0),
                "target": m.get("required_min_studies", 0),
                "delta": needed_studies,
                "impact": "medium" if needed_studies > 0 else "none",
            },
        }

    rb = dimensions.get("reimbursement")
    if rb is not None:
        m = rb.metrics
        gap = float(m.get("required_roi_per_case", 0.0) - m.get("net_benefit_per_case", 0.0))
        sens["reimbursement"] = {
            "net_benefit_per_case": {
                "current": m.get("net_benefit_per_case", 0.0),
                "target": m.get("required_roi_per_case", 0.0),
                "delta": gap if gap > 0 else 0.0,
                "impact": "high" if gap > 0 else "none",
            }
        }

    ad = dimensions.get("adoption")
    if ad is not None:
        m = ad.metrics
        sens["adoption"] = {
            "training_hours": {
                "current": m.get("training_hours", 0.0),
                "target": 4.0,
                "delta": max(0.0, m.get("training_hours", 0.0) - 4.0),
                "impact": "medium" if m.get("training_hours", 0.0) > 4.0 else "none",
            }
        }

    return sens



