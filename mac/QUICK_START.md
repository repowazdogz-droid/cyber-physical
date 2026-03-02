# Quick Start: Sync MacBook → PC (omega-rtx)

## Your Setup

- **MacBook:** `/Users/warre/Omega` (6,396 files)
- **PC:** `omega-rtx` at `100.71.44.93` ✅ Connected via Tailscale

---

## Fastest Method: Windows File Explorer

### Step 1: Enable File Sharing on MacBook

```bash
# Open System Settings → General → Sharing → File Sharing → ON
# Or via Terminal:
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.smbd.plist
```

### Step 2: Map Network Drive on PC

1. Open File Explorer
2. Right-click "This PC" → "Map network drive"
3. Drive: `Z:`
4. Folder: `\\100.71.44.93\Omega`
5. Username: `warre` (your Mac username)
6. Password: (your Mac password)
7. ✅ Check "Reconnect at sign-in"
8. Click "Finish"

**Done!** Files now accessible at `Z:\Omega\...`

---

## Alternative: Git Sync (Best for Code)

**On MacBook:**
```bash
cd /Users/warre/Omega
git add .
git commit -m "Sync checkpoint"
git push origin main
```

**On PC:**
```bash
git clone https://github.com/repowazdogz-droid/omega-protocol.git
# Or pull updates:
cd omega-protocol && git pull origin main
```

---

## Automated Sync Script

**Edit `mac/sync-to-pc.sh`:**
- Set `PC_USER` = your PC username
- Set `PC_PATH` = destination path (e.g., `/home/username/Omega`)

**Run:**
```bash
bash mac/sync-to-pc.sh
```

---

## Need Help?

See `mac/TAILSCALE_SYNC_GUIDE.md` for detailed instructions.
