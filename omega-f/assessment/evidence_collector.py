"""Evidence collection system"""
from typing import List, Dict, Any
from core.types import SystemSpecification, GovernanceEvidence
from assessment.analyzer import SystemAnalyzer

class EvidenceCollector:
    """Collects evidence for governance assessment"""
    
    def __init__(self):
        self.analyzer = SystemAnalyzer()
    
    def analyze_system_structure(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Collect evidence about system structure"""
        structure_analysis = self.analyzer.analyze_structure(system_spec)
        
        evidence = GovernanceEvidence(
            evidence_type="system_structure",
            source="system_analyzer",
            description="Analysis of system structural characteristics",
            findings=[
                f"Autonomy level: {structure_analysis['autonomy_level']}",
                f"Control density: {structure_analysis['control_density']:.2f}",
                f"Information coverage: {structure_analysis['information_coverage']:.2f}",
                f"Human integration: {structure_analysis['human_integration']:.2f}",
                f"Boundary clarity: {structure_analysis['boundary_clarity']}"
            ],
            supporting_data=structure_analysis,
            confidence_level="high",
            collection_method="automated_analysis",
            analysis_approach="structural_characterization"
        )
        
        return [evidence]
    
    def analyze_information_flow(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Collect evidence about information flow and visibility"""
        evidence_list = []
        
        # Analyze visibility for each autonomous component
        for component in system_spec.autonomous_components:
            visibility = system_spec.information_visibility.get(component, "none")
            
            evidence = GovernanceEvidence(
                evidence_type="information_flow",
                source=f"component_analysis:{component}",
                description=f"Information visibility for {component}",
                findings=[
                    f"Component: {component}",
                    f"Visibility level: {visibility}",
                    f"Has feedback loops: {len(system_spec.feedback_loops) > 0}"
                ],
                supporting_data={
                    "component": component,
                    "visibility": visibility,
                    "feedback_loops": system_spec.feedback_loops
                },
                confidence_level="high" if visibility != "none" else "medium",
                collection_method="specification_analysis",
                analysis_approach="information_flow_mapping"
            )
            evidence_list.append(evidence)
        
        if not evidence_list:
            # No autonomous components - create general evidence
            evidence = GovernanceEvidence(
                evidence_type="information_flow",
                source="system_analysis",
                description="System has no autonomous components requiring visibility",
                findings=["No autonomous components detected"],
                confidence_level="high",
                collection_method="specification_analysis"
            )
            evidence_list.append(evidence)
        
        return evidence_list
    
    def analyze_control_mechanisms(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Collect evidence about control mechanisms"""
        control_analysis = {
            "mechanism_count": len(system_spec.control_mechanisms),
            "mechanisms": system_spec.control_mechanisms,
            "has_halt": any("halt" in m.lower() or "stop" in m.lower() for m in system_spec.control_mechanisms),
            "has_approval": any("approval" in m.lower() or "gate" in m.lower() for m in system_spec.control_mechanisms),
            "has_audit": any("audit" in m.lower() or "log" in m.lower() for m in system_spec.control_mechanisms)
        }
        
        evidence = GovernanceEvidence(
            evidence_type="control_mechanism",
            source="control_analysis",
            description="Analysis of system control mechanisms",
            findings=[
                f"Total control mechanisms: {control_analysis['mechanism_count']}",
                f"Has halt authority: {control_analysis['has_halt']}",
                f"Has approval gates: {control_analysis['has_approval']}",
                f"Has audit capability: {control_analysis['has_audit']}"
            ],
            supporting_data=control_analysis,
            confidence_level="high",
            collection_method="specification_analysis",
            analysis_approach="control_mechanism_inventory"
        )
        
        return [evidence]
    
    def analyze_risk_factors(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Collect evidence about risk factors"""
        risk_profile = self.analyzer.analyze_risk_profile(system_spec)
        
        evidence = GovernanceEvidence(
            evidence_type="risk_assessment",
            source="risk_analyzer",
            description="Analysis of system risk factors",
            findings=[
                f"Irreversibility score: {risk_profile['irreversibility_score']:.2f}",
                f"Impact scope: {risk_profile['impact_scope']}",
                f"Failure modes: {risk_profile['failure_mode_severity']['failure_mode_count']}",
                f"Control adequacy: {risk_profile['control_adequacy']:.2f}"
            ],
            supporting_data=risk_profile,
            confidence_level="medium",
            collection_method="risk_analysis",
            analysis_approach="risk_factor_characterization",
            limitations=[
                "Risk assessment based on specification only",
                "May not capture all operational risks"
            ]
        )
        
        return [evidence]
