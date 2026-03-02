"""Decision trace graph for tracking reasoning chains."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
import hashlib
import json


@dataclass
class TraceNode:
    """Node in the decision trace graph."""
    id: str
    node_type: str  # "input", "constraint", "inference", "output"
    content: Any
    timestamp: datetime = field(default_factory=datetime.utcnow)
    parents: List[str] = field(default_factory=list)  # IDs of parent nodes
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "type": self.node_type,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "parents": self.parents,
            "metadata": self.metadata
        }


class DecisionTraceGraph:
    """Graph structure for tracking decision reasoning chains."""
    
    def __init__(self):
        self.nodes: Dict[str, TraceNode] = {}
        self.run_id: str = self._generate_run_id()
    
    def _generate_run_id(self) -> str:
        """Generate unique run ID."""
        return hashlib.sha256(str(datetime.utcnow()).encode()).hexdigest()[:12]
    
    def add_node(self, node_type: str, content: Any, parents: List[str] = None, metadata: Dict = None) -> str:
        """
        Add a node to the trace graph.
        
        Args:
            node_type: Type of node ("input", "constraint", "inference", "output")
            content: Content of the node (can be any serializable type)
            parents: List of parent node IDs
            metadata: Optional metadata dictionary
            
        Returns:
            Node ID
        """
        node_id = f"{node_type}_{len(self.nodes):04d}"
        self.nodes[node_id] = TraceNode(
            id=node_id,
            node_type=node_type,
            content=content,
            parents=parents or [],
            metadata=metadata or {}
        )
        return node_id
    
    def get_reasoning_chain(self, output_id: str) -> List[TraceNode]:
        """
        Walk back from output to all contributing inputs.
        
        Args:
            output_id: ID of the output node
            
        Returns:
            List of nodes in reasoning chain (from inputs to output)
        """
        chain = []
        visited = set()
        
        def walk(node_id):
            if node_id in visited or node_id not in self.nodes:
                return
            visited.add(node_id)
            node = self.nodes[node_id]
            chain.append(node)
            for parent_id in node.parents:
                walk(parent_id)
        
        walk(output_id)
        return list(reversed(chain))
    
    def to_dict(self) -> Dict:
        """Convert trace graph to dictionary for serialization."""
        return {
            "run_id": self.run_id,
            "timestamp": datetime.utcnow().isoformat(),
            "nodes": {k: v.to_dict() for k, v in self.nodes.items()}
        }
    
    def to_json(self) -> str:
        """Export trace graph as JSON string."""
        return json.dumps(self.to_dict(), indent=2, default=str)
    
    def explain(self, output_id: str) -> str:
        """
        Generate human-readable explanation of reasoning chain.
        
        Args:
            output_id: ID of the output node to explain
            
        Returns:
            Human-readable explanation string
        """
        chain = self.get_reasoning_chain(output_id)
        if not chain:
            return f"No reasoning chain found for {output_id}"
        
        lines = [f"Reasoning chain for {output_id}:"]
        for i, node in enumerate(chain, 1):
            content_str = str(node.content)
            if len(content_str) > 80:
                content_str = content_str[:77] + "..."
            lines.append(f"  {i}. [{node.node_type}] {content_str}")
        return "\n".join(lines)
    
    def get_output_nodes(self) -> List[TraceNode]:
        """Get all output nodes in the graph."""
        return [node for node in self.nodes.values() if node.node_type == "output"]
