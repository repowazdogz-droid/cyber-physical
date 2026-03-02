"""Enhanced contracts for cross-project integration"""
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import json
from datetime import datetime, timezone

class ArtifactType(Enum):
    CONSTRAINT_MODEL = "constraint_model"
    ASSUMPTION_GRAPH = "assumption_graph"
    CANONICAL_REPRESENTATION = "canonical_representation"
    EXECUTION_TRACE = "execution_trace"
    VERIFICATION_PROOF = "verification_proof"
    GOVERNANCE_DETERMINATION = "governance_determination"

class IntegrationStatus(Enum):
    COMPATIBLE = "compatible"
    INCOMPATIBLE = "incompatible"
    REQUIRES_CONVERSION = "requires_conversion"
    VERIFICATION_FAILED = "verification_failed"

@dataclass
class SpineArtifact:
    """Universal artifact format for Spine ecosystem"""
    id: str
    type: ArtifactType
    version: str
    source_system: str
    target_systems: List[str]
    
    # Core content
    canonical_data: Dict[str, Any]
    metadata: Dict[str, Any]
    provenance: Dict[str, Any]
    
    # Verification
    content_hash: str
    verification_proofs: List[Dict[str, Any]]
    
    # Integration support
    conversion_hints: Dict[str, Any]
    compatibility_matrix: Dict[str, IntegrationStatus]
    
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def verify_integrity(self) -> bool:
        """Verify artifact integrity"""
        computed_hash = self._compute_content_hash()
        return computed_hash == self.content_hash
    
    def _compute_content_hash(self) -> str:
        """Compute deterministic content hash"""
        content = {
            "type": self.type.value,
            "canonical_data": self.canonical_data,
            "source_system": self.source_system
        }
        return hashlib.sha256(
            json.dumps(content, sort_keys=True).encode()
        ).hexdigest()

class SpineContract(ABC):
    """Base contract for all Spine-integrated systems"""
    
    @abstractmethod
    def get_system_id(self) -> str:
        """Unique system identifier"""
        pass
    
    @abstractmethod
    def get_supported_artifact_types(self) -> List[ArtifactType]:
        """List of artifact types this system can produce/consume"""
        pass
    
    @abstractmethod
    def produce_artifact(self, request: Dict[str, Any]) -> SpineArtifact:
        """Produce artifact from request"""
        pass
    
    @abstractmethod
    def consume_artifact(self, artifact: SpineArtifact) -> Dict[str, Any]:
        """Consume artifact and return processed result"""
        pass
    
    @abstractmethod
    def verify_artifact_compatibility(self, artifact: SpineArtifact) -> IntegrationStatus:
        """Check if artifact is compatible with this system"""
        pass
