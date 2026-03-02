# Quick Reference: MacBook → PC Sync via Tailscale

## Current Situation

✅ **MacBook:** All Omega files at `/Users/warre/Omega` (6,396 files)  
✅ **PC:** Connected via Tailscale VPN  
⏳ **Next:** Set up file access/sync from PC to MacBook

---

## Quick Setup (3 Steps)

### 1. Install Tailscale on MacBook
```bash
# Download from: https://tailscale.com/download/mac
# Or: brew install --cask tailscale
```

### 2. Get MacBook Tailscale IP
```bash
tailscale ip -4
# Save this IP - you'll need it on PC
```

### 3. Access from PC

**Option A: Windows File Explorer (Easiest)**
- Open File Explorer → Map Network Drive
- Folder: `\\<macbook-ip>\Omega` (use Tailscale IP from step 2)
- Username: Your Mac username
- Password: Your Mac password

**Option B: Git Sync (Best for Code)**
```bash
# On MacBook:
cd /Users/warre/Omega
git add .
git commit -m "Sync checkpoint"
git push origin main

# On PC:
git clone https://github.com/repowazdogz-droid/omega-protocol.git
# Or pull updates:
git pull origin main
```

**Option C: rsync Script (Best for Full Sync)**
- Edit `mac/sync-to-pc.sh` with your PC details
- Run: `bash mac/sync-to-pc.sh`

---

## Files Created

1. **`mac/TAILSCALE_SYNC_GUIDE.md`** - Complete setup guide
2. **`mac/sync-to-pc.sh`** - Automated sync script (needs configuration)
3. **`mac/QUICK_SYNC_REFERENCE.md`** - This file

---

## Next Steps

1. Install Tailscale on MacBook (if not installed)
2. Get MacBook Tailscale IP: `tailscale ip -4`
3. Choose sync method (File Explorer, Git, or rsync)
4. Test access from PC

See `mac/TAILSCALE_SYNC_GUIDE.md` for detailed instructions.
