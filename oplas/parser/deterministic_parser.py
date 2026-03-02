"""Deterministic parser - no learned models"""
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.types import TypedRequest, IntentType
from parser.grammar import TaskGrammar
from parser.entity_extractor import RuleBasedExtractor
from parser.intent_classifier import PatternMatcher

class DeterministicParser:
    """Rule-based parser with explicit patterns"""
    
    def __init__(self):
        self.grammar = TaskGrammar()
        self.entity_extractor = RuleBasedExtractor()
        self.intent_classifier = PatternMatcher()
        
    def parse(self, text: str) -> TypedRequest:
        """Parse text into typed request deterministically"""
        # 1. Normalize and tokenize
        normalized = self._normalize_text(text)
        tokens = self._tokenize(normalized)
        
        # 2. Classify intent using explicit patterns
        intent = self.intent_classifier.classify(tokens)
        
        # 3. Extract entities using rules
        entities = self.entity_extractor.extract(tokens, intent)
        
        # 4. Extract constraints
        constraints = self._extract_constraints(tokens)
        
        # 5. Build metadata
        metadata = {
            "token_count": len(tokens),
            "normalized_text": normalized,
            "matched_patterns": self.intent_classifier.get_matches(tokens)
        }
        
        return TypedRequest(
            intent=intent,
            entities=entities,
            constraints=constraints,
            raw_text=text,
            parse_metadata=metadata
        )
    
    def _normalize_text(self, text: str) -> str:
        """Deterministic text normalization"""
        # Convert to lowercase
        text = text.lower().strip()
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove punctuation (keep only alphanumeric and spaces)
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        
        return text
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple deterministic tokenization"""
        return text.split()
    
    def _extract_constraints(self, tokens: List[str]) -> List[str]:
        """Extract constraints from tokens"""
        constraints = []
        
        # Pattern matching for common constraints
        constraint_patterns = {
            "time_limit": r"within (\d+) (minutes|hours|days)",
            "data_size": r"(small|medium|large) dataset",
            "accuracy": r"accuracy (above|below|at least) (\d+)%"
        }
        
        text = ' '.join(tokens)
        for constraint_type, pattern in constraint_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                constraints.append(f"{constraint_type}:{match.group()}")
        
        return sorted(constraints)  # Ensure deterministic ordering
