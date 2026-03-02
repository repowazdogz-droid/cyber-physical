"""Contract loader and query interface for Spine contracts."""

from pathlib import Path
from typing import List, Dict, Optional
import re


class ContractLoader:
    """Loads and queries Spine contracts from markdown files."""
    
    def __init__(self, contracts_dir: Optional[str] = None):
        """
        Initialize contract loader.
        
        Args:
            contracts_dir: Path to contracts directory. Defaults to spine/contracts/
        """
        if contracts_dir is None:
            # Default to spine/contracts/ relative to this file
            runtime_dir = Path(__file__).parent.parent
            contracts_dir = runtime_dir / "contracts"
        
        self.contracts_dir = Path(contracts_dir)
        self._contracts_cache: Optional[List[Dict[str, str]]] = None
    
    def load_all_contracts(self) -> List[Dict[str, str]]:
        """
        Load all contract markdown files.
        
        Returns:
            List of dicts with 'name' and 'content' keys
        """
        if self._contracts_cache is not None:
            return self._contracts_cache
        
        contracts = []
        
        if not self.contracts_dir.exists():
            return contracts
        
        # Load all .md files in contracts directory
        for contract_file in self.contracts_dir.glob("*.md"):
            if contract_file.is_file():
                with open(contract_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    contracts.append({
                        'name': contract_file.stem,
                        'path': str(contract_file),
                        'content': content
                    })
        
        self._contracts_cache = contracts
        return contracts
    
    def find_relevant_contracts(self, constraint: str) -> List[str]:
        """
        Find contracts that might be relevant to a constraint.
        
        Args:
            constraint: Constraint string to match against
            
        Returns:
            List of contract names that might be relevant
        """
        contracts = self.load_all_contracts()
        relevant = []
        
        # Simple keyword matching - extract keywords from constraint
        constraint_lower = constraint.lower()
        keywords = re.findall(r'\b\w+\b', constraint_lower)
        
        for contract in contracts:
            content_lower = contract['content'].lower()
            # Check if any keyword appears in contract content
            if any(keyword in content_lower for keyword in keywords if len(keyword) > 3):
                relevant.append(contract['name'])
        
        return relevant
    
    def check_constraint_violation(self, constraint: str) -> Optional[str]:
        """
        Check if a constraint might violate any contract.
        
        Args:
            constraint: Constraint string to check
            
        Returns:
            Violation message if found, None otherwise
        """
        contracts = self.load_all_contracts()
        constraint_lower = constraint.lower()
        
        # Look for prohibitions in contracts
        for contract in contracts:
            content = contract['content']
            content_lower = content.lower()
            
            # Check for explicit prohibitions
            if 'prohibited' in content_lower or 'must not' in content_lower:
                # Simple heuristic: if constraint mentions something that's prohibited
                # This is a basic implementation - can be enhanced in Week 2
                if any(word in constraint_lower for word in ['autonomous', 'self-modify', 'optimize']):
                    if 'prohibited' in content_lower:
                        return f"Potential violation of {contract['name']}: constraint may conflict with prohibitions"
        
        return None
    
    def get_contract_by_name(self, name: str) -> Optional[Dict[str, str]]:
        """
        Get a specific contract by name.
        
        Args:
            name: Contract name (with or without .md extension)
            
        Returns:
            Contract dict or None if not found
        """
        contracts = self.load_all_contracts()
        name_clean = name.replace('.md', '')
        
        for contract in contracts:
            if contract['name'] == name_clean:
                return contract
        
        return None
