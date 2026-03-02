"""Extract and categorize assumptions from mental models"""
import re
from typing import List, Dict, Set, Optional
from core.types import Assumption, AssumptionType, ConfidenceLevel

class AssumptionExtractor:
    """Extract assumptions from model descriptions using rule-based patterns"""
    
    def __init__(self):
        self.assumption_patterns = self._build_assumption_patterns()
        self.confidence_indicators = self._build_confidence_indicators()
        
    def extract_assumptions(self, model_text: str, owner: str = None) -> List[Assumption]:
        """Extract assumptions from model description text"""
        assumptions = []
        
        # Split into sentences for analysis
        sentences = self._split_sentences(model_text)
        
        for sentence in sentences:
            assumption = self._analyze_sentence(sentence, owner)
            if assumption:
                assumptions.append(assumption)
        
        # Post-process to identify dependencies
        self._identify_dependencies(assumptions)
        
        return assumptions
    
    def _build_assumption_patterns(self) -> Dict[AssumptionType, List[str]]:
        """Build patterns to identify assumption types"""
        return {
            AssumptionType.OBSERVABLE_FACT: [
                r"we can see that",
                r"the data shows",
                r"evidence indicates",
                r"we observe",
                r"measurements show"
            ],
            AssumptionType.INFERENCE: [
                r"this means",
                r"therefore",
                r"it follows that", 
                r"we can infer",
                r"this implies"
            ],
            AssumptionType.PREDICTION: [
                r"will happen",
                r"expect to see",
                r"likely outcome",
                r"probably will",
                r"forecast"
            ],
            AssumptionType.VALUE_JUDGMENT: [
                r"should be",
                r"is important",
                r"matters because",
                r"the right thing",
                r"valuable"
            ],
            AssumptionType.CAUSAL_CLAIM: [
                r"causes",
                r"leads to",
                r"results in",
                r"drives",
                r"influences"
            ],
            AssumptionType.CONSTRAINT: [
                r"must be",
                r"cannot exceed",
                r"limited by",
                r"bounded by",
                r"constraint"
            ]
        }
    
    def _build_confidence_indicators(self) -> Dict[ConfidenceLevel, List[str]]:
        """Build indicators of confidence levels"""
        return {
            ConfidenceLevel.HIGH: [
                "certainly", "definitely", "clearly", "obviously", "undoubtedly"
            ],
            ConfidenceLevel.MEDIUM: [
                "likely", "probably", "generally", "typically", "usually"
            ],
            ConfidenceLevel.LOW: [
                "might", "perhaps", "possibly", "could be", "uncertain"
            ],
            ConfidenceLevel.SPECULATION: [
                "speculation", "guess", "hunch", "intuition", "wild guess"
            ]
        }
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences for analysis"""
        # Simple sentence splitting - could be enhanced
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _analyze_sentence(self, sentence: str, owner: str = None) -> Optional[Assumption]:
        """Analyze single sentence to extract assumption"""
        sentence_lower = sentence.lower()
        
        # Determine assumption type
        assumption_type = self._classify_assumption_type(sentence_lower)
        
        # Determine confidence level
        confidence = self._assess_confidence(sentence_lower)
        
        # Extract core statement (remove confidence indicators)
        core_statement = self._extract_core_statement(sentence)
        
        # Skip if not really an assumption
        if not self._is_substantial_assumption(core_statement):
            return None
        
        # Identify limitations and scope
        limitations = self._identify_limitations(sentence_lower)
        scope = self._identify_scope(sentence_lower)
        
        return Assumption(
            statement=core_statement,
            type=assumption_type,
            confidence=confidence,
            owner=owner,
            scope=scope,
            limitations=limitations,
            reasoning=sentence  # Keep original for context
        )
    
    def _classify_assumption_type(self, sentence: str) -> AssumptionType:
        """Classify the type of assumption based on patterns"""
        
        for assumption_type, patterns in self.assumption_patterns.items():
            for pattern in patterns:
                if re.search(pattern, sentence):
                    return assumption_type
        
        # Default to inference if no specific pattern matches
        return AssumptionType.INFERENCE
    
    def _assess_confidence(self, sentence: str) -> ConfidenceLevel:
        """Assess confidence level from language indicators"""
        
        for confidence_level, indicators in self.confidence_indicators.items():
            for indicator in indicators:
                if indicator in sentence:
                    return confidence_level
        
        # Default to medium confidence
        return ConfidenceLevel.MEDIUM
    
    def _extract_core_statement(self, sentence: str) -> str:
        """Extract core assumption statement, removing hedging language"""
        
        # Remove common hedging phrases
        hedges = ["i think", "i believe", "it seems", "appears that", "probably"]
        
        core = sentence
        for hedge in hedges:
            core = re.sub(hedge, "", core, flags=re.IGNORECASE)
        
        return core.strip()
    
    def _is_substantial_assumption(self, statement: str) -> bool:
        """Check if statement represents a substantial assumption"""
        
        # Filter out trivial statements
        trivial_patterns = [
            r"^(the|a|an) $",   # Starts with article only
            r"^(yes|no)$",      # Just yes/no
            r"^(ok|okay)$",     # Just acknowledgment
        ]
        
        statement_lower = statement.lower().strip()
        
        for pattern in trivial_patterns:
            if re.match(pattern, statement_lower):
                return False
        
        # Must have some substance
        return len(statement.split()) >= 3
    
    def _identify_limitations(self, sentence: str) -> List[str]:
        """Identify stated limitations in assumption"""
        limitations = []
        
        limitation_patterns = [
            r"except for (.+)",
            r"but not (.+)",
            r"limited to (.+)",
            r"only applies to (.+)",
            r"assuming (.+)"
        ]
        
        for pattern in limitation_patterns:
            matches = re.findall(pattern, sentence)
            limitations.extend(matches)
        
        return limitations
    
    def _identify_scope(self, sentence: str) -> str:
        """Identify scope of assumption"""
        scope_patterns = [
            r"in the context of (.+)",
            r"for (.+?) situations",
            r"when dealing with (.+)",
            r"regarding (.+)"
        ]
        
        for pattern in scope_patterns:
            match = re.search(pattern, sentence)
            if match:
                return match.group(1)
        
        return "general"  # Default scope
    
    def _identify_dependencies(self, assumptions: List[Assumption]) -> None:
        """Identify dependencies between assumptions"""
        
        for i, assumption in enumerate(assumptions):
            for j, other_assumption in enumerate(assumptions):
                if i != j and self._is_dependent(assumption, other_assumption):
                    assumption.dependencies.append(other_assumption.id)
    
    def _is_dependent(self, assumption: Assumption, other: Assumption) -> bool:
        """Check if one assumption depends on another"""
        
        # Simple dependency detection based on keywords
        assumption_words = set(assumption.statement.lower().split())
        other_words = set(other.statement.lower().split())
        
        # High overlap might indicate dependency
        overlap = len(assumption_words.intersection(other_words))
        
        return overlap >= 3  # Threshold for dependency
