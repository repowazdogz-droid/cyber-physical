"""Convert typed requests to canonical graphs"""
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))
from core.types import TypedRequest, CanonicalGraph, Node, Edge, NodeType, EdgeType

class Canonicalizer:
    """Deterministic canonicalization engine"""
    
    def __init__(self):
        self.concept_registry = self._build_concept_registry()
        
    def canonicalize(self, request: TypedRequest) -> CanonicalGraph:
        """Convert request to canonical graph representation"""
        
        # 1. Extract core concepts
        concepts = self._extract_concepts(request)
        
        # 2. Create canonical nodes with deterministic IDs
        nodes = self._create_canonical_nodes(concepts)
        
        # 3. Infer relationships based on rules
        edges = self._infer_relationships(nodes, request)
        
        # 4. Apply domain constraints
        constraints = self._apply_domain_constraints(nodes, edges, request)
        
        # 5. Build metadata
        metadata = {
            "intent": request.intent.value,
            "entity_count": len(request.entities),
            "constraint_count": len(constraints)
        }
        
        return CanonicalGraph(
            nodes=nodes,
            edges=edges,
            constraints=constraints,
            metadata=metadata
        )
    
    def _extract_concepts(self, request: TypedRequest) -> List[str]:
        """Extract core concepts from request"""
        concepts = set()
        
        # Add entities as concepts
        for entity_type, entity_value in request.entities.items():
            if isinstance(entity_value, str):
                concepts.add(entity_value)
            elif isinstance(entity_value, list):
                concepts.update(entity_value)
        
        # Add intent-specific concepts
        intent_concepts = self._get_intent_concepts(request.intent)
        concepts.update(intent_concepts)
        
        return sorted(list(concepts))  # Deterministic ordering
    
    def _create_canonical_nodes(self, concepts: List[str]) -> Dict[str, Node]:
        """Create canonical nodes with deterministic IDs"""
        nodes = {}
        
        for i, concept in enumerate(concepts):
            # Deterministic ID based on concept and position
            node_id = f"node_{i}_{self._normalize_concept(concept)}"
            
            # Determine node type based on concept
            node_type = self._classify_concept_type(concept)
            
            # Build properties
            properties = {
                "concept": concept,
                "canonical_name": self._normalize_concept(concept),
                "index": i
            }
            
            nodes[node_id] = Node(
                id=node_id,
                type=node_type,
                properties=properties
            )
        
        return nodes
    
    def _infer_relationships(self, nodes: Dict[str, Node], request: TypedRequest) -> List[Edge]:
        """Infer relationships based on explicit rules"""
        edges = []
        node_list = list(nodes.values())
        
        # Rule-based relationship inference
        for i, node1 in enumerate(node_list):
            for j, node2 in enumerate(node_list):
                if i >= j:  # Avoid duplicates and self-loops
                    continue
                
                # Check for relationship patterns
                relationship = self._check_relationship(node1, node2, request)
                if relationship:
                    edges.append(Edge(
                        source=node1.id,
                        target=node2.id,
                        type=relationship,
                        properties={}
                    ))
        
        return edges
    
    def _normalize_concept(self, concept: str) -> str:
        """Normalize concept name deterministically"""
        return re.sub(r'[^a-zA-Z0-9]', '_', concept.lower())
    
    def _classify_concept_type(self, concept: str) -> NodeType:
        """Classify concept type based on rules"""
        concept_lower = concept.lower()
        
        if any(word in concept_lower for word in ['data', 'dataset', 'table', 'file']):
            return NodeType.DATA
        elif any(word in concept_lower for word in ['analyze', 'transform', 'process', 'compute']):
            return NodeType.OPERATION
        elif any(word in concept_lower for word in ['must', 'should', 'limit', 'constraint']):
            return NodeType.CONSTRAINT
        else:
            return NodeType.CONCEPT
    
    def _check_relationship(self, node1: Node, node2: Node, request: TypedRequest) -> Optional[EdgeType]:
        """Check if two nodes have a relationship"""
        # Rule-based relationship detection
        
        if node1.type == NodeType.OPERATION and node2.type == NodeType.DATA:
            return EdgeType.REQUIRES
        elif node1.type == NodeType.DATA and node2.type == NodeType.OPERATION:
            return EdgeType.PRODUCES
        elif node1.type == NodeType.CONSTRAINT:
            return EdgeType.CONSTRAINS
            
        return None
    
    def _get_intent_concepts(self, intent) -> List[str]:
        """Get concepts associated with intent"""
        intent_map = {
            "data_analysis": ["data", "analysis", "pattern"],
            "code_generation": ["code", "function", "program"],
            "model_building": ["model", "schema", "structure"],
            "transformation": ["transform", "convert", "reformat"],
            "query": ["question", "information"]
        }
        return intent_map.get(intent.value, [])
    
    def _apply_domain_constraints(self, nodes: Dict[str, Node], edges: List[Edge], request: TypedRequest) -> List[str]:
        """Apply domain-specific constraints"""
        constraints = []
        
        # Add explicit constraints from request
        constraints.extend(request.constraints)
        
        # Add structural constraints
        if len(nodes) == 0:
            constraints.append("graph_must_have_at_least_one_node")
        
        # Add intent-specific constraints
        if request.intent.value == "data_analysis" and not any(n.type == NodeType.DATA for n in nodes.values()):
            constraints.append("data_analysis_requires_data_node")
        
        return sorted(constraints)
    
    def _build_concept_registry(self) -> Dict[str, Dict]:
        """Build registry of known concepts"""
        return {
            "data_types": ["dataset", "table", "file", "database", "csv", "json"],
            "operations": ["analyze", "transform", "summarize", "group", "filter", "sort"],
            "constraints": ["time_limit", "accuracy", "size_limit", "format"]
        }
