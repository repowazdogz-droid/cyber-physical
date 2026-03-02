"""Historical precedent analysis"""
from typing import Dict, List, Any, Optional
from core.types import SystemSpecification, GovernanceEvidence, GovernanceDetermination

class PrecedentAnalyzer:
    """Analyzes historical governance precedents"""
    
    def __init__(self, precedent_store: Optional[Dict[str, GovernanceDetermination]] = None):
        self.precedent_store = precedent_store or {}
    
    def find_precedents(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Find relevant governance precedents"""
        evidence_list = []
        
        # Find similar systems by type
        similar_by_type = [
            d for d in self.precedent_store.values()
            if d.system_specification.system_type == system_spec.system_type
        ]
        
        if similar_by_type:
            precedent_evidence = GovernanceEvidence(
                evidence_type="precedent_analysis",
                source="precedent_analyzer",
                description="Analysis of similar system precedents",
                findings=[
                    f"Found {len(similar_by_type)} similar systems",
                    f"Governability outcomes: {[d.status.value for d in similar_by_type]}"
                ],
                supporting_data={
                    "precedent_count": len(similar_by_type),
                    "precedent_statuses": [d.status.value for d in similar_by_type]
                },
                confidence_level="low",
                collection_method="precedent_matching",
                limitations=["Precedent matching is approximate", "May not capture all relevant factors"]
            )
            evidence_list.append(precedent_evidence)
        
        return evidence_list
    
    def add_precedent(self, determination: GovernanceDetermination):
        """Add determination as precedent"""
        self.precedent_store[determination.id] = determination
