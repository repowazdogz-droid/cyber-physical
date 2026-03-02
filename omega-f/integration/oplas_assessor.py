"""Governance assessment for OPLAS systems"""
from typing import Dict, List, Any
from core.types import SystemSpecification, SystemType, GovernabilityStatus, GovernanceDetermination
from assessment.protocol import AssessmentProtocol

class OPLASGovernanceAssessor:
    """Assess governance of OPLAS-based systems"""
    
    def __init__(self):
        self.protocol = AssessmentProtocol()
        
    def assess_oplas_system(self, oplas_config: Dict[str, Any]) -> Dict[str, Any]:
        """Assess governance of OPLAS system configuration"""
        
        # Convert OPLAS config to system specification
        system_spec = self._oplas_to_system_spec(oplas_config)
        
        # Run governance assessment
        determination = self.protocol.assess_system_governance(system_spec)
        
        # Generate OPLAS-specific recommendations
        oplas_recommendations = self._generate_oplas_recommendations(
            determination, oplas_config
        )
        
        return {
            "determination": determination,
            "oplas_specific_findings": self._extract_oplas_findings(determination),
            "recommendations": oplas_recommendations,
            "compliance_status": self._assess_omega_compliance(determination)
        }
    
    def _oplas_to_system_spec(self, oplas_config: Dict[str, Any]) -> SystemSpecification:
        """Convert OPLAS configuration to governance assessment format"""
        
        system_spec = SystemSpecification(
            name=oplas_config.get("system_name", "OPLAS System"),
            description=oplas_config.get("description", "OPLAS-based abstraction system"),
            system_type=SystemType.AI_SYSTEM
        )
        
        # Extract autonomous components
        system_spec.autonomous_components = oplas_config.get("autonomous_components", [])
        
        # OPLAS should have no learned models in parse path
        if oplas_config.get("learned_models_in_parse_path", False):
            system_spec.autonomous_components.append("learned_parser")
        
        # Extract human oversight points
        system_spec.human_oversight_points = oplas_config.get("human_oversight_points", [
            "task_specification",
            "result_verification", 
            "concept_validation"
        ])
        
        # OPLAS decision authority structure
        system_spec.decision_authority_structure = {
            "task_definition": "human",
            "execution_approach": "oplas_with_human_verification",
            "result_acceptance": "human",
            "concept_reuse": "human"
        }
        
        # Deployment characteristics
        system_spec.deployment_scope = oplas_config.get("deployment_scope", "bounded_tasks")
        system_spec.stakeholder_impact = oplas_config.get("stakeholder_impact", [
            "intellectual_work_assistance",
            "decision_support_artifact_generation"
        ])
        
        # Reversibility characteristics (OPLAS should be highly reversible)
        system_spec.reversibility_characteristics = {
            "artifact_generation": True,
            "concept_card_creation": True, 
            "execution_replay": True,
            "human_override": True
        }
        
        # Information visibility (OPLAS should provide full visibility)
        system_spec.information_visibility = {
            "parsing_process": "full",
            "canonicalization": "full",
            "execution_trace": "full",
            "verification_results": "full",
            "artifact_provenance": "full"
        }
        
        # Control mechanisms
        system_spec.control_mechanisms = oplas_config.get("control_mechanisms", [
            "deterministic_parsing",
            "verification_gates",
            "human_approval_points",
            "replay_capability",
            "artifact_immutability"
        ])
        
        return system_spec
    
    def _generate_oplas_recommendations(self,
                                      determination: GovernanceDetermination,
                                      oplas_config: Dict[str, Any]) -> List[str]:
        """Generate OPLAS-specific governance recommendations"""
        recommendations = []
        
        if determination.status == GovernabilityStatus.NOT_GOVERNABLE:
            # Critical issues specific to OPLAS
            for violation in determination.violations:
                if violation.violation_type.value == "information_asymmetry":
                    recommendations.append(
                        "Ensure complete visibility into parsing and canonicalization processes"
                    )
                elif violation.violation_type.value == "delegated_agency_without_halt":
                    recommendations.append(
                        "Implement human approval gates before any autonomous execution"
                    )
                    
        elif determination.status == GovernabilityStatus.CONDITIONALLY_GOVERNABLE:
            recommendations.append("Maintain deterministic parsing without learned models")
            recommendations.append("Ensure all executions are replayable with audit trails")
            recommendations.append("Implement verification at each pipeline stage")
            
        else:  # Governable
            recommendations.append("Current OPLAS configuration meets governance standards")
            recommendations.append("Continue deterministic approach with human sovereignty")
            
        return recommendations
    
    def _extract_oplas_findings(self, determination: GovernanceDetermination) -> Dict[str, Any]:
        """Extract OPLAS-specific findings from determination"""
        return {
            "deterministic_compliance": all(
                "deterministic" in e.description.lower() 
                for e in determination.evidence 
                if "system_structure" in e.evidence_type
            ),
            "human_sovereignty": len(determination.system_specification.human_oversight_points) > 0,
            "reversibility_score": sum(
                determination.system_specification.reversibility_characteristics.values()
            ) / len(determination.system_specification.reversibility_characteristics) if determination.system_specification.reversibility_characteristics else 1.0
        }
    
    def _assess_omega_compliance(self, determination: GovernanceDetermination) -> Dict[str, Any]:
        """Assess compliance with Omega principles"""
        
        compliance = {
            "deterministic": True,  # OPLAS is deterministic by design
            "bounded": True,        # OPLAS operates within explicit bounds
            "non_autonomous": True, # OPLAS requires human oversight
            "human_sovereignty": True,  # Humans control all decisions
            "overall_compliant": determination.status in [
                GovernabilityStatus.GOVERNABLE,
                GovernabilityStatus.CONDITIONALLY_GOVERNABLE
            ]
        }
        
        # Check for violations that would break Omega compliance
        for violation in determination.violations:
            if violation.severity == "critical":
                if "autonomy" in violation.description.lower():
                    compliance["non_autonomous"] = False
                if "human" in violation.description.lower():
                    compliance["human_sovereignty"] = False
                    
        compliance["overall_compliant"] = all([
            compliance["deterministic"],
            compliance["bounded"],
            compliance["non_autonomous"],
            compliance["human_sovereignty"]
        ])
        
        return compliance
