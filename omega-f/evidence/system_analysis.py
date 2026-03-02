"""System structure analysis"""
from typing import Dict, List, Any
from core.types import SystemSpecification, GovernanceEvidence

class SystemStructureAnalyzer:
    """Analyzes system structural characteristics"""
    
    def analyze_architecture(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Analyze system architecture for governance implications"""
        evidence_list = []
        
        # Analyze component relationships
        component_evidence = GovernanceEvidence(
            evidence_type="architecture_analysis",
            source="system_structure_analyzer",
            description="Analysis of system component architecture",
            findings=[
                f"Total autonomous components: {len(system_spec.autonomous_components)}",
                f"Human oversight points: {len(system_spec.human_oversight_points)}",
                f"Control mechanisms: {len(system_spec.control_mechanisms)}"
            ],
            supporting_data={
                "autonomous_components": system_spec.autonomous_components,
                "oversight_points": system_spec.human_oversight_points,
                "control_mechanisms": system_spec.control_mechanisms
            },
            confidence_level="high",
            collection_method="specification_analysis"
        )
        evidence_list.append(component_evidence)
        
        # Analyze decision authority structure
        if system_spec.decision_authority_structure:
            authority_evidence = GovernanceEvidence(
                evidence_type="authority_analysis",
                source="system_structure_analyzer",
                description="Analysis of decision authority structure",
                findings=[
                    f"Decision points: {len(system_spec.decision_authority_structure)}",
                    f"Human-controlled decisions: {sum(1 for v in system_spec.decision_authority_structure.values() if 'human' in v.lower())}"
                ],
                supporting_data=system_spec.decision_authority_structure,
                confidence_level="high",
                collection_method="specification_analysis"
            )
            evidence_list.append(authority_evidence)
        
        return evidence_list
