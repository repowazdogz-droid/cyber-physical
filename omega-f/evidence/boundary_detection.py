"""Governance boundary identification"""
from typing import Dict, List, Any
from core.types import SystemSpecification, GovernanceEvidence

class BoundaryDetector:
    """Detects governance boundaries"""
    
    def detect_boundaries(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Detect and analyze system boundaries"""
        evidence_list = []
        
        # Analyze deployment scope
        scope_evidence = GovernanceEvidence(
            evidence_type="boundary_analysis",
            source="boundary_detector",
            description="Analysis of system deployment boundaries",
            findings=[
                f"Deployment scope: {system_spec.deployment_scope}",
                f"Boundary clarity: {'clear' if system_spec.deployment_scope else 'undefined'}"
            ],
            supporting_data={
                "deployment_scope": system_spec.deployment_scope,
                "has_explicit_boundaries": bool(system_spec.deployment_scope)
            },
            confidence_level="high",
            collection_method="specification_analysis"
        )
        evidence_list.append(scope_evidence)
        
        # Check for boundary enforcement mechanisms
        boundary_mechanisms = [
            m for m in system_spec.control_mechanisms
            if "boundary" in m.lower() or "scope" in m.lower() or "limit" in m.lower()
        ]
        
        if boundary_mechanisms:
            enforcement_evidence = GovernanceEvidence(
                evidence_type="boundary_enforcement",
                source="boundary_detector",
                description="Analysis of boundary enforcement mechanisms",
                findings=[
                    f"Boundary enforcement mechanisms: {len(boundary_mechanisms)}",
                    f"Mechanisms: {', '.join(boundary_mechanisms)}"
                ],
                supporting_data={"mechanisms": boundary_mechanisms},
                confidence_level="medium",
                collection_method="specification_analysis"
            )
            evidence_list.append(enforcement_evidence)
        
        return evidence_list
