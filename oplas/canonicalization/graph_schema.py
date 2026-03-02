"""Canonical graph structure definitions"""
from typing import Dict, Any
from core.types import NodeType, EdgeType

# Schema validation rules
SCHEMA_RULES = {
    "max_nodes": 1000,
    "max_edges": 5000,
    "max_constraints": 100,
    "required_node_fields": ["id", "type", "properties"],
    "required_edge_fields": ["source", "target", "type"]
}

def validate_graph_schema(nodes: Dict[str, Any], edges: List[Any], constraints: List[str]) -> tuple[bool, List[str]]:
    """Validate graph against schema"""
    errors = []
    
    # Check node count
    if len(nodes) > SCHEMA_RULES["max_nodes"]:
        errors.append(f"Too many nodes: {len(nodes)} > {SCHEMA_RULES['max_nodes']}")
    
    # Check edge count
    if len(edges) > SCHEMA_RULES["max_edges"]:
        errors.append(f"Too many edges: {len(edges)} > {SCHEMA_RULES['max_edges']}")
    
    # Check constraint count
    if len(constraints) > SCHEMA_RULES["max_constraints"]:
        errors.append(f"Too many constraints: {len(constraints)} > {SCHEMA_RULES['max_constraints']}")
    
    # Validate node structure
    for node_id, node in nodes.items():
        if not isinstance(node, dict):
            errors.append(f"Node {node_id} is not a dict")
            continue
        
        for field in SCHEMA_RULES["required_node_fields"]:
            if field not in node:
                errors.append(f"Node {node_id} missing required field: {field}")
    
    # Validate edge structure
    for i, edge in enumerate(edges):
        if not isinstance(edge, dict):
            errors.append(f"Edge {i} is not a dict")
            continue
        
        for field in SCHEMA_RULES["required_edge_fields"]:
            if field not in edge:
                errors.append(f"Edge {i} missing required field: {field}")
    
    return len(errors) == 0, errors
