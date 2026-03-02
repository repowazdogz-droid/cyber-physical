# PC Setup: omega-rtx (100.71.44.93)

## PC Information

- **Hostname:** `omega-rtx`
- **Tailscale IP:** `100.71.44.93`
- **Status:** ✅ Connected via Tailscale

---

## Quick Access Methods

### Method 1: Windows File Explorer (SMB)

1. **Enable SMB on MacBook:**
   ```bash
   # System Settings → General → Sharing → File Sharing → ON
   # Or via command line:
   sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.smbd.plist
   ```

2. **Map Network Drive on PC:**
   - Open File Explorer
   - Right-click "This PC" → "Map network drive"
   - Drive: `Z:`
   - Folder: `\\100.71.44.93\Omega` or `\\omega-rtx.local\Omega`
   - Username: Your Mac username (e.g., `warre`)
   - Password: Your Mac password
   - Check "Reconnect at sign-in"

3. **Access Files:**
   - Files accessible at `Z:\Omega\...`
   - Can browse, copy, edit directly

### Method 2: Git Sync (Recommended for Code)

**On MacBook:**
```bash
cd /Users/warre/Omega
git add .
git commit -m "Sync checkpoint"
git push origin main
```

**On PC (omega-rtx):**
```bash
# Clone (first time):
git clone https://github.com/repowazdogz-droid/omega-protocol.git

# Or pull updates:
cd omega-protocol
git pull origin main
```

### Method 3: rsync Script (Full Sync)

**Configure the sync script:**

1. Edit `mac/sync-to-pc.sh`
2. Set `PC_USER` (your PC username)
3. Set `PC_PATH` (destination path on PC)

**Examples:**
- Linux: `PC_PATH="/home/username/Omega"`
- Windows WSL: `PC_PATH="/home/username/Omega"`
- Windows SMB: Use Method 1 instead

**Run sync:**
```bash
bash mac/sync-to-pc.sh
```

### Method 4: SSH + rsync (Linux/WSL)

**Test SSH connection:**
```bash
# From MacBook:
ssh <pc-username>@omega-rtx.local
# Or:
ssh <pc-username>@100.71.44.93
```

**Manual rsync:**
```bash
# From MacBook:
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.pyc' \
  /Users/warre/Omega/ \
  <pc-username>@omega-rtx.local:/path/to/destination/Omega/
```

---

## Test Connectivity

**From MacBook:**
```bash
# Test ping
ping -c 3 omega-rtx.local
# Or:
ping -c 3 100.71.44.93

# Test SSH (if enabled)
ssh <pc-username>@omega-rtx.local
```

**From PC (omega-rtx):**
```bash
# Get MacBook Tailscale IP (after Tailscale is installed on MacBook)
# Then test:
ping <macbook-tailscale-ip>
```

---

## Next Steps

1. ✅ PC identified: `omega-rtx` (100.71.44.93)
2. ⏳ Install Tailscale on MacBook (if not installed)
3. ⏳ Enable SMB sharing on MacBook (for File Explorer access)
4. ⏳ Configure sync script with PC username and path
5. ⏳ Test connectivity from MacBook to PC

---

## Files Created

- `mac/sync-to-pc.sh` - Pre-configured with PC IP/hostname (needs username/path)
- `mac/PC_SETUP.md` - This file
- `mac/TAILSCALE_SYNC_GUIDE.md` - Complete guide
