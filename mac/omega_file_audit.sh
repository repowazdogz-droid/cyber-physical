#!/bin/bash

# OMEGA FILE AUDIT & SYNC STATUS
# Audits all files in Omega workspace and checks GitHub/PC sync status

echo "========================================"
echo "OMEGA FILE AUDIT & SYNC STATUS"
echo "========================================"
echo ""

WORKSPACE="/Users/warre/Omega"
cd "$WORKSPACE" || exit 1

# File Statistics
echo "=== FILE STATISTICS ==="
total_files=$(find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/\.git/*' 2>/dev/null | wc -l | tr -d ' ')
echo "Total files: $total_files"

echo ""
echo "Files by type:"
find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/\.git/*' 2>/dev/null | \
  sed 's/.*\.//' | sort | uniq -c | sort -rn | head -15 | \
  awk '{printf "  %-20s %6d files\n", $2, $1}'

echo ""
echo "Largest directories:"
du -sh */ 2>/dev/null | sort -rh | head -10 | awk '{printf "  %-40s %s\n", $2, $1}'

echo ""

# Git Status
echo "=== GIT STATUS ==="
if [ -d ".git" ]; then
    echo "Repository: $(git remote get-url origin 2>/dev/null || echo 'No remote configured')"
    echo ""
    
    echo "Branch: $(git branch --show-current)"
    echo "Last commit: $(git log -1 --format='%h - %s (%ar)' 2>/dev/null)"
    echo ""
    
    echo "Uncommitted changes:"
    modified=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
    echo "  Modified/New/Deleted: $modified files"
    git status --short 2>/dev/null | head -20
    if [ "$modified" -gt 20 ]; then
        echo "  ... and $((modified - 20)) more"
    fi
    echo ""
    
    echo "Ahead/Behind remote:"
    git fetch origin 2>/dev/null
    ahead=$(git rev-list --count HEAD..origin/$(git branch --show-current) 2>/dev/null || echo "0")
    behind=$(git rev-list --count origin/$(git branch --show-current)..HEAD 2>/dev/null || echo "0")
    echo "  Ahead: $ahead commits"
    echo "  Behind: $behind commits"
    echo ""
    
    echo "Recent commits (last 10):"
    git log --oneline -10 2>/dev/null | sed 's/^/  /'
else
    echo "Not a git repository"
fi
echo ""

# GitHub Connection Test
echo "=== GITHUB CONNECTION ==="
if command -v git &> /dev/null && [ -d ".git" ]; then
    remote_url=$(git remote get-url origin 2>/dev/null)
    if [ -n "$remote_url" ]; then
        echo "Remote URL: $remote_url"
        echo ""
        echo "Testing connection..."
        if git ls-remote --heads origin 2>/dev/null | head -1 > /dev/null; then
            echo "✓ GitHub connection: SUCCESS"
            echo "Available branches:"
            git ls-remote --heads origin 2>/dev/null | sed 's|.*refs/heads/||' | sed 's/^/  - /' | head -10
        else
            echo "✗ GitHub connection: FAILED"
            echo "  Check your network connection and GitHub credentials"
        fi
    else
        echo "No GitHub remote configured"
    fi
else
    echo "Git not available or not a repository"
fi
echo ""

# PC Sync Status (checking common sync locations)
echo "=== PC SYNC STATUS ==="
echo "Checking common sync locations..."

# Check if workspace is in iCloud Drive
if [[ "$WORKSPACE" == *"iCloud Drive"* ]] || [ -d "$HOME/Library/Mobile Documents/com~apple~CloudDocs" ]; then
    echo "✓ iCloud Drive: Detected"
    icloud_path="$HOME/Library/Mobile Documents/com~apple~CloudDocs"
    if [ -d "$icloud_path" ]; then
        echo "  iCloud Drive path: $icloud_path"
        if [ -L "$WORKSPACE" ] && [[ "$(readlink "$WORKSPACE")" == *"iCloud"* ]]; then
            echo "  Status: Workspace is synced to iCloud Drive"
        else
            echo "  Status: Workspace may not be in iCloud Drive"
        fi
    fi
else
    echo "  iCloud Drive: Not detected in workspace path"
fi

# Check Dropbox
if [ -d "$HOME/Dropbox" ]; then
    echo "✓ Dropbox: Installed"
    if [[ "$WORKSPACE" == *"Dropbox"* ]]; then
        echo "  Status: Workspace is in Dropbox folder"
    else
        echo "  Status: Workspace is not in Dropbox folder"
    fi
else
    echo "  Dropbox: Not installed or not found"
fi

# Check OneDrive
if [ -d "$HOME/OneDrive" ]; then
    echo "✓ OneDrive: Installed"
    if [[ "$WORKSPACE" == *"OneDrive"* ]]; then
        echo "  Status: Workspace is in OneDrive folder"
    else
        echo "  Status: Workspace is not in OneDrive folder"
    fi
else
    echo "  OneDrive: Not installed or not found"
fi

# Check network mounts
echo ""
echo "Network mounts:"
mount | grep -E "smb|afp|nfs|cifs" | awk '{print "  " $0}' | head -5
if [ -z "$(mount | grep -E "smb|afp|nfs|cifs")" ]; then
    echo "  No network mounts detected"
fi

echo ""

# File List (summary by directory)
echo "=== FILE LIST BY DIRECTORY ==="
echo "Top-level directories:"
for dir in */; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/\.git/*' 2>/dev/null | wc -l | tr -d ' ')
        size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
        printf "  %-40s %6d files  %8s\n" "$dir" "$count" "$size"
    fi
done

echo ""

# Export full file list
echo "=== EXPORTING FULL FILE LIST ==="
output_file="$WORKSPACE/mac/omega_files_list.txt"
mkdir -p "$(dirname "$output_file")"
find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/\.git/*' 2>/dev/null | \
  sort > "$output_file"
echo "Full file list saved to: $output_file"
echo "  ($(wc -l < "$output_file" | tr -d ' ') files)"

echo ""

# Summary
echo "========================================"
echo "SUMMARY"
echo "========================================"
echo "Total files: $total_files"
echo "Modified files: $modified"
echo "GitHub: $(git ls-remote --heads origin 2>/dev/null > /dev/null && echo 'Connected ✓' || echo 'Not connected ✗')"
echo "File list: $output_file"
echo ""
echo "To sync with GitHub:"
echo "  git add ."
echo "  git commit -m 'Your message'"
echo "  git push origin $(git branch --show-current)"
echo ""
echo "========================================"
