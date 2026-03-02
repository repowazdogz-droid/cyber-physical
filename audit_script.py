#!/usr/bin/env python3
"""
OmegaStack Filesystem Audit Script
Non-destructive, read-only scan of Mac filesystem for OmegaStack-relevant artifacts.
"""

import os
import json
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional

# Phase 1: High-value locations
HIGH_VALUE_DIRS = [
    "Documents", "Desktop", "Downloads", "Projects", "Repos", "Notebooks",
    "Research", "Omega", "AI", "Robotics", "Education", "Kids", "Content",
    "XR", "Clinical", "Surgical", "SoftRobotics", "Simulation", "Libraries",
    "Work", "Code", "Dev", "Sandbox"
]

# Phase 2: Content type patterns
CODE_EXTENSIONS = {
    "python": {".py", ".pyw", ".pyx"},
    "javascript": {".js", ".mjs", ".cjs"},
    "typescript": {".ts", ".tsx"},
    "cpp": {".cpp", ".cxx", ".cc", ".c++", ".hpp", ".hxx", ".hh"},
    "c": {".c", ".h"},
    "rust": {".rs"},
    "go": {".go"},
    "swift": {".swift"},
    "java": {".java"},
    "kotlin": {".kt", ".kts"},
    "scala": {".scala"},
    "r": {".r", ".R"},
    "matlab": {".m"},
}

SPEC_EXTENSIONS = {".md", ".txt", ".json", ".yaml", ".yml", ".toml", ".xml"}
NOTEBOOK_EXTENSIONS = {".ipynb", ".rmd"}
MEDIA_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".pdf", ".mp4", ".mov", ".avi"}
DATA_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".feather"}

# Phase 3: Version/lineage patterns
VERSION_PATTERNS = [
    r"v?(\d+\.\d+(?:\.\d+)?)",  # v1.2.3 or 1.2.3
    r"v(\d+)",  # v1, v2
    r"(\d+\.\d+)",  # 1.2
    r"(alpha|beta|rc|dev|pre)",  # alpha, beta, etc.
    r"(old|backup|archive|legacy)",  # legacy markers
]

# Phase 4: Value tags
VALUE_TAGS = [
    "active", "legacy", "alpha", "prototype", "production", "archived",
    "duplicate", "unknown", "high-value", "integrate-to-Omega",
    "candidate-for-demo", "candidate-for-deletion"
]

# FC (Feasibility Compiler) patterns
FC_PATTERNS = [
    r"srfc",
    r"tsrfc",
    r"vrfc",
    r"feasibility",
    r"deterministic",
]

class Artifact:
    def __init__(self, path: str, name: str):
        self.path = path
        self.name = name
        self.type = self._classify_type()
        self.status = "unknown"
        self.version = self._detect_version()
        self.value_tag = self._assign_value_tag()
        self.size = self._get_size()
        self.modified = self._get_modified()
    
    def _classify_type(self) -> str:
        """Classify content type"""
        ext = Path(self.name).suffix.lower()
        
        # Code
        for lang, exts in CODE_EXTENSIONS.items():
            if ext in exts:
                return f"code-{lang}"
        
        # Notebooks
        if ext in NOTEBOOK_EXTENSIONS:
            return "notebook"
        
        # Specs/Taxonomies
        if ext in SPEC_EXTENSIONS:
            return "spec"
        
        # Media
        if ext in MEDIA_EXTENSIONS:
            if ext == ".pdf":
                return "research-paper"
            return "media"
        
        # Data
        if ext in DATA_EXTENSIONS:
            return "dataset"
        
        # Directories
        if os.path.isdir(self.path):
            return "directory"
        
        return "miscellaneous"
    
    def _detect_version(self) -> Optional[str]:
        """Detect version from name/path"""
        name_lower = self.name.lower()
        path_lower = self.path.lower()
        
        for pattern in VERSION_PATTERNS:
            match = re.search(pattern, name_lower + " " + path_lower, re.IGNORECASE)
            if match:
                return match.group(1) if match.lastindex else match.group(0)
        
        return None
    
    def _assign_value_tag(self) -> str:
        """Assign value tag based on heuristics"""
        name_lower = self.name.lower()
        path_lower = self.path.lower()
        
        # High-value indicators
        if any(p in path_lower for p in ["omega", "spine", "srfc", "tsrfc", "vrfc"]):
            return "high-value"
        
        # Legacy indicators
        if any(m in name_lower for m in ["old", "backup", "archive", "legacy", "_legacy"]):
            return "legacy"
        
        # Active indicators
        if any(m in name_lower for m in ["active", "current", "main"]):
            return "active"
        
        # Prototype indicators
        if any(m in name_lower for m in ["prototype", "proto", "demo", "test"]):
            return "prototype"
        
        # Production indicators
        if any(m in name_lower for m in ["prod", "production", "release"]):
            return "production"
        
        # Archive indicators
        if "archive" in path_lower or "Archive" in self.path:
            return "archived"
        
        return "unknown"
    
    def _get_size(self) -> int:
        """Get file size in bytes"""
        try:
            if os.path.isfile(self.path):
                return os.path.getsize(self.path)
            return 0
        except:
            return 0
    
    def _get_modified(self) -> Optional[str]:
        """Get modification time"""
        try:
            return datetime.fromtimestamp(os.path.getmtime(self.path)).isoformat()
        except:
            return None
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "path": self.path,
            "type": self.type,
            "status": self.status,
            "version": self.version,
            "value_tag": self.value_tag,
            "size": self.size,
            "modified": self.modified
        }

def scan_directory(root: str, max_depth: int = 3, current_depth: int = 0) -> List[Artifact]:
    """Recursively scan directory for artifacts"""
    artifacts = []
    
    if current_depth > max_depth:
        return artifacts
    
    try:
        if not os.path.exists(root) or not os.path.isdir(root):
            return artifacts
        
        for item in os.listdir(root):
            # Skip hidden/system files
            if item.startswith('.') and item not in ['.git', '.cursor']:
                continue
            
            item_path = os.path.join(root, item)
            
            # Skip node_modules, .git, .next, etc.
            if item in ['node_modules', '.git', '.next', '__pycache__', '.venv', 'dist', 'build']:
                continue
            
            try:
                artifact = Artifact(item_path, item)
                artifacts.append(artifact)
                
                # Recurse for directories
                if os.path.isdir(item_path):
                    artifacts.extend(scan_directory(item_path, max_depth, current_depth + 1))
            except Exception as e:
                continue
    
    except PermissionError:
        pass
    except Exception as e:
        pass
    
    return artifacts

def group_duplicates(artifacts: List[Artifact]) -> Dict[str, List[Artifact]]:
    """Group artifacts by name/type for duplicate detection"""
    groups = defaultdict(list)
    
    for artifact in artifacts:
        # Normalize name for grouping
        base_name = Path(artifact.name).stem.lower()
        key = f"{base_name}_{artifact.type}"
        groups[key].append(artifact)
    
    return {k: v for k, v in groups.items() if len(v) > 1}

def group_fc_families(artifacts: List[Artifact]) -> Dict[str, List[Artifact]]:
    """Group feasibility compiler families"""
    families = defaultdict(list)
    
    for artifact in artifacts:
        name_lower = artifact.name.lower()
        path_lower = artifact.path.lower()
        
        for pattern in FC_PATTERNS:
            if pattern in name_lower or pattern in path_lower:
                families[pattern].append(artifact)
                break
    
    return dict(families)

def main():
    print("OmegaStack Filesystem Audit")
    print("=" * 50)
    
    home = os.path.expanduser("~")
    all_artifacts = []
    
    # Phase 1: Scan high-value locations
    print("\nPhase 1: Scanning high-value locations...")
    for dir_name in HIGH_VALUE_DIRS:
        dir_path = os.path.join(home, dir_name)
        if os.path.exists(dir_path):
            print(f"  Scanning {dir_name}...")
            artifacts = scan_directory(dir_path, max_depth=2)
            all_artifacts.extend(artifacts)
            print(f"    Found {len(artifacts)} items")
    
    # Also scan Omega workspace deeply
    omega_path = os.path.join(home, "Omega")
    if os.path.exists(omega_path):
        print(f"  Deep scanning Omega workspace...")
        artifacts = scan_directory(omega_path, max_depth=4)
        all_artifacts.extend(artifacts)
        print(f"    Found {len(artifacts)} items")
    
    print(f"\nTotal artifacts found: {len(all_artifacts)}")
    
    # Phase 2-4: Classification and tagging already done in Artifact class
    
    # Phase 3: Detect duplicates and versions
    print("\nPhase 3: Detecting duplicates and version groups...")
    duplicates = group_duplicates(all_artifacts)
    fc_families = group_fc_families(all_artifacts)
    
    print(f"  Found {len(duplicates)} duplicate groups")
    print(f"  Found {len(fc_families)} FC families")
    
    # Phase 5: Generate reports
    print("\nPhase 5: Generating reports...")
    
    # Report 1: Inventory Table
    inventory = [a.to_dict() for a in all_artifacts]
    
    # Report 2: Duplicate/Version Groups
    duplicate_report = {}
    for key, items in duplicates.items():
        duplicate_report[key] = [a.to_dict() for a in items]
    
    fc_families_report = {}
    for family, items in fc_families.items():
        fc_families_report[family] = [a.to_dict() for a in items]
    
    # Report 3: Migration Plan
    migration_plan = []
    for artifact in all_artifacts:
        action = "review"
        
        if "integrate-to-Omega" in artifact.value_tag or "high-value" in artifact.value_tag:
            action = "import to OmegaStack"
        elif "archived" in artifact.value_tag or "legacy" in artifact.value_tag:
            action = "archive"
        elif "candidate-for-deletion" in artifact.value_tag:
            action = "review for deletion"
        elif artifact.type.startswith("code-") and "omega" in artifact.path.lower():
            action = "integrate to OmegaStack"
        
        migration_plan.append({
            "path": artifact.path,
            "name": artifact.name,
            "type": artifact.type,
            "action": action,
            "value_tag": artifact.value_tag
        })
    
    # Write reports
    output_dir = os.path.join(home, "Omega", "OPS", "_audits")
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Report 1: Inventory
    with open(os.path.join(output_dir, f"inventory_{timestamp}.json"), "w") as f:
        json.dump(inventory, f, indent=2)
    
    # Report 2: Duplicates and Families
    with open(os.path.join(output_dir, f"duplicates_families_{timestamp}.json"), "w") as f:
        json.dump({
            "duplicates": duplicate_report,
            "fc_families": fc_families_report
        }, f, indent=2)
    
    # Report 3: Migration Plan
    with open(os.path.join(output_dir, f"migration_plan_{timestamp}.json"), "w") as f:
        json.dump(migration_plan, f, indent=2)
    
    # Generate human-readable summary
    summary_path = os.path.join(output_dir, f"audit_summary_{timestamp}.md")
    with open(summary_path, "w") as f:
        f.write("# OmegaStack Filesystem Audit Report\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        f.write(f"## Summary\n\n")
        f.write(f"- Total artifacts scanned: {len(all_artifacts)}\n")
        f.write(f"- Duplicate groups: {len(duplicates)}\n")
        f.write(f"- FC families: {len(fc_families)}\n\n")
        
        f.write("## Inventory Table (Sample)\n\n")
        f.write("| Name | Path | Type | Status | Version | Value Tag |\n")
        f.write("|------|------|------|--------|---------|-----------|\n")
        for artifact in all_artifacts[:100]:  # Sample
            f.write(f"| {artifact.name} | {artifact.path} | {artifact.type} | {artifact.status} | {artifact.version or 'N/A'} | {artifact.value_tag} |\n")
        
        f.write("\n## FC Families\n\n")
        for family, items in fc_families.items():
            f.write(f"### {family.upper()}\n")
            f.write(f"- Found {len(items)} items\n")
            for item in items[:10]:  # Sample
                f.write(f"  - {item.path}\n")
    
    print(f"\nReports written to: {output_dir}")
    print(f"  - inventory_{timestamp}.json")
    print(f"  - duplicates_families_{timestamp}.json")
    print(f"  - migration_plan_{timestamp}.json")
    print(f"  - audit_summary_{timestamp}.md")

if __name__ == "__main__":
    main()


