# Phase 5: Security & Power Configuration — Status Report

**Date:** February 7, 2026  
**Status:** Configuration Scripts Created — Manual Execution Required

---

## ⚠️ MANUAL EXECUTION REQUIRED

Phase 5 requires sudo access and cannot be fully automated. Use the provided scripts and commands below.

---

## ✅ CONFIGURATION SCRIPTS CREATED

### Script 1: Automated Configuration (`phase5-security.sh`)
**Location:** `~/omega-data/phase5-security.sh`
- Checks current settings
- Configures firewall, power, SSH
- Provides status reports
- **Note:** Requires sudo password input

### Script 2: Command Reference (`phase5-commands.sh`)
**Location:** `~/omega-data/phase5-commands.sh`
- Lists all commands to run manually
- Copy-paste friendly format

---

## 📋 CONFIGURATION STEPS

### 5.1 Firewall Configuration

**Commands:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall on
```

**Verify:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
# Should show: "Firewall is On"
```

**Expected Result:**
- Firewall enabled
- Stealth mode enabled (doesn't respond to ping probes)
- Block all incoming connections by default

---

### 5.2 FileVault Encryption

**Check Status:**
```bash
fdesetup status
```

**If Not Enabled:**
1. Open **System Settings** > **Privacy & Security** > **FileVault**
2. Click **Turn On FileVault**
3. Follow prompts to enable encryption
4. **IMPORTANT:** Save recovery key to password manager

**Verify:**
```bash
fdesetup status
# Should show: "FileVault is On"
```

**Expected Result:**
- FileVault encryption enabled
- Recovery key saved to password manager

---

### 5.3 Power & Sleep Configuration

**Commands:**
```bash
sudo pmset -a sleep 0
sudo pmset -a disksleep 0
sudo pmset -a displaysleep 0
sudo pmset -a autorestart 1
sudo pmset -a powernap 0
```

**Verify:**
```bash
pmset -g | grep -E "(sleep|disksleep|displaysleep|autorestart|powernap)"
```

**Expected Result:**
- `sleep = 0` (never sleep)
- `disksleep = 0` (disks never sleep)
- `displaysleep = 0` (display never sleeps)
- `autorestart = 1` (auto-restart after power loss)
- `powernap = 0` (Power Nap disabled)

**Rationale:**
- Mac Mini should run 24/7
- Auto-restart ensures services resume after power loss
- No sleep prevents service interruptions

---

### 5.4 SSH Configuration

**Check Status:**
```bash
sudo systemsetup -getremotelogin
```

**Disable SSH (Use Tailscale SSH Instead):**
```bash
sudo systemsetup -setremotelogin off
```

**Verify:**
```bash
sudo systemsetup -getremotelogin
# Should show: "Remote Login: Off"
```

**Expected Result:**
- SSH disabled
- Remote access via Tailscale SSH only
- More secure (no exposed ports)

**Test Tailscale SSH:**
```bash
# From remote device:
tailscale ssh omega
```

---

### 5.5 Credentials Backup

**Manual Actions Required:**

1. **Backup `.env` file:**
   ```bash
   # Copy to password manager or secure location
   cat ~/omega-data/.env
   ```
   Contains:
   - `POSTGRES_PASSWORD`
   - `API_SECRET`
   - `ANTHROPIC_API_KEY` (if set)

2. **Save FileVault Recovery Key:**
   - Stored in password manager
   - Critical for disk recovery

3. **Document Tailscale Access:**
   - Admin URL: https://admin.tailscale.com
   - Hostname: `omega`
   - Access method: Tailscale SSH

**Expected Result:**
- All credentials backed up securely
- Recovery keys accessible
- Access methods documented

---

## 🔍 VERIFICATION CHECKLIST

After configuration, verify:

- [ ] Firewall enabled: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`
- [ ] FileVault enabled: `fdesetup status`
- [ ] Sleep disabled: `pmset -g | grep sleep`
- [ ] Auto-restart enabled: `pmset -g | grep autorestart`
- [ ] SSH disabled: `sudo systemsetup -getremotelogin`
- [ ] Tailscale SSH works: `tailscale ssh omega` (from remote)
- [ ] Credentials backed up
- [ ] Recovery keys saved

---

## 📊 QUICK VERIFICATION SCRIPT

Run this to check all settings:

```bash
echo "=== Security & Power Status ==="
echo ""
echo "Firewall:"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
echo ""
echo "FileVault:"
fdesetup status
echo ""
echo "Power Settings:"
pmset -g | grep -E "(sleep|disksleep|displaysleep|autorestart|powernap)"
echo ""
echo "SSH:"
sudo systemsetup -getremotelogin
echo ""
echo "Tailscale:"
tailscale status | head -3
```

---

## 🎯 EXPECTED FINAL STATE

After Phase 5 completion:

1. **Firewall:**
   - Enabled with stealth mode
   - Blocking all incoming connections
   - Only Tailscale traffic allowed

2. **FileVault:**
   - Encryption enabled
   - Recovery key secured

3. **Power:**
   - Never sleeps
   - Auto-restarts after power loss
   - Always available

4. **SSH:**
   - Disabled (no exposed ports)
   - Tailscale SSH only

5. **Credentials:**
   - Backed up securely
   - Recovery keys accessible

---

## 📝 NOTES

- **Firewall:** Blocks all incoming except Tailscale (which uses WireGuard)
- **FileVault:** Full disk encryption protects data at rest
- **Power:** 24/7 operation ensures services always available
- **SSH:** Disabled reduces attack surface; Tailscale SSH is more secure
- **Auto-restart:** Critical for unattended operation

---

## 🚀 NEXT STEPS

Once Phase 5 is complete:
- Proceed to Phase 6: Testing (Acceptance Tests)
- Verify all security settings
- Test power loss recovery
- Verify Tailscale SSH access

---

## 🔧 TROUBLESHOOTING

**If firewall blocks Tailscale:**
- Tailscale uses WireGuard and should work through firewall
- Check: `tailscale status`

**If FileVault won't enable:**
- Ensure you have admin privileges
- Check disk space
- May require restart

**If power settings don't persist:**
- Check for conflicting power management software
- Verify sudo access
- Check: `pmset -g`

**If Tailscale SSH doesn't work:**
- Verify Tailscale is running: `tailscale status`
- Check MagicDNS is enabled
- Verify hostname: `tailscale status | grep omega`
