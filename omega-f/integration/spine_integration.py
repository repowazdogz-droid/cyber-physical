"""Spine contract implementation for governance assessment"""
from typing import Dict, List, Any, Optional
from core.types import SystemSpecification, SystemType, GovernanceDetermination
from assessment.protocol import AssessmentProtocol

class SpineGovernanceIntegration:
    """Integration with Spine contract system"""
    
    def __init__(self):
        self.protocol = AssessmentProtocol()
    
    def assess_spine_contract(self, contract_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Assess governance of Spine contract"""
        
        system_spec = self._spine_to_system_spec(contract_spec)
        determination = self.protocol.assess_system_governance(system_spec)
        
        return {
            "determination": determination,
            "spine_compliance": self._check_spine_compliance(determination, contract_spec),
            "recommendations": self._generate_spine_recommendations(determination)
        }
    
    def _spine_to_system_spec(self, contract_spec: Dict[str, Any]) -> SystemSpecification:
        """Convert Spine contract to system specification"""
        
        system_spec = SystemSpecification(
            name=contract_spec.get("contract_name", "Spine Contract"),
            description=contract_spec.get("description", "Spine contract specification"),
            system_type=SystemType.INFRASTRUCTURE
        )
        
        # Spine contracts should have explicit boundaries
        system_spec.deployment_scope = contract_spec.get("scope", "contractual_boundaries")
        
        # Extract contract characteristics
        system_spec.stakeholder_impact = contract_spec.get("stakeholder_impact", [
            "contractual_obligations",
            "interface_compliance"
        ])
        
        # Spine contracts should be deterministic and verifiable
        system_spec.control_mechanisms = contract_spec.get("control_mechanisms", [
            "contract_verification",
            "interface_validation",
            "compliance_checking"
        ])
        
        system_spec.information_visibility = {
            "contract_terms": "full",
            "compliance_status": "full",
            "violation_detection": "full"
        }
        
        system_spec.reversibility_characteristics = {
            "contract_modification": True,
            "compliance_remediation": True
        }
        
        return system_spec
    
    def _check_spine_compliance(self, 
                               determination: GovernanceDetermination,
                               contract_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Check Spine contract compliance"""
        return {
            "governable": determination.status.value in ["governable", "conditionally_governable"],
            "has_boundaries": determination.system_specification.deployment_scope != "",
            "deterministic": "deterministic" in str(determination.system_specification.control_mechanisms).lower(),
            "verifiable": "verification" in str(determination.system_specification.control_mechanisms).lower()
        }
    
    def _generate_spine_recommendations(self, determination: GovernanceDetermination) -> List[str]:
        """Generate Spine-specific recommendations"""
        recommendations = []
        
        if determination.status.value == "not_governable":
            recommendations.append("Ensure contract boundaries are explicit and enforceable")
            recommendations.append("Implement contract verification mechanisms")
        
        return recommendations
