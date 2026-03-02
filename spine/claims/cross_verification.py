"""Cross-project claim and artifact verification"""
from typing import Dict, List, Any, Optional
from contracts.integration_contracts import SpineArtifact, ArtifactType
from dataclasses import dataclass

@dataclass
class CrossProjectClaim:
    """Claim that spans multiple project artifacts"""
    id: str
    statement: str
    supporting_artifacts: List[str]  # Artifact IDs
    verification_method: str
    confidence_level: str
    cross_references: List[str]  # References between artifacts

class CrossProjectVerifier:
    """Verify claims across multiple project artifacts"""
    
    def __init__(self):
        self.verification_registry = {}
        self.consistency_checkers = {}
        
    def verify_cross_project_consistency(self, artifacts: List[SpineArtifact]) -> Dict[str, Any]:
        """Verify consistency across project boundaries"""
        
        consistency_results = {
            "overall_consistent": True,
            "individual_checks": {},
            "conflicts": [],
            "warnings": []
        }
        
        # Check semantic consistency
        semantic_check = self._verify_semantic_consistency(artifacts)
        consistency_results["individual_checks"]["semantic"] = semantic_check
        
        # Check formal consistency (where applicable)
        formal_check = self._verify_formal_consistency(artifacts)
        consistency_results["individual_checks"]["formal"] = formal_check
        
        # Check governance consistency
        governance_check = self._verify_governance_consistency(artifacts)
        consistency_results["individual_checks"]["governance"] = governance_check
        
        # Update overall status
        consistency_results["overall_consistent"] = all([
            semantic_check["consistent"],
            formal_check["consistent"],
            governance_check["consistent"]
        ])
        
        return consistency_results
    
    def _verify_semantic_consistency(self, artifacts: List[SpineArtifact]) -> Dict[str, Any]:
        """Check semantic consistency between artifacts"""
        
        # Extract semantic elements from each artifact
        semantic_elements = {}
        for artifact in artifacts:
            elements = self._extract_semantic_elements(artifact)
            semantic_elements[artifact.id] = elements
        
        # Check for conflicts
        conflicts = []
        for artifact1_id, elements1 in semantic_elements.items():
            for artifact2_id, elements2 in semantic_elements.items():
                if artifact1_id >= artifact2_id:  # Avoid duplicate comparisons
                    continue
                    
                conflict = self._find_semantic_conflicts(elements1, elements2)
                if conflict:
                    conflicts.append({
                        "artifact1": artifact1_id,
                        "artifact2": artifact2_id,
                        "conflict": conflict
                    })
        
        return {
            "consistent": len(conflicts) == 0,
            "conflicts": conflicts,
            "semantic_elements": semantic_elements
        }
    
    def _verify_formal_consistency(self, artifacts: List[SpineArtifact]) -> Dict[str, Any]:
        """Check formal logical consistency between artifacts"""
        
        # Extract formal constraints/rules from artifacts
        formal_rules = {}
        for artifact in artifacts:
            rules = self._extract_formal_rules(artifact)
            formal_rules[artifact.id] = rules
        
        # Check for logical conflicts using formal verification
        logical_conflicts = []
        
        # This would integrate with Constraint Universe for formal checking
        # For now, implement basic conflict detection
        all_rules = []
        for artifact_id, rules in formal_rules.items():
            for rule in rules:
                all_rules.append((artifact_id, rule))
        
        # Check for direct contradictions
        for i, (aid1, rule1) in enumerate(all_rules):
            for j, (aid2, rule2) in enumerate(all_rules):
                if i >= j:
                    continue
                    
                if self._rules_contradict(rule1, rule2):
                    logical_conflicts.append({
                        "artifact1": aid1,
                        "artifact2": aid2,
                        "rule1": rule1,
                        "rule2": rule2,
                        "contradiction_type": "direct"
                    })
        
        return {
            "consistent": len(logical_conflicts) == 0,
            "conflicts": logical_conflicts,
            "formal_rules": formal_rules
        }
    
    def _verify_governance_consistency(self, artifacts: List[SpineArtifact]) -> Dict[str, Any]:
        """Check governance consistency across artifacts"""
        governance_approaches = {}
        
        for artifact in artifacts:
            approach = artifact.metadata.get("governance_approach", "unknown")
            governance_approaches[artifact.id] = approach
        
        # Check for conflicts
        approaches = list(governance_approaches.values())
        conflicts = []
        
        if len(set(approaches)) > 1:
            # Multiple approaches - check if compatible
            conflict_pairs = [
                ("autonomous", "human_controlled"),
                ("optimization", "non_authoritative")
            ]
            
            for i, (aid1, app1) in enumerate(governance_approaches.items()):
                for j, (aid2, app2) in enumerate(governance_approaches.items()):
                    if i >= j:
                        continue
                    
                    for conflict1, conflict2 in conflict_pairs:
                        if (conflict1 in app1.lower() and conflict2 in app2.lower()) or \
                           (conflict2 in app1.lower() and conflict1 in app2.lower()):
                            conflicts.append({
                                "artifact1": aid1,
                                "artifact2": aid2,
                                "conflict": f"{app1} vs {app2}"
                            })
        
        return {
            "consistent": len(conflicts) == 0,
            "conflicts": conflicts,
            "governance_approaches": governance_approaches
        }
    
    def _extract_semantic_elements(self, artifact: SpineArtifact) -> Dict[str, Any]:
        """Extract semantic elements from artifact for consistency checking"""
        elements = {
            "concepts": [],
            "relationships": [],
            "assumptions": [],
            "constraints": []
        }
        
        # Extract based on artifact type
        if artifact.type == ArtifactType.CANONICAL_REPRESENTATION:
            # Extract from OPLAS canonical graph
            if "nodes" in artifact.canonical_data:
                elements["concepts"] = list(artifact.canonical_data["nodes"].keys())
            if "edges" in artifact.canonical_data:
                elements["relationships"] = artifact.canonical_data["edges"]
                
        elif artifact.type == ArtifactType.ASSUMPTION_GRAPH:
            # Extract from Orientation Lab assumptions
            if "assumptions" in artifact.canonical_data:
                elements["assumptions"] = artifact.canonical_data["assumptions"]
                
        elif artifact.type == ArtifactType.CONSTRAINT_MODEL:
            # Extract from Constraint Universe
            if "constraints" in artifact.canonical_data:
                elements["constraints"] = artifact.canonical_data["constraints"]
        
        return elements
    
    def _extract_formal_rules(self, artifact: SpineArtifact) -> List[str]:
        """Extract formal rules/constraints from artifact"""
        rules = []
        
        if artifact.type == ArtifactType.CONSTRAINT_MODEL:
            # Extract constraint rules
            if "constraints" in artifact.canonical_data:
                constraints = artifact.canonical_data["constraints"]
                if isinstance(constraints, list):
                    rules.extend([str(c) for c in constraints])
        
        return rules
    
    def _find_semantic_conflicts(self, elements1: Dict[str, Any], elements2: Dict[str, Any]) -> Optional[str]:
        """Find semantic conflicts between two element sets"""
        # Check for conflicting concepts
        concepts1 = set(elements1.get("concepts", []))
        concepts2 = set(elements2.get("concepts", []))
        
        # Simple conflict detection - concepts that contradict
        # This would be enhanced with domain knowledge
        if concepts1 and concepts2:
            # Check for explicit contradictions (simplified)
            contradiction_pairs = [
                ("possible", "impossible"),
                ("true", "false"),
                ("required", "forbidden")
            ]
            
            for concept1 in concepts1:
                for concept2 in concepts2:
                    for neg1, neg2 in contradiction_pairs:
                        if neg1 in concept1.lower() and neg2 in concept2.lower():
                            return f"Concept conflict: {concept1} vs {concept2}"
        
        return None
    
    def _rules_contradict(self, rule1: str, rule2: str) -> bool:
        """Check if two rules contradict each other"""
        # Simple contradiction detection
        rule1_lower = rule1.lower()
        rule2_lower = rule2.lower()
        
        contradiction_pairs = [
            ("requires", "forbids"),
            ("must", "cannot"),
            ("always", "never"),
            ("true", "false")
        ]
        
        for neg1, neg2 in contradiction_pairs:
            if (neg1 in rule1_lower and neg2 in rule2_lower) or \
               (neg2 in rule1_lower and neg1 in rule2_lower):
                return True
        
        return False
