"""
Actuation feasibility rules.

Checks actuation mode, pressure/force limits, and response time.
"""

from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_actuation(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate actuation feasibility.

    Checks:
    - Pneumatic pressure vs safety limits
    - Tendon force vs tip force limits
    - Response time acceptability
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    actuation = robot.actuation
    safety = robot.safety

    # Pneumatic pressure check
    if actuation.mode == "pneumatic":
        if actuation.max_pressure_kpa is None:
            issues.append("Pneumatic mode specified but max_pressure_kpa not set")
            score *= 0.5
            status = Status.RED
        else:
            max_pressure = actuation.max_pressure_kpa
            safe_pressure = min(
                safety.max_contact_pressure_kpa,
                anatomy.max_contact_pressure_kpa,
            )
            
            if max_pressure > safe_pressure:
                issues.append(
                    f"Maximum pneumatic pressure {max_pressure:.1f}kPa exceeds "
                    f"safe contact pressure {safe_pressure:.1f}kPa"
                )
                score *= 0.3
                status = Status.RED
                knobs["max_pressure_kpa"] = {
                    "current": max_pressure,
                    "target_max": safe_pressure,
                    "delta": safe_pressure - max_pressure,
                }
            elif max_pressure > safe_pressure * 0.8:
                issues.append(
                    f"Maximum pressure {max_pressure:.1f}kPa approaches "
                    f"safe limit {safe_pressure:.1f}kPa"
                )
                score *= 0.7
                if status == Status.GREEN:
                    status = Status.AMBER
                suggestions.append("Consider pressure limiting valve")
            else:
                suggestions.append(
                    f"Pressure {max_pressure:.1f}kPa well within safe limit "
                    f"{safe_pressure:.1f}kPa"
                )

    # Tendon force check
    elif actuation.mode == "tendon":
        if actuation.max_tendon_force_n is None:
            issues.append("Tendon mode specified but max_tendon_force_n not set")
            score *= 0.5
            status = Status.RED
        else:
            max_force = actuation.max_tendon_force_n
            safe_force = safety.max_tip_force_n
            
            if max_force > safe_force:
                issues.append(
                    f"Maximum tendon force {max_force:.2f}N exceeds "
                    f"safe tip force {safe_force:.2f}N"
                )
                score *= 0.4
                status = Status.RED
                knobs["max_tendon_force_n"] = {
                    "current": max_force,
                    "target_max": safe_force,
                    "delta": safe_force - max_force,
                }
            elif max_force > safe_force * 0.9:
                issues.append(
                    f"Maximum force {max_force:.2f}N approaches "
                    f"safe limit {safe_force:.2f}N"
                )
                score *= 0.7
                if status == Status.GREEN:
                    status = Status.AMBER
                suggestions.append("Consider force limiting or closed-loop control")
            else:
                suggestions.append(
                    f"Force {max_force:.2f}N well within safe limit {safe_force:.2f}N"
                )

    # Hydraulic pressure check
    elif actuation.mode == "hydraulic":
        if actuation.max_pressure_kpa is None:
            issues.append("Hydraulic mode specified but max_pressure_kpa not set")
            score *= 0.5
            status = Status.RED
        else:
            max_pressure = actuation.max_pressure_kpa
            safe_pressure = min(
                safety.max_contact_pressure_kpa,
                anatomy.max_contact_pressure_kpa,
            )
            
            if max_pressure > safe_pressure:
                issues.append(
                    f"Maximum hydraulic pressure {max_pressure:.1f}kPa exceeds "
                    f"safe contact pressure {safe_pressure:.1f}kPa"
                )
                score *= 0.3
                status = Status.RED
                knobs["max_pressure_kpa"] = {
                    "current": max_pressure,
                    "target_max": safe_pressure,
                    "delta": safe_pressure - max_pressure,
                }
            else:
                suggestions.append(
                    f"Pressure {max_pressure:.1f}kPa within safe limit "
                    f"{safe_pressure:.1f}kPa"
                )

    # Response time check
    if actuation.response_time_ms is not None:
        response_time = actuation.response_time_ms
        # Typical surgical maneuvers need < 500ms response
        if response_time > 500:
            issues.append(
                f"Response time {response_time:.0f}ms exceeds recommended "
                f"500ms for surgical maneuvers"
            )
            score *= 0.6
            if status == Status.GREEN:
                status = Status.AMBER
            knobs["response_time_ms"] = {
                "current": response_time,
                "target_max": 500.0,
                "delta": 500.0 - response_time,
            }
            suggestions.append("Consider faster actuation system")
        elif response_time > 300:
            suggestions.append(
                f"Response time {response_time:.0f}ms acceptable but "
                f"could be improved"
            )
        else:
            suggestions.append(
                f"Response time {response_time:.0f}ms excellent for "
                f"surgical control"
            )

    method = {
        "pressure_safety_factor": 0.8,
        "force_safety_factor": 0.9,
        "response_time_threshold_ms": 500.0,
    }

    return DimensionResult(
        name="actuation",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



