"""Assessment parameters and configuration"""
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class AssessmentConfig:
    """Configuration for governance assessments"""
    
    # Violation severity thresholds
    critical_violation_threshold: int = 1
    high_violation_threshold: int = 2
    
    # Evidence requirements
    minimum_evidence_count: int = 3
    high_confidence_threshold: float = 0.8
    medium_confidence_threshold: float = 0.5
    
    # Assessment parameters
    require_mitigation_analysis: bool = True
    require_risk_assessment: bool = True
    require_precedent_analysis: bool = False
    
    # Public release settings
    auto_release_determinations: bool = False
    release_delay_days: int = 0
    
    # Integration settings
    enable_oplas_integration: bool = True
    enable_constraint_universe_integration: bool = True
    enable_orientation_lab_integration: bool = True
    enable_spine_integration: bool = True

# Default configuration instance
default_config = AssessmentConfig()
