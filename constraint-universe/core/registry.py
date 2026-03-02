"""Constraint registry for managing constraint types"""
from typing import Dict, Type, List
from core.types import Constraint

class ConstraintRegistry:
    """Registry of available constraint types"""
    
    def __init__(self):
        self._constraints: Dict[str, Type[Constraint]] = {}
        self._instances: Dict[str, Constraint] = {}
    
    def register(self, constraint_type: str, constraint_class: Type[Constraint]):
        """Register a constraint type"""
        self._constraints[constraint_type] = constraint_class
    
    def create(self, constraint_type: str, constraint_id: str, **kwargs) -> Constraint:
        """Create an instance of a constraint type"""
        if constraint_type not in self._constraints:
            raise ValueError(f"Unknown constraint type: {constraint_type}")
        
        constraint_class = self._constraints[constraint_type]
        instance = constraint_class(constraint_id=constraint_id, **kwargs)
        self._instances[constraint_id] = instance
        return instance
    
    def get(self, constraint_id: str) -> Optional[Constraint]:
        """Get constraint instance by ID"""
        return self._instances.get(constraint_id)
    
    def list_types(self) -> List[str]:
        """List all registered constraint types"""
        return list(self._constraints.keys())
    
    def list_instances(self) -> List[str]:
        """List all constraint instance IDs"""
        return list(self._instances.keys())

# Global registry instance
registry = ConstraintRegistry()
