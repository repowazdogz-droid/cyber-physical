"""Governance assessment for Orientation Lab systems"""
from typing import Dict, List, Any
from core.types import SystemSpecification, SystemType, GovernabilityStatus, GovernanceDetermination
from assessment.protocol import AssessmentProtocol

class OrientationLabGovernanceAssessor:
    """Assess governance of Orientation Lab systems"""
    
    def __init__(self):
        self.protocol = AssessmentProtocol()
    
    def assess_orientation_system(self, orientation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Assess governance of Orientation Lab system"""
        
        system_spec = self._orientation_to_system_spec(orientation_config)
        determination = self.protocol.assess_system_governance(system_spec)
        
        return {
            "determination": determination,
            "orientation_specific_findings": self._extract_orientation_findings(determination),
            "recommendations": self._generate_orientation_recommendations(determination)
        }
    
    def _orientation_to_system_spec(self, orientation_config: Dict[str, Any]) -> SystemSpecification:
        """Convert Orientation Lab config to system specification"""
        
        system_spec = SystemSpecification(
            name=orientation_config.get("system_name", "Orientation Lab System"),
            description=orientation_config.get("description", "Orientation and alignment system"),
            system_type=SystemType.DECISION_SUPPORT
        )
        
        system_spec.human_oversight_points = orientation_config.get("human_oversight_points", [
            "orientation_definition",
            "alignment_verification"
        ])
        
        system_spec.decision_authority_structure = {
            "orientation_setting": "human",
            "alignment_assessment": "human_with_assistance"
        }
        
        system_spec.deployment_scope = orientation_config.get("deployment_scope", "bounded_orientation_tasks")
        system_spec.stakeholder_impact = orientation_config.get("stakeholder_impact", [
            "decision_support",
            "alignment_guidance"
        ])
        
        system_spec.control_mechanisms = orientation_config.get("control_mechanisms", [
            "human_approval_gates",
            "alignment_verification",
            "audit_trail"
        ])
        
        system_spec.information_visibility = {
            "orientation_process": "full",
            "alignment_assessment": "full"
        }
        
        return system_spec
    
    def _extract_orientation_findings(self, determination: GovernanceDetermination) -> Dict[str, Any]:
        """Extract Orientation Lab-specific findings"""
        return {
            "human_control": len(determination.system_specification.human_oversight_points) > 0,
            "alignment_visibility": "full" in str(determination.system_specification.information_visibility.values())
        }
    
    def _generate_orientation_recommendations(self, determination: GovernanceDetermination) -> List[str]:
        """Generate Orientation Lab-specific recommendations"""
        recommendations = []
        
        if determination.status == GovernabilityStatus.NOT_GOVERNABLE:
            recommendations.append("Ensure human control over orientation decisions")
            recommendations.append("Maintain full visibility into alignment processes")
        
        return recommendations
