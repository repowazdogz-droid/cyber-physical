"""Safeguards to prevent drift toward optimization/recommendation engine"""
from typing import List, Dict, Any, Optional
import re
from core.types import OrientationSession, Model

class AntiOptimizationGuard:
    """Prevents Orientation Lab from becoming a recommendation engine"""
    
    def __init__(self):
        # Patterns that indicate authority claims
        self.authority_patterns = [
            r"you should",
            r"the best approach",
            r"recommended solution",
            r"optimal choice",
            r"AI suggests", 
            r"the model recommends",
            r"based on analysis, do",
            r"the right answer is",
            r"conclusion: choose"
        ]
        
        # Patterns that indicate optimization
        self.optimization_patterns = [
            r"maximize",
            r"minimize", 
            r"optimize",
            r"best outcome",
            r"most efficient",
            r"ideal solution",
            r"perfect approach"
        ]
        
        # Approved language patterns (orientation-appropriate)
        self.approved_patterns = [
            r"models differ on",
            r"assumptions include",
            r"uncertainty exists about",
            r"participants might consider",
            r"possible interpretations",
            r"disagreement centers on"
        ]
    
    def check_for_violations(self, text: str) -> List[str]:
        """Check text for authority/optimization violations"""
        violations = []
        
        text_lower = text.lower()
        
        # Check for authority claims
        for pattern in self.authority_patterns:
            if re.search(pattern, text_lower):
                violations.append(f"AUTHORITY_CLAIM: '{pattern}' found in text")
        
        # Check for optimization language
        for pattern in self.optimization_patterns:
            if re.search(pattern, text_lower):
                violations.append(f"OPTIMIZATION: '{pattern}' found in text")
                
        return violations
    
    def suggest_reframe(self, violating_text: str) -> str:
        """Suggest non-authoritative reframe"""
        suggestions = {
            "you should": "you might consider",
            "the best approach": "one possible approach",
            "recommended solution": "possible solution for consideration",
            "optimal choice": "one option among several",
            "AI suggests": "analysis shows",
            "the right answer": "one perspective",
            "conclusion: choose": "considerations include"
        }
        
        reframed = violating_text.lower()
        for violation, suggestion in suggestions.items():
            reframed = reframed.replace(violation, suggestion)
            
        return reframed
    
    def validate_session_output(self, session: OrientationSession) -> List[str]:
        """Validate entire session output for violations"""
        violations = []
        
        # Check if session claims to resolve disagreements authoritatively
        if len(session.disagreement_points) == 0 and len(session.models) > 1:
            violations.append("PREMATURE_CONVERGENCE: Multiple models but no disagreements found")
        
        # Check for authority claims in model descriptions
        for model in session.models:
            model_violations = self.check_for_violations(model.description)
            violations.extend([f"MODEL_{model.name}: {v}" for v in model_violations])
        
        return violations

class ConversationFlowGuard:
    """Ensures conversation follows orientation principles, not optimization"""
    
    def __init__(self):
        self.orientation_phases = [
            "model_articulation",    # Get models visible
            "assumption_extraction", # Surface assumptions
            "disagreement_mapping",  # Find where models differ
            "uncertainty_exploration", # Explore what's unknown
            "boundary_setting"       # Define limits of discussion
        ]
    
    def check_phase_appropriate(self, current_phase: str, action: str) -> bool:
        """Check if action is appropriate for current phase"""
        
        inappropriate_actions = {
            "model_articulation": ["ranking_models", "choosing_winner"],
            "assumption_extraction": ["optimizing_assumptions"],  
            "disagreement_mapping": ["resolving_disagreement", "finding_consensus"],
            "uncertainty_exploration": ["claiming_certainty"],
            "boundary_setting": ["expanding_scope_indefinitely"]
        }
        
        return action not in inappropriate_actions.get(current_phase, [])
    
    def suggest_next_action(self, current_phase: str, session_state: Dict[str, Any]) -> List[str]:
        """Suggest appropriate next actions (non-prescriptively)"""
        
        suggestions = {
            "model_articulation": [
                "invite additional model perspectives",
                "ask for model clarification",
                "check if important viewpoints are missing"
            ],
            "assumption_extraction": [
                "identify unstated assumptions",
                "categorize assumption types", 
                "map assumption dependencies"
            ],
            "disagreement_mapping": [
                "find points of divergence",
                "identify different starting assumptions",
                "map where models make different predictions"
            ],
            "uncertainty_exploration": [
                "identify what each model doesn't explain",
                "surface unknown unknowns",
                "map confidence levels"
            ],
            "boundary_setting": [
                "define scope of current discussion",
                "identify out-of-scope questions",
                "set reasonable stopping criteria"
            ]
        }
        
        return suggestions.get(current_phase, ["continue exploration"])
