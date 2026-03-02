#!/usr/bin/env python3
"""Example: Orientation Lab with assumption tracking and anti-optimization"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from core.types import OrientationSession, Model, Assumption, AssumptionType, ConfidenceLevel
from assumptions.extractor import AssumptionExtractor
from core.safeguards import AntiOptimizationGuard
from export.oplas_exporter import OrientationLabExporter

def main():
    print("=== Orientation Lab: Uncertainty Boundary Enhancement ===\n")
    
    # Create assumption extractor
    extractor = AssumptionExtractor()
    
    # Create anti-optimization guard
    guard = AntiOptimizationGuard()
    
    # Example model descriptions
    model_a_text = """
    The market will grow because customer demand is increasing. 
    We should invest in capacity expansion. However, we might face supply chain constraints.
    """
    
    model_b_text = """
    Market growth is uncertain due to economic factors. 
    We should be cautious about investments. Supply chains are stable but costs are rising.
    """
    
    # Extract assumptions from models
    print("Extracting assumptions from Model A...")
    assumptions_a = extractor.extract_assumptions(model_a_text, owner="Participant A")
    print(f"Found {len(assumptions_a)} assumptions")
    for i, assumption in enumerate(assumptions_a, 1):
        print(f"  {i}. [{assumption.type.value}] {assumption.statement[:60]}...")
        print(f"     Confidence: {assumption.confidence.value}, Scope: {assumption.scope}")
    
    print("\nExtracting assumptions from Model B...")
    assumptions_b = extractor.extract_assumptions(model_b_text, owner="Participant B")
    print(f"Found {len(assumptions_b)} assumptions")
    for i, assumption in enumerate(assumptions_b, 1):
        print(f"  {i}. [{assumption.type.value}] {assumption.statement[:60]}...")
        print(f"     Confidence: {assumption.confidence.value}, Scope: {assumption.scope}")
    
    # Create models
    model_a = Model(
        name="Growth Optimist",
        owner="Participant A",
        description=model_a_text,
        assumptions=assumptions_a,
        explains=["Market growth", "Investment opportunities"],
        doesnt_explain=["Supply chain risks", "Economic uncertainty"],
        scope="Market analysis"
    )
    
    model_b = Model(
        name="Cautious Analyst",
        owner="Participant B",
        description=model_b_text,
        assumptions=assumptions_b,
        explains=["Economic uncertainty", "Cost pressures"],
        doesnt_explain=["Demand growth", "Market expansion"],
        scope="Risk analysis"
    )
    
    # Create orientation session
    session = OrientationSession(
        name="Market Investment Decision",
        context="Should we invest in capacity expansion?",
        participants=["Participant A", "Participant B"],
        models=[model_a, model_b]
    )
    
    # Check for violations
    print("\n=== Anti-Optimization Check ===")
    violations = guard.validate_session_output(session)
    if violations:
        print("⚠️  Violations detected:")
        for violation in violations:
            print(f"  - {violation}")
    else:
        print("✓ No violations detected - session maintains non-authoritative stance")
    
    # Test authority detection on model descriptions
    print("\n=== Authority Detection Test ===")
    test_texts = [
        "You should invest in option A",
        "Models differ on investment strategy",
        "The optimal choice is option B"
    ]
    
    for text in test_texts:
        violations = guard.check_for_violations(text)
        status = "⚠️  VIOLATION" if violations else "✓ OK"
        print(f"{status}: {text}")
        if violations:
            for violation in violations:
                print(f"    → {violation}")
    
    # Export to OPLAS
    print("\n=== OPLAS Export ===")
    exporter = OrientationLabExporter()
    artifact = exporter.export_to_oplas(session)
    
    print(f"Artifact type: {artifact['type']}")
    print(f"Models: {artifact['metadata']['model_count']}")
    print(f"Assumptions: {len(artifact['canonical_representation']['nodes'])} nodes")
    print(f"Uncertainty boundaries: {len(artifact['uncertainty_boundaries'])} categories")
    
    print("\n✓ Orientation Lab enhancement complete!")

if __name__ == "__main__":
    main()
