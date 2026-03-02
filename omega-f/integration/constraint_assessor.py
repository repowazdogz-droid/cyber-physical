"""Governance assessment for Constraint Universe systems"""
from typing import Dict, List, Any
from core.types import SystemSpecification, SystemType, GovernabilityStatus, GovernanceDetermination
from assessment.protocol import AssessmentProtocol

class ConstraintUniverseGovernanceAssessor:
    """Assess governance of Constraint Universe systems"""
    
    def __init__(self):
        self.protocol = AssessmentProtocol()
    
    def assess_constraint_system(self, constraint_config: Dict[str, Any]) -> Dict[str, Any]:
        """Assess governance of Constraint Universe system"""
        
        system_spec = self._constraint_to_system_spec(constraint_config)
        determination = self.protocol.assess_system_governance(system_spec)
        
        return {
            "determination": determination,
            "constraint_specific_findings": self._extract_constraint_findings(determination),
            "recommendations": self._generate_constraint_recommendations(determination)
        }
    
    def _constraint_to_system_spec(self, constraint_config: Dict[str, Any]) -> SystemSpecification:
        """Convert Constraint Universe config to system specification"""
        
        system_spec = SystemSpecification(
            name=constraint_config.get("system_name", "Constraint Universe System"),
            description=constraint_config.get("description", "Constraint-based system"),
            system_type=SystemType.INFRASTRUCTURE
        )
        
        system_spec.deployment_scope = constraint_config.get("deployment_scope", "bounded_constraints")
        system_spec.stakeholder_impact = constraint_config.get("stakeholder_impact", [
            "constraint_validation",
            "system_boundary_enforcement"
        ])
        
        system_spec.control_mechanisms = constraint_config.get("control_mechanisms", [
            "constraint_enforcement",
            "boundary_validation",
            "violation_detection"
        ])
        
        system_spec.information_visibility = {
            "constraint_evaluation": "full",
            "violation_detection": "full",
            "boundary_enforcement": "full"
        }
        
        return system_spec
    
    def _extract_constraint_findings(self, determination: GovernanceDetermination) -> Dict[str, Any]:
        """Extract Constraint Universe-specific findings"""
        return {
            "boundary_enforcement": "boundary" in str(determination.system_specification.control_mechanisms).lower(),
            "constraint_visibility": all(
                v in ["full", "partial"] 
                for v in determination.system_specification.information_visibility.values()
            )
        }
    
    def _generate_constraint_recommendations(self, determination: GovernanceDetermination) -> List[str]:
        """Generate Constraint Universe-specific recommendations"""
        recommendations = []
        
        if determination.status == GovernabilityStatus.NOT_GOVERNABLE:
            recommendations.append("Ensure all constraints are visible and auditable")
            recommendations.append("Implement boundary enforcement mechanisms")
        
        return recommendations
