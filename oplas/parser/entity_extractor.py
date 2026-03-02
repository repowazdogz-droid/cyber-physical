"""Rule-based entity extraction"""
import re
import sys
from pathlib import Path
from typing import List, Dict, Any

sys.path.insert(0, str(Path(__file__).parent.parent))
from core.types import IntentType

class RuleBasedExtractor:
    """Extract entities using explicit rules"""
    
    def __init__(self):
        self.entity_patterns = self._build_patterns()
    
    def _build_patterns(self) -> Dict[str, List[str]]:
        """Build entity extraction patterns"""
        return {
            "data_source": [
                r'\b(csv|json|xml|database|table|file|dataset)\b',
                r'\b([A-Z][a-z]+\.(csv|json|xml|db))\b'
            ],
            "language": [
                r'\b(python|javascript|java|c\+\+|typescript|go|rust|ruby|php)\b'
            ],
            "operation": [
                r'\b(analyze|transform|filter|sort|group|summarize|aggregate)\b'
            ],
            "attribute": [
                r'\b(by|using|with|for)\s+([a-z]+)\b'
            ],
            "number": [
                r'\b(\d+)\b'
            ],
            "time_unit": [
                r'\b(minutes|hours|days|seconds|weeks|months)\b'
            ]
        }
    
    def extract(self, tokens: List[str], intent: IntentType) -> Dict[str, Any]:
        """Extract entities from tokens"""
        text = ' '.join(tokens).lower()
        entities = {}
        
        for entity_type, patterns in self.entity_patterns.items():
            matches = []
            for pattern in patterns:
                found = re.findall(pattern, text, re.IGNORECASE)
                if found:
                    if isinstance(found[0], tuple):
                        matches.extend([m for m in found if m])
                    else:
                        matches.extend(found)
            
            if matches:
                # Deduplicate while preserving order
                unique_matches = []
                seen = set()
                for match in matches:
                    if isinstance(match, tuple):
                        match_str = ' '.join(str(m) for m in match if m)
                    else:
                        match_str = str(match)
                    
                    if match_str and match_str not in seen:
                        seen.add(match_str)
                        unique_matches.append(match_str)
                
                if unique_matches:
                    entities[entity_type] = unique_matches[0] if len(unique_matches) == 1 else unique_matches
        
        return entities
