"""Canonicalization tests"""
import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from parser.deterministic_parser import DeterministicParser
from canonicalization.canonicalizer import Canonicalizer
from core.types import IntentType, NodeType

class TestCanonicalization:
    """Test canonical graph generation"""
    
    def test_basic_canonicalization(self):
        """Test basic request canonicalization"""
        parser = DeterministicParser()
        canonicalizer = Canonicalizer()
        
        text = "analyze csv data"
        request = parser.parse(text)
        graph = canonicalizer.canonicalize(request)
        
        assert graph is not None
        assert len(graph.nodes) > 0
        assert graph.hash != ""
    
    def test_node_creation(self):
        """Test node creation from concepts"""
        parser = DeterministicParser()
        canonicalizer = Canonicalizer()
        
        text = "analyze csv data for patterns"
        request = parser.parse(text)
        graph = canonicalizer.canonicalize(request)
        
        # Should have nodes for key concepts
        assert len(graph.nodes) >= 1
        
        # All nodes should have required fields
        for node_id, node in graph.nodes.items():
            assert node.id == node_id
            assert node.type in NodeType
            assert isinstance(node.properties, dict)
    
    def test_edge_creation(self):
        """Test edge creation from relationships"""
        parser = DeterministicParser()
        canonicalizer = Canonicalizer()
        
        text = "analyze csv data"
        request = parser.parse(text)
        graph = canonicalizer.canonicalize(request)
        
        # Edges should connect valid nodes
        for edge in graph.edges:
            assert edge.source in graph.nodes
            assert edge.target in graph.nodes
            assert edge.type is not None
    
    def test_deterministic_ordering(self):
        """Test that nodes and edges are deterministically ordered"""
        parser = DeterministicParser()
        canonicalizer = Canonicalizer()
        
        text = "analyze csv data for patterns"
        request = parser.parse(text)
        graph1 = canonicalizer.canonicalize(request)
        graph2 = canonicalizer.canonicalize(request)
        
        # Node IDs should be in same order
        assert list(graph1.nodes.keys()) == list(graph2.nodes.keys())
        
        # Edges should be in same order
        edge_keys1 = [(e.source, e.target, e.type.value) for e in graph1.edges]
        edge_keys2 = [(e.source, e.target, e.type.value) for e in graph2.edges]
        assert edge_keys1 == edge_keys2
    
    def test_hash_consistency(self):
        """Test that hash is consistent for same graph"""
        parser = DeterministicParser()
        canonicalizer = Canonicalizer()
        
        text = "analyze csv data"
        request = parser.parse(text)
        graph1 = canonicalizer.canonicalize(request)
        graph2 = canonicalizer.canonicalize(request)
        
        assert graph1.hash == graph2.hash

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
