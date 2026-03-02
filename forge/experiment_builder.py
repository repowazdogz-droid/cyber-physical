"""Experiment builder for Forge hypotheses."""

from dataclasses import dataclass
from typing import List, Optional
from .hypothesis_engine import Hypothesis


@dataclass
class ExperimentCard:
    hypothesis_id: str
    experiment_name: str
    objective: str
    method: str  # bench/sim/analytical
    measurements: List[str]
    success_criterion: str
    falsification_criterion: str
    estimated_cost: str  # low/medium/high
    estimated_time: str  # hours/days/weeks
    equipment_needed: List[str]
    data_to_feed_back: List[str]
    # Epistemics
    confidence: float
    evidence_type: str
    provenance: List[str]
    requires_validation: bool
    # Quality gate
    quality_score: int  # 0-6
    needs_more_context: bool
    missing_fields: List[str]
    is_spam: bool
    safety_check: bool


def _check_spam(hyp: Hypothesis) -> bool:
    """Check if hypothesis is spam (just restating constraint/failure without mechanism)."""
    text_lower = hyp.hypothesis_text.lower()
    prediction_lower = hyp.testable_prediction.lower()
    
    # Spam indicators: no mechanism mentioned, just restating problem
    spam_phrases = [
        "what if we could",
        "what if this could",
        "what if the constraint",
        "what if the failure",
        "maybe we should",
        "perhaps we could"
    ]
    
    # Check if hypothesis text lacks mechanism keywords
    mechanism_keywords = ["using", "by", "with", "via", "through", "mechanism", "approach", "technique"]
    has_mechanism = any(kw in text_lower for kw in mechanism_keywords)
    
    # Check if prediction is too vague
    vague_phrases = ["should improve", "should be better", "should work", "might help"]
    is_vague = any(vp in prediction_lower for vp in vague_phrases)
    
    return not has_mechanism or is_vague


def _safety_check(hyp: Hypothesis, exp_method: str, equipment: List[str]) -> bool:
    """Check if experiment has safety concerns."""
    text_lower = hyp.hypothesis_text.lower() + " " + hyp.falsification_test.lower()
    equipment_str = " ".join(equipment).lower()
    combined = text_lower + " " + equipment_str
    
    # Safety red flags
    unsafe_keywords = [
        "live tissue", "live animal", "human subject", "patient",
        "high voltage", ">1000v", ">1000 v",
        "pressurized", ">10 bar", ">10bar", "explosive",
        "toxic", "carcinogen", "radioactive", "radiation",
        "sharps", "projectile", "flying debris",
        "without ethics", "without approval", "without ppe"
    ]
    
    return not any(unsafe in combined for unsafe in unsafe_keywords)


def build_experiments(hypotheses: List[Hypothesis]) -> List[ExperimentCard]:
    """Build structured experiment cards from hypotheses with quality gate."""
    experiments = []
    
    for hyp in hypotheses:
        # Determine method based on hypothesis category
        if hyp.category.value == "uncertainty_collapse":
            method = "bench"
        elif "prototype" in hyp.falsification_test.lower() or "build" in hyp.falsification_test.lower():
            method = "bench"
        elif "simulate" in hyp.falsification_test.lower() or "model" in hyp.falsification_test.lower():
            method = "sim"
        else:
            method = "bench"  # Default to bench
        
        # Extract measurements from testable prediction
        measurements = []
        if "mass" in hyp.testable_prediction.lower():
            measurements.extend(["mass (kg)", "stiffness (N/m)", "strength (N)"])
        if "force" in hyp.testable_prediction.lower():
            measurements.extend(["applied force (N)", "grip force (N)", "slip threshold (N)"])
        if "temperature" in hyp.testable_prediction.lower() or "thermal" in hyp.testable_prediction.lower():
            measurements.extend(["temperature (°C)", "time (s)", "power (W)"])
        if "clearance" in hyp.testable_prediction.lower() or "gap" in hyp.testable_prediction.lower():
            measurements.extend(["clearance (mm)", "deployment ratio", "workspace (mm³)"])
        if "compliance" in hyp.testable_prediction.lower() or "stiffness" in hyp.testable_prediction.lower():
            measurements.extend(["force (N)", "displacement (mm)", "compliance (mm/N)"])
        if "friction" in hyp.testable_prediction.lower():
            measurements.extend(["normal force (N)", "tangential force (N)", "friction coefficient"])
        if "fatigue" in hyp.testable_prediction.lower():
            measurements.extend(["cycles to failure", "stress amplitude (MPa)", "strain (%)"])
        
        if not measurements:
            measurements = ["primary metric", "secondary metric", "baseline comparison"]
        
        # Determine equipment
        equipment = []
        if method == "bench":
            if "thermal" in hyp.testable_prediction.lower():
                equipment.extend(["thermal camera", "thermocouples", "power supply"])
            if "force" in hyp.testable_prediction.lower():
                equipment.extend(["force gauge", "load cell", "test fixture"])
            if "prototype" in hyp.falsification_test.lower():
                equipment.extend(["prototype", "test rig"])
            if "mass" in hyp.testable_prediction.lower():
                equipment.extend(["scale", "stiffness tester"])
            if not equipment:
                equipment = ["test fixture", "measurement equipment"]
        
        # Generate experiment name
        exp_name = f"Test: {hyp.hypothesis_text[:60]}..."
        if len(exp_name) > 80:
            exp_name = exp_name[:77] + "..."
        
        # Data to feed back
        data_feedback = []
        for m in measurements[:3]:  # Top 3 measurements
            metric_name = m.split("(")[0].strip().lower().replace(" ", "_")
            data_feedback.append(f"{metric_name}_measured")
        data_feedback.append("hypothesis_confirmed_or_falsified")
        
        # Quality gate checks
        isolates_single_variable = "and" not in hyp.testable_prediction.lower() or "while" not in hyp.testable_prediction.lower()
        has_measurable_outputs = len(measurements) > 0 and measurements[0] != "primary metric"
        has_falsification_criterion = bool(hyp.falsification_test.strip())
        has_equipment_list = len(equipment) > 0 and equipment[0] != "test fixture"
        has_cost_time_bracket = hyp.falsification_cost in ["low", "medium", "high"] and hyp.falsification_time in ["hours", "days", "weeks"]
        safety_check_passed = _safety_check(hyp, method, equipment)
        is_spam = _check_spam(hyp)
        
        quality_score = sum([
            isolates_single_variable,
            has_measurable_outputs,
            has_falsification_criterion,
            has_equipment_list,
            has_cost_time_bracket,
            safety_check_passed
        ])
        
        missing_fields = []
        if not isolates_single_variable:
            missing_fields.append("isolates_single_variable")
        if not has_measurable_outputs:
            missing_fields.append("has_measurable_outputs")
        if not has_falsification_criterion:
            missing_fields.append("has_falsification_criterion")
        if not has_equipment_list:
            missing_fields.append("has_equipment_list")
        if not has_cost_time_bracket:
            missing_fields.append("has_cost_time_bracket")
        if not safety_check_passed:
            missing_fields.append("safety_check")
        
        needs_more_context = quality_score < 6 or is_spam
        
        experiments.append(ExperimentCard(
            hypothesis_id=hyp.id,
            experiment_name=exp_name,
            objective=hyp.testable_prediction,
            method=method,
            measurements=measurements,
            success_criterion=f"Observe: {hyp.testable_prediction}",
            falsification_criterion=hyp.falsification_test,
            estimated_cost=hyp.falsification_cost,
            estimated_time=hyp.falsification_time,
            equipment_needed=equipment,
            data_to_feed_back=data_feedback,
            confidence=hyp.confidence,
            evidence_type=hyp.evidence_type,
            provenance=hyp.provenance,
            requires_validation=hyp.requires_validation,
            quality_score=quality_score,
            needs_more_context=needs_more_context,
            missing_fields=missing_fields,
            is_spam=is_spam,
            safety_check=safety_check_passed
        ))
    
    return experiments
