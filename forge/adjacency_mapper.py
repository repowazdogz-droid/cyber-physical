"""Adjacency mapper for technique transfer from adjacent domains."""

from dataclasses import dataclass
from typing import List


@dataclass
class Adjacency:
    source_domain: str
    target_application: str
    technique: str
    relevance_score: float  # 0-1
    reference_hint: str


# Hardcoded knowledge base of adjacency pairs
ADJACENCY_KNOWLEDGE_BASE = [
    Adjacency("soft_robotics", "surgical_gripping", "compliant actuation", 0.9, "Soft robotics grippers → gentle tissue manipulation"),
    Adjacency("microsurgery", "surgical_robotics", "precision positioning", 0.85, "Microsurgery techniques → scaled-up precision"),
    Adjacency("origami_engineering", "deployable_structures", "folded mechanisms", 0.8, "Origami → deployable surgical tools"),
    Adjacency("gecko_adhesion", "surgical_gripping", "directional adhesion", 0.75, "Gecko adhesion → slip-resistant grippers"),
    Adjacency("shape_memory_alloys", "adaptive_instruments", "phase transformation", 0.7, "SMA → adaptive surgical instruments"),
    Adjacency("fluidic_actuation", "gentle_manipulation", "pneumatic/hydraulic", 0.8, "Fluidic → low-force actuation"),
    Adjacency("biomimetics", "surgical_design", "nature-inspired mechanisms", 0.75, "Biomimetics → bio-inspired surgical tools"),
    Adjacency("tissue_engineering", "surgical_interfaces", "biocompatible materials", 0.7, "Tissue engineering → biocompatible interfaces"),
    Adjacency("haptic_feedback", "surgical_control", "force feedback", 0.8, "Haptics → surgical force control"),
    Adjacency("variable_stiffness", "compliant_robotics", "stiffness modulation", 0.75, "Variable stiffness → adaptive compliance"),
    Adjacency("magnetic_actuation", "wireless_surgery", "magnetic control", 0.65, "Magnetic → wireless surgical robots"),
    Adjacency("cable_driven", "minimally_invasive", "tendon actuation", 0.7, "Cable-driven → flexible surgical robots"),
    Adjacency("continuum_robotics", "endoscopic_access", "snake-like motion", 0.8, "Continuum → endoscopic navigation"),
    Adjacency("compliant_mechanisms", "surgical_instruments", "flexure-based", 0.7, "Compliant mechanisms → precise instruments"),
    Adjacency("jamming", "variable_stiffness", "granular jamming", 0.65, "Jamming → tunable stiffness"),
    Adjacency("dielectric_elastomer", "soft_actuation", "electroactive polymers", 0.6, "DEA → soft actuators"),
    Adjacency("magnetic_resonance", "surgical_guidance", "MRI compatibility", 0.7, "MRI compatibility → image-guided surgery"),
    Adjacency("ultrasound", "tissue_characterization", "acoustic properties", 0.65, "Ultrasound → tissue property measurement"),
    Adjacency("optical_coherence", "surgical_imaging", "OCT imaging", 0.6, "OCT → high-resolution imaging"),
    Adjacency("laser_ablation", "minimal_trauma", "precise cutting", 0.7, "Laser → precise tissue removal"),
]


def map_adjacencies(problem_description: str, constraints: List[str]) -> List[Adjacency]:
    """Map technique transfers from adjacent fields."""
    problem_lower = problem_description.lower()
    constraints_lower = " ".join(constraints).lower()
    combined_text = f"{problem_lower} {constraints_lower}"
    
    relevant_adjacencies = []
    
    # Match adjacencies based on keywords
    for adj in ADJACENCY_KNOWLEDGE_BASE:
        score = adj.relevance_score
        
        # Boost score if keywords match
        if "grip" in combined_text or "grasp" in combined_text:
            if "gripping" in adj.target_application or "adhesion" in adj.technique:
                score = min(1.0, score + 0.1)
        
        if "gentle" in combined_text or "soft" in combined_text:
            if "soft" in adj.source_domain or "gentle" in adj.target_application:
                score = min(1.0, score + 0.1)
        
        if "deploy" in combined_text or "insert" in combined_text:
            if "deployable" in adj.target_application or "origami" in adj.source_domain:
                score = min(1.0, score + 0.1)
        
        if "force" in combined_text or "load" in combined_text:
            if "fluidic" in adj.source_domain or "compliant" in adj.technique:
                score = min(1.0, score + 0.1)
        
        if "thermal" in combined_text or "temperature" in combined_text:
            if "fluidic" in adj.source_domain:
                score = min(1.0, score + 0.1)
        
        if "fatigue" in combined_text or "wear" in combined_text:
            if "shape_memory" in adj.source_domain:
                score = min(1.0, score + 0.1)
        
        if score >= 0.6:  # Threshold for relevance
            relevant_adjacencies.append(Adjacency(
                source_domain=adj.source_domain,
                target_application=adj.target_application,
                technique=adj.technique,
                relevance_score=score,
                reference_hint=adj.reference_hint
            ))
    
    # Sort by relevance score descending
    relevant_adjacencies.sort(key=lambda a: a.relevance_score, reverse=True)
    
    return relevant_adjacencies[:10]  # Return top 10
