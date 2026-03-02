"""Uncertainty propagation for decision analysis."""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import re


class UncertaintyType(Enum):
    """Types of uncertainty representations."""
    RANGE = "range"           # min/max numeric bounds
    DISCRETE = "discrete"     # set of possible states
    CONFIDENCE = "confidence" # prior probability


@dataclass
class Uncertainty:
    """Structured uncertainty with propagation support."""
    id: str
    name: str
    uncertainty_type: UncertaintyType
    
    # For RANGE type
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    expected_value: Optional[float] = None
    unit: Optional[str] = None
    
    # For DISCRETE type
    states: List[str] = field(default_factory=list)
    state_probabilities: Dict[str, float] = field(default_factory=dict)
    
    # For CONFIDENCE type
    prior_confidence: float = 0.5
    
    # Dependencies
    affects: List[str] = field(default_factory=list)  # IDs of outputs this affects


@dataclass
class ConditionalConfidence:
    """Confidence band that varies with uncertainty."""
    base_confidence: float
    min_confidence: float
    max_confidence: float
    sensitivity: float  # 0-1, how much this output moves with uncertainty
    dependent_on: List[str] = field(default_factory=list)  # Uncertainty IDs


class UncertaintyPropagator:
    """Propagates uncertainty through analysis outputs."""
    
    def __init__(self):
        self.uncertainties: Dict[str, Uncertainty] = {}
        self.dependency_graph: Dict[str, List[str]] = {}  # output_id -> [uncertainty_ids]
    
    def register_uncertainty(self, uncertainty: Uncertainty) -> str:
        """
        Register an uncertainty for propagation.
        
        Args:
            uncertainty: Uncertainty object to register
            
        Returns:
            Uncertainty ID
        """
        self.uncertainties[uncertainty.id] = uncertainty
        return uncertainty.id
    
    def parse_uncertainty_string(self, raw: str) -> Uncertainty:
        """
        Parse uncertainty from case.yaml format into structured Uncertainty.
        
        Patterns:
        - "tissue_compliance: unknown_range" -> RANGE type
        - "sterilization_degradation: untested" -> CONFIDENCE type with low prior
        - "material_properties: {A, B, C}" -> DISCRETE type
        
        Args:
            raw: Raw uncertainty string from case input
            
        Returns:
            Structured Uncertainty object
        """
        # Extract name and value
        if ':' in raw:
            name, value = raw.split(':', 1)
            name = name.strip()
            value = value.strip()
        else:
            name = raw.strip()
            value = ""
        
        # Generate ID from name
        uncertainty_id = name.lower().replace(' ', '_').replace('-', '_')
        
        # Determine type based on value patterns
        value_lower = value.lower()
        
        # Check for range patterns
        if 'unknown_range' in value_lower or 'range' in value_lower or 'min' in value_lower or 'max' in value_lower:
            return Uncertainty(
                id=uncertainty_id,
                name=name,
                uncertainty_type=UncertaintyType.RANGE,
                min_value=None,
                max_value=None,
                expected_value=None
            )
        
        # Check for discrete states (e.g., "{A, B, C}" or "states: A, B")
        if '{' in value or 'states' in value_lower:
            states = []
            if '{' in value:
                # Extract from {A, B, C} format
                match = re.search(r'\{([^}]+)\}', value)
                if match:
                    states = [s.strip() for s in match.group(1).split(',')]
            elif 'states' in value_lower:
                # Extract from "states: A, B" format
                parts = value.split(':', 1)
                if len(parts) > 1:
                    states = [s.strip() for s in parts[1].split(',')]
            
            if states:
                return Uncertainty(
                    id=uncertainty_id,
                    name=name,
                    uncertainty_type=UncertaintyType.DISCRETE,
                    states=states,
                    state_probabilities={s: 1.0 / len(states) for s in states}
                )
        
        # Check for confidence/untested patterns
        if 'untested' in value_lower or 'unknown' in value_lower or 'uncertain' in value_lower:
            # Low prior confidence for untested/unknown
            prior = 0.3 if 'untested' in value_lower else 0.4
            return Uncertainty(
                id=uncertainty_id,
                name=name,
                uncertainty_type=UncertaintyType.CONFIDENCE,
                prior_confidence=prior
            )
        
        # Default to confidence type with medium prior
        return Uncertainty(
            id=uncertainty_id,
            name=name,
            uncertainty_type=UncertaintyType.CONFIDENCE,
            prior_confidence=0.5
        )
    
    def link_output_to_uncertainty(self, output_id: str, uncertainty_ids: List[str]):
        """
        Link an output to uncertainties it depends on.
        
        Args:
            output_id: ID of the output
            uncertainty_ids: List of uncertainty IDs this output depends on
        """
        self.dependency_graph[output_id] = uncertainty_ids
    
    def compute_conditional_confidence(
        self, 
        base_confidence: float, 
        uncertainty_ids: List[str]
    ) -> ConditionalConfidence:
        """
        Compute confidence band based on dependent uncertainties.
        
        Args:
            base_confidence: Base confidence level (0.0-1.0)
            uncertainty_ids: List of uncertainty IDs this output depends on
            
        Returns:
            ConditionalConfidence with confidence band
        """
        if not uncertainty_ids:
            return ConditionalConfidence(
                base_confidence=base_confidence,
                min_confidence=base_confidence,
                max_confidence=base_confidence,
                sensitivity=0.0,
                dependent_on=[]
            )
        
        # Calculate bounds based on uncertainty ranges
        total_uncertainty = 0.0
        for uid in uncertainty_ids:
            if uid in self.uncertainties:
                u = self.uncertainties[uid]
                if u.uncertainty_type == UncertaintyType.RANGE:
                    # Range uncertainty adds variance
                    total_uncertainty += 0.3
                elif u.uncertainty_type == UncertaintyType.CONFIDENCE:
                    # Low prior confidence adds more uncertainty
                    # Higher uncertainty when prior is far from 0.5
                    uncertainty_contribution = abs(u.prior_confidence - 0.5) * 0.8
                    total_uncertainty += uncertainty_contribution
                elif u.uncertainty_type == UncertaintyType.DISCRETE:
                    # Discrete states add moderate uncertainty
                    total_uncertainty += 0.2
        
        # Normalize sensitivity (cap at 1.0)
        sensitivity = min(1.0, total_uncertainty)
        
        # Compute confidence band
        # Higher sensitivity widens the band asymmetrically (more downward)
        band_width = sensitivity * 0.5
        min_conf = max(0.0, base_confidence - band_width)
        max_conf = min(1.0, base_confidence + band_width * 0.6)
        
        return ConditionalConfidence(
            base_confidence=base_confidence,
            min_confidence=min_conf,
            max_confidence=max_conf,
            sensitivity=sensitivity,
            dependent_on=uncertainty_ids
        )
    
    def to_dict(self) -> Dict:
        """
        Serialize for output.
        
        Returns:
            Dictionary representation of uncertainties and dependencies
        """
        return {
            "uncertainties": {
                uid: {
                    "id": u.id,
                    "name": u.name,
                    "type": u.uncertainty_type.value,
                    "min": u.min_value,
                    "max": u.max_value,
                    "expected": u.expected_value,
                    "unit": u.unit,
                    "states": u.states,
                    "prior_confidence": u.prior_confidence,
                    "affects": u.affects
                }
                for uid, u in self.uncertainties.items()
            },
            "dependency_graph": self.dependency_graph
        }
