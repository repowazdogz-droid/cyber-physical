"""Export constraint models to OPLAS artifact format"""
from typing import Dict, List
from core.types import ConstraintUniverse, ClassificationResult
import json
from datetime import datetime

# Import OPLAS types (assuming OPLAS is implemented)
try:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "oplas"))
    from core.types import CanonicalGraph, Node, Edge, NodeType, EdgeType
    OPLAS_AVAILABLE = True
except ImportError:
    OPLAS_AVAILABLE = False
    # Define stub types for development
    class CanonicalGraph:
        def __init__(self, nodes, edges, constraints, metadata):
            self.nodes = nodes
            self.edges = edges 
            self.constraints = constraints
            self.metadata = metadata
    
    class Node:
        def __init__(self, id, type, properties):
            self.id = id
            self.type = type
            self.properties = properties
    
    class Edge:
        def __init__(self, source, target, type, properties=None):
            self.source = source
            self.target = target
            self.type = type
            self.properties = properties or {}

class ConstraintUniverseExporter:
    """Export constraint universes as OPLAS artifacts"""
    
    def export_to_oplas(self,
                       universe: ConstraintUniverse,
                       classification_results: List[ClassificationResult]) -> Dict:
        """Export constraint universe as OPLAS-compatible artifact"""
        
        # Convert to canonical graph representation
        canonical_graph = self._to_canonical_graph(universe)
        
        # Generate constraint checking DSL program
        constraint_program = self._generate_constraint_dsl(universe)
        
        # Package verification proofs
        verification_data = self._package_proofs(classification_results)
        
        # Create OPLAS artifact
        artifact = {
            "type": "constraint_model",
            "version": "1.0",
            "canonical_representation": self._serialize_graph(canonical_graph),
            "executable_program": constraint_program,
            "verification_data": verification_data,
            "metadata": {
                "universe_name": universe.name,
                "variable_count": len(universe.variables),
                "constraint_count": len(universe.constraints),
                "classification_count": len(classification_results),
                "exported_at": datetime.utcnow().isoformat() + "Z"
            }
        }
        
        return artifact
    
    def _to_canonical_graph(self, universe: ConstraintUniverse) -> CanonicalGraph:
        """Convert constraint universe to OPLAS canonical graph"""
        nodes = {}
        edges = []
        
        # Create nodes for variables
        for var in universe.variables:
            node_id = f"var_{var.name}"
            nodes[node_id] = Node(
                id=node_id,
                type="variable",
                properties={
                    "variable_name": var.name,
                    "domain": str(var.domain),
                    "type": var.type,
                    "description": var.description
                }
            )
        
        # Create nodes for constraints
        for constraint in universe.constraints:
            node_id = f"constraint_{constraint.id}"
            nodes[node_id] = Node(
                id=node_id,
                type="constraint",
                properties={
                    "constraint_id": constraint.id,
                    "description": constraint.description,
                    "human_readable": constraint.to_human_readable()
                }
            )
            
            # Create edges from constraint to variables it affects
            # Simplified: connect to all variables (would need constraint introspection)
            for var in universe.variables:
                edge = Edge(
                    source=node_id,
                    target=f"var_{var.name}",
                    type="affects",
                    properties={}
                )
                edges.append(edge)
            
        return CanonicalGraph(
            nodes=nodes,
            edges=edges,
            constraints=[c.id for c in universe.constraints],
            metadata={"type": "constraint_universe"}
        )
    
    def _generate_constraint_dsl(self, universe: ConstraintUniverse) -> str:
        """Generate OPLAS DSL program for constraint checking"""
        
        dsl_program = f"""# Constraint checking program for {universe.name}
program check_constraint_universe:
    # Load variables
"""
        
        # Add variable loading
        for var in universe.variables:
            dsl_program += f"    {var.name} = get_variable('{var.name}')\n"
        
        dsl_program += "\n    # Check constraints\n"
        
        # Add constraint checking
        for constraint in universe.constraints:
            dsl_program += f"    {constraint.id}_result = check_constraint('{constraint.id}')\n"
        
        # Add classification logic
        constraint_results = ", ".join([f"{c.id}_result" for c in universe.constraints])
        dsl_program += f"""
    # Aggregate results
    all_constraints = aggregate [{constraint_results}] by logical_and
    
    # Generate classification
    classification = if all_constraints then "POSSIBLE" else "IMPOSSIBLE"
    
    # Create result
    result = create node "constraint_check_result" with {{
        classification: classification,
        constraint_results: [{constraint_results}],
        universe_name: "{universe.name}"
    }}
"""
        
        return dsl_program
    
    def _package_proofs(self, classification_results: List[ClassificationResult]) -> List[Dict]:
        """Package formal proofs for OPLAS verification"""
        packaged_proofs = []
        
        for result in classification_results:
            proof_data = {
                "state": dict(result.state.assignments),
                "classification": result.classification.value,
                "reasoning_steps": [
                    {
                        "rule": step.rule,
                        "premises": step.premises,
                        "conclusion": step.conclusion,
                        "justification": step.justification
                    }
                    for step in result.proof.reasoning_steps
                ],
                "constraint_dependencies": result.proof.constraint_dependencies,
                "computation_time": result.computation_time
            }
            
            if result.proof.counterexample:
                proof_data["counterexample"] = dict(result.proof.counterexample.assignments)
            if result.proof.witness:
                proof_data["witness"] = dict(result.proof.witness.assignments)
                
            packaged_proofs.append(proof_data)
        
        return packaged_proofs
    
    def _serialize_graph(self, graph: CanonicalGraph) -> Dict:
        """Serialize canonical graph to JSON-compatible format"""
        return {
            "nodes": {
                node_id: {
                    "type": node.type,
                    "properties": node.properties
                }
                for node_id, node in graph.nodes.items()
            },
            "edges": [
                {
                    "source": edge.source,
                    "target": edge.target, 
                    "type": edge.type,
                    "properties": getattr(edge, 'properties', {})
                }
                for edge in graph.edges
            ],
            "constraints": graph.constraints,
            "metadata": graph.metadata
        }
