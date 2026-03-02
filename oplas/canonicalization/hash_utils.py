"""Deterministic hashing utilities"""
import hashlib
import json
from typing import Any, Dict

def compute_deterministic_hash(obj: Any) -> str:
    """Compute deterministic hash of any object"""
    # Convert to JSON with sorted keys
    json_str = json.dumps(obj, sort_keys=True, default=str)
    
    # Compute SHA-256 hash
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()

def hash_graph(nodes: Dict[str, Any], edges: list, constraints: list) -> str:
    """Compute hash of graph structure"""
    # Sort nodes by ID
    sorted_nodes = dict(sorted(nodes.items()))
    
    # Sort edges deterministically
    sorted_edges = sorted(edges, key=lambda e: (
        e.get('source', ''),
        e.get('target', ''),
        e.get('type', '')
    ))
    
    # Sort constraints
    sorted_constraints = sorted(constraints)
    
    graph_structure = {
        "nodes": sorted_nodes,
        "edges": sorted_edges,
        "constraints": sorted_constraints
    }
    
    return compute_deterministic_hash(graph_structure)
