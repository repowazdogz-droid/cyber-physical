"""Risk factor analysis"""
from typing import Dict, List, Any
from core.types import SystemSpecification, GovernanceEvidence

class RiskAssessor:
    """Assesses risk factors for governance"""
    
    def assess_risks(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Assess system risk factors"""
        evidence_list = []
        
        # Assess potential harms
        if system_spec.potential_harms:
            harm_evidence = GovernanceEvidence(
                evidence_type="harm_analysis",
                source="risk_assessor",
                description="Analysis of potential harms",
                findings=[
                    f"Identified potential harms: {len(system_spec.potential_harms)}",
                    f"Harms: {', '.join(system_spec.potential_harms)}"
                ],
                supporting_data={"harms": system_spec.potential_harms},
                confidence_level="medium",
                collection_method="specification_analysis",
                limitations=["Based on specification only, may not capture all operational risks"]
            )
            evidence_list.append(harm_evidence)
        
        # Assess failure modes
        if system_spec.failure_modes:
            failure_evidence = GovernanceEvidence(
                evidence_type="failure_mode_analysis",
                source="risk_assessor",
                description="Analysis of failure modes",
                findings=[
                    f"Identified failure modes: {len(system_spec.failure_modes)}",
                    f"Failure modes: {', '.join(system_spec.failure_modes)}"
                ],
                supporting_data={"failure_modes": system_spec.failure_modes},
                confidence_level="medium",
                collection_method="specification_analysis"
            )
            evidence_list.append(failure_evidence)
        
        # Assess reversibility
        if system_spec.reversibility_characteristics:
            irreversible_count = sum(
                1 for reversible in system_spec.reversibility_characteristics.values()
                if not reversible
            )
            
            reversibility_evidence = GovernanceEvidence(
                evidence_type="reversibility_analysis",
                source="risk_assessor",
                description="Analysis of system reversibility",
                findings=[
                    f"Irreversible actions: {irreversible_count}",
                    f"Total actions analyzed: {len(system_spec.reversibility_characteristics)}"
                ],
                supporting_data=system_spec.reversibility_characteristics,
                confidence_level="high",
                collection_method="specification_analysis"
            )
            evidence_list.append(reversibility_evidence)
        
        return evidence_list
