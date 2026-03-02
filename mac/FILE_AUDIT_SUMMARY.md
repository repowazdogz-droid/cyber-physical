# Omega File Audit & Sync Status

**Generated:** $(date)

## Summary

- **Total Files:** 6,396 files
- **GitHub:** Connected ✓
- **Repository:** `repowazdogz-droid/omega-protocol`
- **Branch:** `main`
- **Status:** 56 modified files, 18 commits behind remote

## File Statistics

### By Type
- JSON: 1,673 files
- Python: 1,365 files
- Python compiled: 1,148 files
- TypeScript: 608 files
- Swift: 430 files
- Markdown: 353 files
- TSX: 218 files
- YAML: 167 files

### Largest Directories
- `omega-site/`: 534M
- `trauma-informed-education-system/`: 440M
- `reflexive-ui/`: 392M
- `orientation-lab/`: 105M
- `constraint-universe/`: 94M

## GitHub Connection

**Status:** ✓ Connected
**Remote:** `https://github.com/repowazdogz-droid/omega-protocol`

### Sync Status
- **Ahead:** 0 commits
- **Behind:** 18 commits
- **Uncommitted:** 56 files

### To Sync with GitHub:
```bash
cd /Users/warre/Omega
git add .
git commit -m "Your commit message"
git pull origin main  # Pull latest changes first
git push origin main
```

## PC Sync Options

### Option 1: GitHub (Recommended)
Use Git to sync between Mac and PC:
1. On Mac: `git push origin main`
2. On PC: `git clone <repo-url>` or `git pull origin main`

### Option 2: iCloud Drive
Move workspace to iCloud Drive for automatic sync:
```bash
# Move to iCloud Drive
mv /Users/warre/Omega ~/Library/Mobile\ Documents/com~apple~CloudDocs/Omega
# Create symlink if needed
ln -s ~/Library/Mobile\ Documents/com~apple~CloudDocs/Omega /Users/warre/Omega
```

### Option 3: Network Share
Mount PC drive and sync:
```bash
# Mount PC share (example)
mkdir -p ~/PC_Share
mount_smbfs //username@pc-ip/Omega ~/PC_Share
rsync -av /Users/warre/Omega/ ~/PC_Share/
```

### Option 4: Dropbox/OneDrive
Install Dropbox or OneDrive and move workspace to sync folder.

## File List

Complete file list saved to: `mac/omega_files_list.txt` (6,396 files)

## Audit Script

Run the audit script anytime:
```bash
bash /Users/warre/Omega/mac/omega_file_audit.sh
```
