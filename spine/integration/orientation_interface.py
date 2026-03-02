"""Orientation Lab integration interface"""
from typing import Dict, List, Any
from contracts.integration_contracts import SpineArtifact, ArtifactType, SpineContract, IntegrationStatus
from datetime import datetime, timezone

class OrientationLabInterface(SpineContract):
    """Spine contract implementation for Orientation Lab"""
    
    def get_system_id(self) -> str:
        return "orientation_lab"
    
    def get_supported_artifact_types(self) -> List[ArtifactType]:
        return [
            ArtifactType.ASSUMPTION_GRAPH
        ]
    
    def produce_artifact(self, request: Dict[str, Any]) -> SpineArtifact:
        """Produce Orientation Lab artifact"""
        assumption_data = request.get("assumption_graph", {})
        
        artifact = SpineArtifact(
            id=f"orientation_{datetime.utcnow().isoformat()}",
            type=ArtifactType.ASSUMPTION_GRAPH,
            version="1.0",
            source_system="orientation_lab",
            target_systems=request.get("target_systems", []),
            canonical_data=assumption_data,
            metadata={
                "requires_human_approval": True,
                "autonomous_actions": False,
                "scope": request.get("scope", "orientation_analysis"),
                "limitations": request.get("limitations", []),
                "resource_limits": request.get("resource_limits", {}),
                "replay_data": request.get("replay_data", {"replayable": True}),
                "governance_approach": "non_authoritative",
                "human_decision_points": request.get("decision_points", ["model_interpretation"]),
                "autonomous_goal_setting": False
            },
            provenance={
                "created_by": "orientation_lab",
                "request": request
            },
            content_hash="",
            verification_proofs=[],
            conversion_hints={},
            compatibility_matrix={},
            created_at=datetime.now(timezone.utc)
        )
        
        artifact.content_hash = artifact._compute_content_hash()
        
        return artifact
    
    def consume_artifact(self, artifact: SpineArtifact) -> Dict[str, Any]:
        """Consume artifact for orientation analysis"""
        return {
            "analyzed": True,
            "artifact_id": artifact.id,
            "assumption_data": artifact.canonical_data
        }
    
    def verify_artifact_compatibility(self, artifact: SpineArtifact) -> IntegrationStatus:
        """Check compatibility with Orientation Lab"""
        if artifact.type not in self.get_supported_artifact_types():
            return IntegrationStatus.INCOMPATIBLE
        
        if artifact.version != "1.0":
            return IntegrationStatus.REQUIRES_CONVERSION
        
        if not artifact.verify_integrity():
            return IntegrationStatus.VERIFICATION_FAILED
        
        return IntegrationStatus.COMPATIBLE
