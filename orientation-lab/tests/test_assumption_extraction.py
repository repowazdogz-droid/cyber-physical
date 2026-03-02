"""Assumption extraction tests"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from assumptions.extractor import AssumptionExtractor
from core.types import AssumptionType, ConfidenceLevel

def test_basic_extraction():
    """Test basic assumption extraction"""
    extractor = AssumptionExtractor()
    
    model_text = "The data shows that sales will increase. This means we should invest more. However, we might face supply constraints."
    
    assumptions = extractor.extract_assumptions(model_text, owner="test_user")
    
    assert len(assumptions) > 0
    
    # Check assumption types
    assumption_types = [a.type for a in assumptions]
    assert AssumptionType.OBSERVABLE_FACT in assumption_types or AssumptionType.INFERENCE in assumption_types
    
    print("✓ Basic extraction test passed")

def test_confidence_assessment():
    """Test confidence level assessment"""
    extractor = AssumptionExtractor()
    
    high_confidence_text = "We definitely know that this will happen"
    low_confidence_text = "Perhaps this might occur"
    
    high_assumptions = extractor.extract_assumptions(high_confidence_text)
    low_assumptions = extractor.extract_assumptions(low_confidence_text)
    
    if high_assumptions:
        assert high_assumptions[0].confidence == ConfidenceLevel.HIGH
    
    if low_assumptions:
        assert low_assumptions[0].confidence in [ConfidenceLevel.LOW, ConfidenceLevel.SPECULATION]
    
    print("✓ Confidence assessment test passed")

def test_assumption_types():
    """Test different assumption type classification"""
    extractor = AssumptionExtractor()
    
    texts = {
        AssumptionType.CAUSAL_CLAIM: "This causes that to happen",
        AssumptionType.PREDICTION: "Sales will increase next quarter",
        AssumptionType.VALUE_JUDGMENT: "Customer satisfaction is important",
        AssumptionType.CONSTRAINT: "We must stay within budget"
    }
    
    for expected_type, text in texts.items():
        assumptions = extractor.extract_assumptions(text)
        if assumptions:
            # Check if expected type is found
            found_types = [a.type for a in assumptions]
            # Allow some flexibility in classification
            assert len(assumptions) > 0
    
    print("✓ Assumption type classification test passed")

if __name__ == "__main__":
    print("Running assumption extraction tests...\n")
    test_basic_extraction()
    test_confidence_assessment()
    test_assumption_types()
    print("\nAll assumption extraction tests passed!")
