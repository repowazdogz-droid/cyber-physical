"""System analysis engine"""
from typing import Dict, List, Any
from core.types import SystemSpecification, SystemType

class SystemAnalyzer:
    """Analyzes system structure and characteristics"""
    
    def analyze_structure(self, system_spec: SystemSpecification) -> Dict[str, Any]:
        """Analyze system structural characteristics"""
        return {
            "autonomy_level": self._assess_autonomy_level(system_spec),
            "control_density": self._assess_control_density(system_spec),
            "information_coverage": self._assess_information_coverage(system_spec),
            "human_integration": self._assess_human_integration(system_spec),
            "boundary_clarity": self._assess_boundary_clarity(system_spec)
        }
    
    def analyze_risk_profile(self, system_spec: SystemSpecification) -> Dict[str, Any]:
        """Analyze system risk profile"""
        return {
            "irreversibility_score": self._calculate_irreversibility_score(system_spec),
            "impact_scope": self._assess_impact_scope(system_spec),
            "failure_mode_severity": self._assess_failure_modes(system_spec),
            "control_adequacy": self._assess_control_adequacy(system_spec)
        }
    
    def _assess_autonomy_level(self, system_spec: SystemSpecification) -> str:
        """Assess level of system autonomy"""
        if not system_spec.autonomous_components:
            return "none"
        
        autonomous_count = len(system_spec.autonomous_components)
        oversight_count = len(system_spec.human_oversight_points)
        
        if autonomous_count == 0:
            return "none"
        elif oversight_count >= autonomous_count:
            return "low"
        elif oversight_count > 0:
            return "medium"
        else:
            return "high"
    
    def _assess_control_density(self, system_spec: SystemSpecification) -> float:
        """Assess density of control mechanisms"""
        if not system_spec.autonomous_components:
            return 1.0  # No autonomy = full control
        
        control_count = len(system_spec.control_mechanisms)
        component_count = len(system_spec.autonomous_components)
        
        if component_count == 0:
            return 1.0
        
        return min(1.0, control_count / component_count)
    
    def _assess_information_coverage(self, system_spec: SystemSpecification) -> float:
        """Assess coverage of information visibility"""
        if not system_spec.autonomous_components:
            return 1.0
        
        visible_count = sum(
            1 for component in system_spec.autonomous_components
            if system_spec.information_visibility.get(component, "none") in ["full", "partial"]
        )
        
        return visible_count / len(system_spec.autonomous_components) if system_spec.autonomous_components else 1.0
    
    def _assess_human_integration(self, system_spec: SystemSpecification) -> float:
        """Assess level of human integration"""
        oversight_points = len(system_spec.human_oversight_points)
        human_decisions = sum(
            1 for authority in system_spec.decision_authority_structure.values()
            if "human" in authority.lower()
        )
        
        total_decisions = len(system_spec.decision_authority_structure) or 1
        
        return min(1.0, (oversight_points + human_decisions) / (total_decisions + 1))
    
    def _assess_boundary_clarity(self, system_spec: SystemSpecification) -> str:
        """Assess clarity of system boundaries"""
        unbounded = ["unrestricted", "open_ended", "general_purpose", ""]
        
        if system_spec.deployment_scope in unbounded:
            return "unclear"
        elif system_spec.deployment_scope:
            return "clear"
        else:
            return "undefined"
    
    def _calculate_irreversibility_score(self, system_spec: SystemSpecification) -> float:
        """Calculate score for irreversibility"""
        if not system_spec.reversibility_characteristics:
            return 0.5  # Unknown = medium risk
        
        irreversible_count = sum(
            1 for reversible in system_spec.reversibility_characteristics.values()
            if not reversible
        )
        
        total = len(system_spec.reversibility_characteristics) or 1
        return irreversible_count / total
    
    def _assess_impact_scope(self, system_spec: SystemSpecification) -> str:
        """Assess scope of potential impact"""
        high_impact = [
            "real_world_actions",
            "irreversible_decisions",
            "safety_critical",
            "financial_impact"
        ]
        
        if any(impact in system_spec.stakeholder_impact for impact in high_impact):
            return "high"
        elif system_spec.stakeholder_impact:
            return "medium"
        else:
            return "low"
    
    def _assess_failure_modes(self, system_spec: SystemSpecification) -> Dict[str, Any]:
        """Assess failure mode characteristics"""
        return {
            "failure_mode_count": len(system_spec.failure_modes),
            "harm_count": len(system_spec.potential_harms),
            "has_safety_critical": "safety" in str(system_spec.potential_harms).lower()
        }
    
    def _assess_control_adequacy(self, system_spec: SystemSpecification) -> float:
        """Assess adequacy of control mechanisms"""
        control_count = len(system_spec.control_mechanisms)
        risk_factors = (
            len(system_spec.potential_harms) +
            len(system_spec.failure_modes) +
            len(system_spec.autonomous_components)
        )
        
        if risk_factors == 0:
            return 1.0
        
        return min(1.0, control_count / risk_factors)
