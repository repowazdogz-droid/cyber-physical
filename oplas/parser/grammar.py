"""Rule-based grammar for task parsing"""
from typing import Dict, List
from core.types import IntentType

class TaskGrammar:
    """Explicit grammar patterns - no learned models"""
    
    def __init__(self):
        self.patterns = self._load_patterns()
    
    def _load_patterns(self) -> Dict[IntentType, List[str]]:
        """Load explicit pattern definitions"""
        return {
            IntentType.DATA_ANALYSIS: [
                "analyze {data} for {pattern}",
                "find {pattern} in {data}",
                "explore {data} to discover {pattern}",
                "summarize {data} by {dimension}",
                "group {data} by {attribute}",
                "correlate {variable1} with {variable2}",
                "trend analysis of {data}",
                "statistical summary of {data}"
            ],
            
            IntentType.CODE_GENERATION: [
                "write {language} code that {action}",
                "implement {algorithm} in {language}",
                "create {structure} for {purpose}",
                "generate function to {action}",
                "build {component} that {behavior}",
                "code {functionality} using {technology}"
            ],
            
            IntentType.MODEL_BUILDING: [
                "model {domain} with {constraints}",
                "represent {concept} as {structure}",
                "build model of {system}",
                "create schema for {domain}",
                "design structure for {purpose}",
                "formalize {concept} as {representation}"
            ],
            
            IntentType.TRANSFORMATION: [
                "transform {input} into {output}",
                "convert {format1} to {format2}",
                "restructure {data} as {format}",
                "reshape {input} for {purpose}",
                "reformat {data} to match {schema}"
            ],
            
            IntentType.QUERY: [
                "what is {entity}",
                "how does {system} work",
                "why does {phenomenon} occur",
                "when should {action} happen",
                "where is {entity} located",
                "who is responsible for {task}"
            ]
        }
    
    def get_patterns_for_intent(self, intent: IntentType) -> List[str]:
        """Get patterns for specific intent"""
        return self.patterns.get(intent, [])
    
    def get_all_patterns(self) -> Dict[IntentType, List[str]]:
        """Get all grammar patterns"""
        return self.patterns.copy()
