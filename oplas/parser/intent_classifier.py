"""Pattern-based intent classification"""
import re
import sys
from pathlib import Path
from typing import List, Dict

sys.path.insert(0, str(Path(__file__).parent.parent))
from core.types import IntentType

class PatternMatcher:
    """Rule-based intent classifier"""
    
    def __init__(self):
        self.patterns = self._build_patterns()
    
    def _build_patterns(self) -> Dict[IntentType, List[str]]:
        """Build regex patterns for intent matching"""
        return {
            IntentType.DATA_ANALYSIS: [
                r'\b(analyze|analysis|explore|summarize|correlate|trend|statistical|group|find)\b',
                r'\b(data|dataset|table|csv|json|database)\b'
            ],
            IntentType.CODE_GENERATION: [
                r'\b(write|implement|create|generate|build|code)\b.*\b(code|function|class|algorithm|program)\b',
                r'\b(python|javascript|java|c\+\+|typescript|go|rust)\b'
            ],
            IntentType.MODEL_BUILDING: [
                r'\b(model|represent|schema|structure|formalize|design)\b',
                r'\b(system|domain|concept|entity|relationship)\b'
            ],
            IntentType.TRANSFORMATION: [
                r'\b(transform|convert|restructure|reshape|reformat)\b',
                r'\b(into|to|as|for|match)\b'
            ],
            IntentType.QUERY: [
                r'\b(what|how|why|when|where|who)\b',
                r'\b(is|does|should|located|responsible)\b'
            ]
        }
    
    def classify(self, tokens: List[str]) -> IntentType:
        """Classify intent from tokens"""
        text = ' '.join(tokens).lower()
        scores = {}
        
        for intent, patterns in self.patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, text):
                    score += 1
            scores[intent] = score
        
        # Return intent with highest score, default to QUERY
        if not scores or max(scores.values()) == 0:
            return IntentType.QUERY
        
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def get_matches(self, tokens: List[str]) -> List[str]:
        """Get matched patterns for debugging"""
        text = ' '.join(tokens).lower()
        matches = []
        
        for intent, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    matches.append(f"{intent.value}:{pattern}")
        
        return sorted(matches)
