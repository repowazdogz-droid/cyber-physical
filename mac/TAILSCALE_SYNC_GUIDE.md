# Tailscale File Sync Guide: MacBook → PC

## Current Setup

**MacBook:** All Omega files located at `/Users/warre/Omega`  
**PC:** Connected via Tailscale VPN  
**Goal:** Access and sync MacBook files from PC

---

## Step 1: Install & Configure Tailscale on MacBook

### Install Tailscale
```bash
# Download from: https://tailscale.com/download/mac
# Or via Homebrew:
brew install --cask tailscale
```

### Sign In & Configure
1. Open Tailscale app
2. Sign in with your Tailscale account
3. Set hostname (e.g., `omega-macbook` or `macbook`)
4. Enable MagicDNS at https://admin.tailscale.com
5. Verify connection: `tailscale status`

### Get MacBook Tailscale IP
```bash
tailscale ip -4
# Example output: 100.x.x.x
```

---

## Step 2: Enable File Sharing on MacBook

### Enable SMB File Sharing
```bash
# Enable SMB sharing
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.smbd.plist

# Or via System Preferences:
# System Settings → General → Sharing → File Sharing → ON
```

### Configure Share for Omega Directory
```bash
# Add Omega directory to shared folders
sudo sharing -a /Users/warre/Omega -S omega-workspace
```

### Set Permissions
```bash
# Ensure your user has read/write access
chmod -R 755 /Users/warre/Omega
```

### Create Share User (Optional)
```bash
# Create dedicated share user
sudo dscl . -create /Users/omega-share
sudo dscl . -create /Users/omega-share UserShell /bin/bash
sudo dscl . -create /Users/omega-share RealName "Omega Share User"
sudo dscl . -passwd /Users/omega-share <password>
```

---

## Step 3: Access from PC (Windows)

### Option A: Windows File Explorer (SMB)

1. **Get MacBook Tailscale IP:**
   ```bash
   # On MacBook, run:
   tailscale ip -4
   ```

2. **Map Network Drive on PC:**
   - Open File Explorer
   - Right-click "This PC" → "Map network drive"
   - Drive: `Z:`
   - Folder: `\\100.x.x.x\Omega` (replace with MacBook Tailscale IP)
   - Check "Reconnect at sign-in"
   - Click "Connect using different credentials"
   - Username: `macbook-username` (your Mac username)
   - Password: (your Mac password)

3. **Access Files:**
   - Files accessible at `Z:\Omega\...`
   - Can browse, copy, edit directly

### Option B: Windows File Explorer (via Hostname)

If MagicDNS enabled:
- Folder: `\\omega-macbook.local\Omega` or `\\macbook.local\Omega`
- Uses Tailscale hostname instead of IP

### Option C: rsync via Tailscale SSH

**On PC (if Windows with WSL or Linux):**
```bash
# Install rsync on PC
# Windows: Install WSL or use Git Bash
# Linux: sudo apt install rsync

# Sync from MacBook to PC
rsync -avz --progress omega-macbook.local:/Users/warre/Omega/ /path/to/pc/destination/

# Or using Tailscale IP
rsync -avz --progress 100.x.x.x:/Users/warre/Omega/ /path/to/pc/destination/
```

### Option D: Git Sync (Recommended for Code)

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
cd omega-protocol
git pull origin main
```

---

## Step 4: Automated Sync Scripts

### MacBook → PC Sync Script (rsync)

**Create on MacBook:** `mac/sync-to-pc.sh`
```bash
#!/bin/bash
# Sync Omega workspace to PC via Tailscale

PC_TAILSCALE_IP="100.x.x.x"  # Replace with PC Tailscale IP
PC_USER="pc-username"
PC_PATH="/path/to/destination/Omega"

echo "Syncing Omega workspace to PC..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.pyc' \
  --exclude '__pycache__' \
  --exclude '.DS_Store' \
  /Users/warre/Omega/ \
  ${PC_USER}@${PC_TAILSCALE_IP}:${PC_PATH}/

echo "Sync complete!"
```

**Make executable:**
```bash
chmod +x mac/sync-to-pc.sh
```

**Run sync:**
```bash
bash mac/sync-to-pc.sh
```

### PC → MacBook Sync Script

**Create on PC:** `sync-from-macbook.sh`
```bash
#!/bin/bash
# Pull Omega workspace from MacBook via Tailscale

MACBOOK_TAILSCALE_IP="100.x.x.x"  # Replace with MacBook Tailscale IP
MACBOOK_USER="warre"
MACBOOK_PATH="/Users/warre/Omega"
LOCAL_PATH="/path/to/local/Omega"

echo "Syncing Omega workspace from MacBook..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.pyc' \
  --exclude '__pycache__' \
  --exclude '.DS_Store' \
  ${MACBOOK_USER}@${MACBOOK_TAILSCALE_IP}:${MACBOOK_PATH}/ \
  ${LOCAL_PATH}/

echo "Sync complete!"
```

---

## Step 5: Verify Tailscale Connection

### On MacBook
```bash
# Check Tailscale status
tailscale status

# Test connectivity to PC
ping <pc-tailscale-ip>
# Or if MagicDNS enabled:
ping <pc-hostname>.local
```

### On PC
```bash
# Windows: Test connectivity
ping <macbook-tailscale-ip>
# Or:
ping omega-macbook.local
```

---

## Step 6: Security Considerations

### Firewall Rules
```bash
# On MacBook, allow Tailscale subnet
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/sbin/smbd
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/sbin/smbd
```

### SSH Access (Alternative to SMB)
```bash
# Enable Tailscale SSH on MacBook
# At https://admin.tailscale.com → Settings → SSH

# From PC:
ssh warre@omega-macbook.local
# Or:
ssh warre@<macbook-tailscale-ip>
```

---

## Quick Reference

### MacBook Tailscale Info
```bash
# Get IP
tailscale ip -4

# Get hostname
hostname

# Check status
tailscale status

# Test PC connectivity
ping <pc-tailscale-ip>
```

### Common Commands

**SMB Share Status:**
```bash
sudo sharing -l
```

**Test SMB from PC:**
```bash
# Windows CMD:
net use Z: \\<macbook-ip>\Omega /user:<macbook-username> <password>
```

**rsync One-way Sync:**
```bash
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  omega-macbook.local:/Users/warre/Omega/ \
  ./Omega/
```

---

## Troubleshooting

### Can't Connect from PC
1. Verify Tailscale is running on both devices
2. Check firewall settings
3. Verify SMB is enabled: `sudo sharing -l`
4. Test ping: `ping <macbook-ip>`

### Slow Transfer Speeds
- Use rsync instead of SMB for large syncs
- Consider Git for code files
- Check Tailscale network quality

### Permission Denied
- Check file permissions: `ls -la /Users/warre/Omega`
- Verify SMB user credentials
- Try SSH instead of SMB

---

## Recommended Workflow

**For Code/Development:**
- Use Git (push from MacBook, pull on PC)
- Fast, version-controlled, handles conflicts

**For Large Files/Data:**
- Use rsync via Tailscale SSH
- Efficient, handles deletions, resume support

**For Quick Access/Browsing:**
- Use SMB network drive mapping
- Direct file access, no sync needed

---

## Next Steps

1. Install Tailscale on MacBook (if not installed)
2. Enable SMB file sharing
3. Get MacBook Tailscale IP: `tailscale ip -4`
4. Map network drive on PC
5. Test access from PC
6. Set up automated sync if needed
