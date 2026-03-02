"""Hypothesis generation engine for Forge."""

from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from spine.runtime.schemas import DecisionAnalysis, FailureMode, Contradiction, Unknown, FormalConstraintResult


class HypothesisCategory(str, Enum):
    CONSTRAINT_RELAXATION = "constraint_relaxation"
    FAILURE_ELIMINATION = "failure_elimination"
    CONTRADICTION_RESOLUTION = "contradiction_resolution"
    UNCERTAINTY_COLLAPSE = "uncertainty_collapse"


@dataclass
class Hypothesis:
    id: str
    hypothesis_text: str
    category: HypothesisCategory
    testable_prediction: str
    falsification_test: str
    falsification_cost: str  # low/medium/high
    falsification_time: str  # hours/days/weeks
    confidence: float  # 0.0-1.0
    adjacent_domains: List[str]
    assumptions_challenged: List[str]
    # Epistemics
    evidence_type: str  # rule_based, literature_hint, adjacency_transfer
    provenance: List[str]  # Spine signals that triggered this
    requires_validation: bool


def generate_hypotheses(spine_output: DecisionAnalysis, domain: str = "surgical_robotics") -> List[Hypothesis]:
    """Generate invention hypotheses from Spine analysis output."""
    hypotheses = []
    hypothesis_id = 1
    
    # Constraint boundary hypotheses
    for constraint in spine_output.formal_constraints:
        if constraint.result == "proven_violated":
            # Generate relaxation hypothesis
            constraint_name = constraint.constraint_name.lower()
            
            if "mass" in constraint_name or "weight" in constraint_name:
                hypotheses.append(Hypothesis(
                    id=f"h{hypothesis_id:03d}",
                    hypothesis_text=f"Constraint relaxation: What if mass limit could be relaxed by using lightweight materials (CFRP, titanium foam) or distributed actuation?",
                    category=HypothesisCategory.CONSTRAINT_RELAXATION,
                    testable_prediction="If we use CFRP structure, mass should reduce by 40-60% while maintaining stiffness",
                    falsification_test="Build CFRP prototype, measure mass and stiffness, compare to baseline",
                    falsification_cost="medium",
                    falsification_time="weeks",
                    confidence=0.7,
                    adjacent_domains=["aerospace", "automotive"],
                    assumptions_challenged=["mass must scale with strength", "metal is required for durability"],
                    evidence_type="adjacency_transfer",
                    provenance=[f"constraint:{constraint.constraint_id}"],
                    requires_validation=True
                ))
                hypothesis_id += 1
            
            elif "force" in constraint_name or "load" in constraint_name:
                hypotheses.append(Hypothesis(
                    id=f"h{hypothesis_id:03d}",
                    hypothesis_text=f"Constraint relaxation: What if force requirement could be reduced by leveraging tissue compliance or adaptive gripping?",
                    category=HypothesisCategory.CONSTRAINT_RELAXATION,
                    testable_prediction="If we use compliant gripper that adapts to tissue shape, required force should drop by 30-50%",
                    falsification_test="Test compliant vs rigid gripper on tissue phantom, measure force required for secure grip",
                    falsification_cost="low",
                    falsification_time="days",
                    confidence=0.75,
                    adjacent_domains=["soft_robotics", "biomimetics"],
                    assumptions_challenged=["rigid grippers are necessary", "force must overcome compliance"],
                    evidence_type="adjacency_transfer",
                    provenance=[f"constraint:{constraint.constraint_id}"],
                    requires_validation=True
                ))
                hypothesis_id += 1
            
            elif "clearance" in constraint_name or "gap" in constraint_name:
                hypotheses.append(Hypothesis(
                    id=f"h{hypothesis_id:03d}",
                    hypothesis_text=f"Constraint relaxation: What if clearance requirement could be reduced by active shape adaptation or deployable structures?",
                    category=HypothesisCategory.CONSTRAINT_RELAXATION,
                    testable_prediction="If we use origami-inspired deployable structure, clearance can be reduced by 50% during insertion, expanded during operation",
                    falsification_test="Build deployable prototype, measure clearance in collapsed vs expanded states",
                    falsification_cost="medium",
                    falsification_time="weeks",
                    confidence=0.65,
                    adjacent_domains=["origami_engineering", "deployable_structures"],
                    assumptions_challenged=["clearance must be constant", "rigid structures are required"],
                    evidence_type="adjacency_transfer",
                    provenance=[f"constraint:{constraint.constraint_id}"],
                    requires_validation=True
                ))
                hypothesis_id += 1
            
            elif "thermal" in constraint_name or "temperature" in constraint_name:
                hypotheses.append(Hypothesis(
                    id=f"h{hypothesis_id:03d}",
                    hypothesis_text=f"Constraint relaxation: What if thermal limit could be raised by phase-change cooling or heat pipes?",
                    category=HypothesisCategory.CONSTRAINT_RELAXATION,
                    testable_prediction="If we integrate heat pipes, peak temperature should drop by 20-30°C under same load",
                    falsification_test="Add heat pipes to prototype, run thermal test, measure temperature profile",
                    falsification_cost="medium",
                    falsification_time="weeks",
                    confidence=0.7,
                    adjacent_domains=["electronics_cooling", "thermal_management"],
                    assumptions_challenged=["convection cooling is sufficient", "thermal mass limits performance"],
                    evidence_type="adjacency_transfer",
                    provenance=[f"constraint:{constraint.constraint_id}"],
                    requires_validation=True
                ))
                hypothesis_id += 1
    
    # Failure elimination hypotheses
    for failure in spine_output.failure_modes:
        failure_mode = failure.mode.lower()
        
        if "slip" in failure_mode:
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Failure elimination: What mechanism would eliminate slip failures entirely? Gecko-inspired directional adhesion or shape-locking?",
                category=HypothesisCategory.FAILURE_ELIMINATION,
                testable_prediction="If we use gecko-inspired directional adhesion, slip should be eliminated even at low normal force",
                falsification_test="Build gecko-adhesive gripper, test slip threshold vs normal force, compare to friction-based",
                falsification_cost="medium",
                falsification_time="weeks",
                confidence=0.7,
                adjacent_domains=["gecko_adhesion", "biomimetics"],
                assumptions_challenged=["friction is the only grip mechanism", "normal force must exceed tangential"],
                evidence_type="adjacency_transfer",
                provenance=[f"failure_mode:{failure.mode}"],
                requires_validation=True
            ))
            hypothesis_id += 1
        
        elif "fatigue" in failure_mode or "wear" in failure_mode:
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Failure elimination: What if fatigue could be eliminated by using shape memory alloys that self-heal or redistribute stress?",
                category=HypothesisCategory.FAILURE_ELIMINATION,
                testable_prediction="If we use SMA with stress-induced phase transformation, fatigue life should increase by 10x",
                falsification_test="Fatigue test SMA vs conventional material, measure cycles to failure",
                falsification_cost="high",
                falsification_time="weeks",
                confidence=0.6,
                adjacent_domains=["shape_memory_alloys", "smart_materials"],
                assumptions_challenged=["fatigue is inevitable", "materials degrade linearly"],
                evidence_type="adjacency_transfer",
                provenance=[f"failure_mode:{failure.mode}"],
                requires_validation=True
            ))
            hypothesis_id += 1
        
        elif "thermal" in failure_mode or "overheat" in failure_mode:
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Failure elimination: What if thermal failures could be eliminated by fluidic actuation that dissipates heat inherently?",
                category=HypothesisCategory.FAILURE_ELIMINATION,
                testable_prediction="If we use fluidic actuation, heat generation should drop by 60-80% vs electric motors",
                falsification_test="Compare thermal profiles of fluidic vs electric actuator under same load",
                falsification_cost="medium",
                falsification_time="weeks",
                confidence=0.75,
                adjacent_domains=["fluidic_actuation", "soft_robotics"],
                assumptions_challenged=["electric actuation is necessary", "heat generation is unavoidable"],
                evidence_type="adjacency_transfer",
                provenance=[f"failure_mode:{failure.mode}"],
                requires_validation=True
            ))
            hypothesis_id += 1
    
    # Contradiction resolution hypotheses
    for contradiction in spine_output.contradictions:
        desc = contradiction.description.lower()
        
        if "force" in desc and ("grip" in desc or "gentle" in desc):
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Contradiction resolution: What approach resolves force vs gentle manipulation? Variable stiffness or force-controlled compliance?",
                category=HypothesisCategory.CONTRADICTION_RESOLUTION,
                testable_prediction="If we use variable stiffness actuator, we can apply high force when needed, low force when gentle manipulation required",
                falsification_test="Build variable stiffness prototype, test force range and gentle manipulation capability",
                falsification_cost="medium",
                falsification_time="weeks",
                confidence=0.8,
                adjacent_domains=["variable_stiffness", "compliant_robotics"],
                assumptions_challenged=["stiffness must be constant", "force and gentleness are mutually exclusive"],
                evidence_type="rule_based",
                provenance=[f"contradiction:{contradiction.description[:50]}"],
                requires_validation=True
            ))
            hypothesis_id += 1
        
        elif "size" in desc and ("reach" in desc or "access" in desc):
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Contradiction resolution: What if deployable structures resolve size vs reach? Collapse for access, expand for operation?",
                category=HypothesisCategory.CONTRADICTION_RESOLUTION,
                testable_prediction="If we use origami-inspired deployable structure, insertion size can be 50% smaller while maintaining operational reach",
                falsification_test="Build deployable prototype, measure insertion diameter vs operational workspace",
                falsification_cost="medium",
                falsification_time="weeks",
                confidence=0.7,
                adjacent_domains=["origami_engineering", "deployable_structures"],
                assumptions_challenged=["size and reach scale together", "rigid structures are required"],
                evidence_type="adjacency_transfer",
                provenance=[f"contradiction:{contradiction.description[:50]}"],
                requires_validation=True
            ))
            hypothesis_id += 1
    
    # Uncertainty collapse hypotheses
    for unknown in spine_output.unknowns:
        item = unknown.item.lower()
        
        if "compliance" in item or "stiffness" in item:
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Uncertainty collapse: What measurement would collapse tissue compliance uncertainty? Force-displacement curve or indentation modulus?",
                category=HypothesisCategory.UNCERTAINTY_COLLAPSE,
                testable_prediction="If we measure force-displacement curve on representative tissue, compliance uncertainty should reduce from ±50% to ±10%",
                falsification_test="Measure force-displacement curves on 10+ tissue samples, compute statistics",
                falsification_cost="low",
                falsification_time="days",
                confidence=0.9,
                adjacent_domains=["biomechanics", "tissue_characterization"],
                assumptions_challenged=["tissue properties are unknowable", "compliance is too variable"],
                evidence_type="rule_based",
                provenance=[f"unknown:{unknown.item}"],
                requires_validation=False
            ))
            hypothesis_id += 1
        
        elif "friction" in item or "adhesion" in item:
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Uncertainty collapse: What measurement would collapse friction uncertainty? Slip threshold test or coefficient measurement?",
                category=HypothesisCategory.UNCERTAINTY_COLLAPSE,
                testable_prediction="If we measure slip threshold on representative surfaces, friction uncertainty should reduce from ±40% to ±15%",
                falsification_test="Measure slip threshold on 5+ representative surfaces, compute friction coefficient distribution",
                falsification_cost="low",
                falsification_time="hours",
                confidence=0.85,
                adjacent_domains=["tribology", "surface_science"],
                assumptions_challenged=["friction is too variable to measure", "surfaces are too diverse"],
                evidence_type="rule_based",
                provenance=[f"unknown:{unknown.item}"],
                requires_validation=False
            ))
            hypothesis_id += 1
        
        elif "thermal" in item or "temperature" in item:
            hypotheses.append(Hypothesis(
                id=f"h{hypothesis_id:03d}",
                hypothesis_text=f"Uncertainty collapse: What measurement would collapse thermal uncertainty? Temperature time-series or thermal imaging?",
                category=HypothesisCategory.UNCERTAINTY_COLLAPSE,
                testable_prediction="If we measure temperature time-series during operation, thermal uncertainty should reduce from ±20°C to ±5°C",
                falsification_test="Run thermal test with thermocouples, measure temperature profile over time",
                falsification_cost="low",
                falsification_time="days",
                confidence=0.8,
                adjacent_domains=["thermal_measurement", "thermography"],
                assumptions_challenged=["thermal behavior is unpredictable", "steady-state assumptions hold"],
                evidence_type="rule_based",
                provenance=[f"unknown:{unknown.item}"],
                requires_validation=False
            ))
            hypothesis_id += 1
    
    return hypotheses
