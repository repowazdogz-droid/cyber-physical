from __future__ import annotations

from typing import Dict

from ..models import DimensionResult, ProcedureSpec, Status, VRFCResult


def compute_uncertainty(score: float, status: Status) -> Dict[str, float]:
    """
    Deterministic uncertainty band:
      - GREEN: narrow band
      - AMBER: medium band
      - RED: wide band
    """
    if status is Status.GREEN:
        band = 0.05
    elif status is Status.AMBER:
        band = 0.10
    else:
        band = 0.15

    pessimistic = max(0.0, score - band)
    optimistic = min(1.0, score + band)

    return {
        "pessimistic": round(pessimistic, 3),
        "nominal": round(score, 3),
        "optimistic": round(optimistic, 3),
    }


def aggregate_results(
    spec: ProcedureSpec,
    dimensions: Dict[str, DimensionResult],
    sensitivity: Dict[str, Dict],
) -> VRFCResult:
    for name, sens in sensitivity.items():
        if name in dimensions:
            dimensions[name].sensitivity = sens

    # Attach uncertainty to every dimension
    for dim in dimensions.values():
        dim.uncertainty = compute_uncertainty(dim.score, dim.status)

    statuses = [d.status for d in dimensions.values()]
    scores = [d.score for d in dimensions.values()] or [0.0]

    # Hard RED logic: fatal_issues take precedence
    has_fatal = any(dim.fatal_issues for dim in dimensions.values())
    any_red = any(s is Status.RED for s in statuses)
    any_amber = any(s is Status.AMBER for s in statuses)

    if has_fatal:
        overall_status = Status.RED
    elif any_red:
        overall_status = Status.RED
    elif any_amber:
        overall_status = Status.AMBER
    else:
        overall_status = Status.GREEN

    overall_score = float(round(sum(scores) / len(scores), 3))

    notes = []
    if overall_status is Status.RED:
        if has_fatal:
            notes.append("One or more fatal issues detected — blocking feasibility concerns.")
        else:
            notes.append("One or more critical feasibility dimensions are RED.")
    elif overall_status is Status.AMBER:
        notes.append("Feasible with caveats; address AMBER dimensions to de-risk.")
    else:
        notes.append("No blocking feasibility issues detected under current presets.")

    return VRFCResult(
        spec_id=spec.id,
        spec_name=spec.name,
        overall_status=overall_status,
        overall_score=overall_score,
        dimensions=dimensions,
        notes=notes,
        metadata={
            "domain": spec.domain,
            "subdomain": spec.subdomain,
            "risk_class": spec.risk_class,
            "jurisdiction": spec.jurisdiction,
            "payer_mix": spec.payer_mix,
        },
    )

