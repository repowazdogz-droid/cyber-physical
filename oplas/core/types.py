"""Core type definitions for OPLAS"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Set
from enum import Enum
import hashlib
import json
import re

class IntentType(Enum):
    DATA_ANALYSIS = "data_analysis"
    CODE_GENERATION = "code_generation"
    MODEL_BUILDING = "model_building"
    TRANSFORMATION = "transformation"
    QUERY = "query"

class NodeType(Enum):
    CONCEPT = "concept"
    DATA = "data"
    OPERATION = "operation"
    CONSTRAINT = "constraint"
    RESULT = "result"

class EdgeType(Enum):
    REQUIRES = "requires"
    PRODUCES = "produces"
    TRANSFORMS = "transforms"
    CONSTRAINS = "constrains"

@dataclass
class TypedRequest:
    """Deterministically parsed request"""
    intent: IntentType
    entities: Dict[str, Any]
    constraints: List[str]
    raw_text: str
    parse_metadata: Dict[str, Any]
    
    def __hash__(self):
        # Deterministic hash based on content
        content = {
            "intent": self.intent.value,
            "entities": sorted(self.entities.items()),
            "constraints": sorted(self.constraints),
            "raw_text": self.raw_text
        }
        return hash(json.dumps(content, sort_keys=True))

@dataclass
class Node:
    id: str
    type: NodeType
    properties: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        # Ensure deterministic property ordering
        self.properties = dict(sorted(self.properties.items()))

@dataclass  
class Edge:
    source: str
    target: str
    type: EdgeType
    properties: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        self.properties = dict(sorted(self.properties.items()))

@dataclass
class CanonicalGraph:
    """Deterministic canonical representation"""
    nodes: Dict[str, Node]
    edges: List[Edge]
    constraints: List[str]
    metadata: Dict[str, Any]
    hash: str = field(default="", init=False)
    
    def __post_init__(self):
        # Ensure canonical ordering
        self.nodes = dict(sorted(self.nodes.items()))
        self.edges.sort(key=lambda e: (e.source, e.target, e.type.value))
        self.constraints.sort()
        self.hash = self._compute_hash()
    
    def _compute_hash(self) -> str:
        """Compute deterministic hash of graph content"""
        content = {
            "nodes": {k: {"type": v.type.value, "properties": v.properties} 
                     for k, v in self.nodes.items()},
            "edges": [{"source": e.source, "target": e.target, 
                      "type": e.type.value, "properties": e.properties}
                     for e in self.edges],
            "constraints": self.constraints
        }
        return hashlib.sha256(
            json.dumps(content, sort_keys=True).encode()
        ).hexdigest()

@dataclass
class DSLProgram:
    """Executable DSL program"""
    operations: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    source_text: str
    
@dataclass
class ExecutionResult:
    """Result of program execution"""
    output: Any
    audit_trail: List[Dict[str, Any]]
    resources_used: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None

@dataclass
class VerificationReport:
    """Multi-tier verification results"""
    tier0_syntax: bool
    tier1_semantic: bool  
    tier2_invariant: bool
    proof_steps: List[str]
    violations: List[str]

@dataclass
class ExecutionArtifact:
    """Immutable execution artifact"""
    id: str
    timestamp: str
    request: TypedRequest
    canonical_graph: CanonicalGraph
    program: DSLProgram
    execution_result: ExecutionResult
    verification: VerificationReport
    provenance: Dict[str, Any]
