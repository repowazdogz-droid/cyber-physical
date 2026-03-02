#!/usr/bin/env python3
"""Example usage of OPLAS Gate 1a - Determinism Foundation"""
from parser.deterministic_parser import DeterministicParser
from canonicalization.canonicalizer import Canonicalizer

def main():
    print("=== OPLAS Gate 1a - Determinism Foundation ===\n")
    
    # Initialize components
    parser = DeterministicParser()
    canonicalizer = Canonicalizer()
    
    # Example requests
    examples = [
        "analyze csv data for patterns",
        "write python code that processes data",
        "model customer behavior with constraints",
        "transform json to csv format",
        "what is machine learning"
    ]
    
    for text in examples:
        print(f"Request: {text}")
        
        # Parse
        request = parser.parse(text)
        print(f"  Intent: {request.intent.value}")
        print(f"  Entities: {request.entities}")
        print(f"  Constraints: {request.constraints}")
        
        # Canonicalize
        graph = canonicalizer.canonicalize(request)
        print(f"  Graph hash: {graph.hash[:16]}...")
        print(f"  Nodes: {len(graph.nodes)}")
        print(f"  Edges: {len(graph.edges)}")
        print(f"  Constraints: {len(graph.constraints)}")
        print()

if __name__ == "__main__":
    main()
