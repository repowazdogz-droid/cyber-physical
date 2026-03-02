"""Export orientation session results to OPLAS artifact format"""
from typing import Dict, List
from core.types import OrientationSession, Model, Assumption
from datetime import datetime

class OrientationLabExporter:
    """Export orientation session as OPLAS-compatible artifacts"""
    
    def export_to_oplas(self, session: OrientationSession) -> Dict:
        """Export complete orientation session as OPLAS artifact"""
        
        # Create canonical graph of models and assumptions
        canonical_graph = self._build_assumption_graph(session)
        
        # Generate DSL program for assumption analysis
        analysis_program = self._generate_analysis_dsl(session)
        
        # Package uncertainty boundaries
        uncertainty_data = self._package_uncertainty_boundaries(session)
        
        artifact = {
            "type": "orientation_session",
            "version": "1.0", 
            "canonical_representation": canonical_graph,
            "executable_program": analysis_program,
            "uncertainty_boundaries": uncertainty_data,
            "metadata": {
                "session_name": session.name,
                "participant_count": len(session.participants),
                "model_count": len(session.models),
                "disagreement_count": len(session.disagreement_points),
                "exported_at": session.created_at.isoformat() if hasattr(session.created_at, 'isoformat') else str(session.created_at)
            }
        }
        
        return artifact
    
    def _build_assumption_graph(self, session: OrientationSession) -> Dict:
        """Build canonical graph of models and assumptions"""
        nodes = {}
        edges = []
        
        # Create nodes for each model
        for model in session.models:
            model_node_id = f"model_{model.id}"
            nodes[model_node_id] = {
                "type": "model",
                "properties": {
                    "model_name": model.name,
                    "owner": model.owner,
                    "confidence": model.confidence.value,
                    "energy": model.energy.value,
                    "scope": model.scope,
                    "explains": model.explains,
                    "doesnt_explain": model.doesnt_explain
                }
            }
            
            # Create nodes for each assumption in the model
            for assumption in model.assumptions:
                assumption_node_id = f"assumption_{assumption.id}"
                nodes[assumption_node_id] = {
                    "type": "assumption",
                    "properties": {
                        "statement": assumption.statement,
                        "assumption_type": assumption.type.value,
                        "confidence": assumption.confidence.value,
                        "scope": assumption.scope,
                        "limitations": assumption.limitations,
                        "evidence": assumption.evidence,
                        "uncertain_about": assumption.uncertain_about
                    }
                }
                
                # Create edge from model to assumption
                edges.append({
                    "source": model_node_id,
                    "target": assumption_node_id,
                    "type": "contains_assumption"
                })
                
                # Create edges for assumption dependencies
                for dep_id in assumption.dependencies:
                    dep_node_id = f"assumption_{dep_id}"
                    edges.append({
                        "source": assumption_node_id,
                        "target": dep_node_id,
                        "type": "depends_on"
                    })
        
        # Create nodes for disagreement points
        for disagreement in session.disagreement_points:
            disagreement_node_id = f"disagreement_{disagreement.id}"
            nodes[disagreement_node_id] = {
                "type": "disagreement",
                "properties": {
                    "description": disagreement.description,
                    "crux_statement": disagreement.crux_statement,
                    "disagreement_type": disagreement.disagreement_type,
                    "resolvable": disagreement.resolvable,
                    "resolution_criteria": disagreement.resolution_criteria
                }
            }
            
            # Connect disagreement to involved models
            for model_id in disagreement.model_ids:
                model_node_id = f"model_{model_id}"
                edges.append({
                    "source": disagreement_node_id,
                    "target": model_node_id,
                    "type": "involves_model"
                })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "constraints": [],  # No formal constraints in orientation
            "metadata": {"type": "orientation_session_graph"}
        }
    
    def _generate_analysis_dsl(self, session: OrientationSession) -> str:
        """Generate OPLAS DSL for analyzing orientation session"""
        
        dsl_program = f"""
# Orientation session analysis for {session.name}
program analyze_orientation_session:
    # Load models
    models = select nodes where type = "model"
    assumptions = select nodes where type = "assumption" 
    disagreements = select nodes where type = "disagreement"
    
    # Analyze assumption patterns
    assumption_types = aggregate assumptions by group_by(assumption_type)
    confidence_distribution = aggregate assumptions by group_by(confidence)
    
    # Map disagreement structure
    disagreement_topology = map disagreements to {{
        crux: crux_statement,
        models: connected_models,
        resolvable: resolvable
    }}
    
    # Identify uncertainty boundaries
    high_uncertainty = filter assumptions where confidence = "low" or confidence = "speculation"
    knowledge_gaps = aggregate models by uncertain_about
    
    # Generate session insights (descriptive, not prescriptive)
    session_analysis = create node "session_insights" with {{
        model_count: count(models),
        assumption_count: count(assumptions),
        disagreement_count: count(disagreements),
        assumption_distribution: assumption_types,
        confidence_patterns: confidence_distribution,
        high_uncertainty_areas: high_uncertainty,
        disagreement_structure: disagreement_topology,
        knowledge_boundaries: knowledge_gaps
    }}
"""
        
        return dsl_program
    
    def _package_uncertainty_boundaries(self, session: OrientationSession) -> Dict:
        """Package uncertainty boundaries from session"""
        
        boundaries = {}
        
        # Aggregate uncertainties across all models
        all_uncertainties = set()
        confident_areas = set()
        
        for model in session.models:
            all_uncertainties.update(model.uncertain_variables)
            all_uncertainties.update(model.doesnt_explain)
            confident_areas.update(model.explains)
        
        # Classify uncertainty types
        boundaries = {
            "confident_consensus": list(confident_areas),  # What models agree on
            "recognized_uncertainty": list(all_uncertainties),  # What they know they don't know
            "unresolved_disagreements": [d.crux_statement for d in session.disagreement_points],
            "scope_boundaries": [m.scope for m in session.models],
            "meta_uncertainty": session.unresolved_uncertainties
        }
        
        return boundaries
