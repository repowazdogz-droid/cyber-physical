"""Anti-optimization safeguard tests"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.safeguards import AntiOptimizationGuard, ConversationFlowGuard
from core.types import OrientationSession, Model

def test_authority_detection():
    """Test detection of authority claims"""
    guard = AntiOptimizationGuard()
    
    # Should detect violations
    violations = guard.check_for_violations("You should choose option A because it's optimal")
    assert len(violations) > 0
    assert any("AUTHORITY_CLAIM" in v for v in violations)
    # Check for either optimization or authority claim (text contains both)
    assert any("OPTIMIZATION" in v or "AUTHORITY_CLAIM" in v for v in violations)
    
    # Should not flag orientation language
    violations = guard.check_for_violations("Models differ on whether option A is viable")
    assert len(violations) == 0
    
    print("✓ Authority detection test passed")

def test_reframe_suggestion():
    """Test reframing suggestions"""
    guard = AntiOptimizationGuard()
    
    violating_text = "You should choose option A"
    reframed = guard.suggest_reframe(violating_text)
    
    assert "should" not in reframed.lower() or "might consider" in reframed.lower()
    
    print("✓ Reframe suggestion test passed")

def test_session_validation():
    """Test session output validation"""
    guard = AntiOptimizationGuard()
    
    # Create session with multiple models but no disagreements (violation)
    session = OrientationSession(
        name="test_session",
        models=[
            Model(name="Model A", description="Model A description"),
            Model(name="Model B", description="Model B description")
        ]
    )
    
    violations = guard.validate_session_output(session)
    assert len(violations) > 0
    assert any("PREMATURE_CONVERGENCE" in v for v in violations)
    
    print("✓ Session validation test passed")

def test_conversation_flow_guard():
    """Test conversation flow appropriateness"""
    guard = ConversationFlowGuard()
    
    # Check inappropriate actions
    assert not guard.check_phase_appropriate("model_articulation", "ranking_models")
    assert not guard.check_phase_appropriate("disagreement_mapping", "resolving_disagreement")
    
    # Check appropriate actions
    assert guard.check_phase_appropriate("model_articulation", "clarifying_model")
    assert guard.check_phase_appropriate("uncertainty_exploration", "mapping_unknowns")
    
    # Test suggestions
    suggestions = guard.suggest_next_action("assumption_extraction", {})
    assert len(suggestions) > 0
    assert "identify" in suggestions[0].lower()
    
    print("✓ Conversation flow guard test passed")

if __name__ == "__main__":
    print("Running anti-optimization safeguard tests...\n")
    test_authority_detection()
    test_reframe_suggestion()
    test_session_validation()
    test_conversation_flow_guard()
    print("\nAll anti-optimization tests passed!")
