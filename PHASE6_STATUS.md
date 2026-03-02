# Phase 6: Testing — Status Report

**Date:** February 7, 2026  
**Status:** Test Suite Created — Ready to Execute

---

## ✅ TEST SUITE CREATED

### Automated Test Script
**Location:** `~/omega-data/phase6-tests.sh`
- Runs all 10 acceptance tests
- Provides pass/fail results
- Summary report at end
- Exit code 0 if all pass, 1 if any fail

---

## 📋 ACCEPTANCE TESTS

### Test 1: Reboot Survival
**Verifies:** System survives reboot and services auto-start

**Checks:**
- All 6 containers running
- Ollama responding
- Health endpoint accessible
- Tailscale connected

**Expected:** All services up within 3 minutes of boot

---

### Test 2: Container Recovery
**Verifies:** Containers auto-restart on failure

**Test:** Kills Postgres container, waits 5 seconds, verifies restart

**Expected:** Container restarts automatically (restart: unless-stopped)

---

### Test 3: Remote Access
**Verifies:** Tailscale SSH and health endpoint accessible remotely

**Checks:**
- Tailscale IP assigned
- Health endpoint accessible via Tailscale IP

**Expected:** Can access `http://omega:3400/health` from remote device

---

### Test 4: Backup/Restore
**Verifies:** Backup creation and integrity

**Checks:**
- Backup file exists
- Backup file is valid (gunzip -t)

**Expected:** Valid backup file in `~/omega-data/backups/`

---

### Test 5: Embeddings
**Verifies:** Embedding generation works

**Test:**
1. Creates test decision via API
2. Runs embedding script
3. Verifies embedding populated in database

**Expected:** Embedding vector created for test decision

---

### Test 6: Transcription
**Verifies:** Audio transcription pipeline works

**Test:**
1. Creates test audio file (1 second silence)
2. Runs transcription script
3. Verifies transcript file created

**Expected:** Transcript file created in `~/omega-data/transcripts/`

---

### Test 7: Semantic Search
**Verifies:** Semantic search returns ranked results

**Test:**
1. Creates 2 test decisions with different topics
2. Generates embeddings
3. Searches for related query
4. Verifies results returned

**Expected:** Search returns ranked results with similarity scores

---

### Test 8: Automations
**Verifies:** Launch agents loaded and running

**Checks:**
- At least 6 Omega agents loaded
- Health log file exists

**Expected:** All automation agents active

---

### Test 9: Power Loss Recovery
**Verifies:** Auto-restart after power loss configured

**Checks:**
- `autorestart = 1` in power settings

**Expected:** System auto-boots after power loss

---

### Test 10: Encryption
**Verifies:** FileVault encryption enabled

**Checks:**
- FileVault status shows "FileVault is On"

**Expected:** Full disk encryption active

---

## 🚀 EXECUTION

### Run All Tests
```bash
cd ~/omega-data
./phase6-tests.sh
```

### Run Individual Tests
Tests can be run individually by commenting out others in the script.

### Expected Output
```
=== Phase 6: Acceptance Tests ===

Test 1: Reboot Survival
  ✓ PASS

Test 2: Container Recovery
  ✓ PASS

...

=== Test Summary ===
Total tests: 10
Passed: 10
Failed: 0

✓ ALL TESTS PASSED
```

---

## 📊 VERIFICATION COMMANDS

After running tests, verify manually:

```bash
# Check containers
docker compose ps

# Check health
curl http://localhost:3400/health | jq .

# Check agents
launchctl list | grep omega

# Check backups
ls -lh ~/omega-data/backups/

# Check logs
tail ~/omega-data/logs/health.log
```

---

## 🎯 EXPECTED RESULTS

All 10 tests should pass:

1. ✓ Reboot survival — Services auto-start
2. ✓ Container recovery — Auto-restart works
3. ✓ Remote access — Tailscale accessible
4. ✓ Backup/restore — Backups valid
5. ✓ Embeddings — Generation works
6. ✓ Transcription — Pipeline works
7. ✓ Semantic search — Returns results
8. ✓ Automations — Agents loaded
9. ✓ Power loss recovery — Auto-restart configured
10. ✓ Encryption — FileVault enabled

---

## 🔧 TROUBLESHOOTING

**If Test 1 fails:**
- Check containers: `docker compose ps`
- Check Ollama: `curl http://localhost:11434/api/tags`
- Check Tailscale: `tailscale status`

**If Test 2 fails:**
- Check restart policy: `docker inspect omega-postgres | grep RestartPolicy`
- Check logs: `docker compose logs postgres`

**If Test 3 fails:**
- Verify Tailscale: `tailscale status`
- Check MagicDNS: Enable at admin.tailscale.com
- Test manually: `curl http://omega:3400/health`

**If Test 5 fails:**
- Check Ollama: `curl http://localhost:11434/api/tags`
- Check API: `curl http://localhost:3100/health`
- Check logs: `tail ~/omega-data/logs/embeddings-*.log`

**If Test 6 fails:**
- Verify Whisper: `test -f ~/whisper.cpp/main`
- Verify model: `test -f ~/whisper.cpp/models/ggml-medium.bin`
- Check ffmpeg: `which ffmpeg`

**If Test 7 fails:**
- Verify embeddings generated: `docker exec omega-postgres psql -U omega omega -c "SELECT COUNT(*) FROM decisions WHERE embedding IS NOT NULL;"`
- Check API logs: `docker compose logs api`

**If Test 8 fails:**
- Load agents: `~/omega-data/phase4-load-agents.sh`
- Check: `launchctl list | grep omega`

**If Test 9 fails:**
- Configure: `sudo pmset -a autorestart 1`
- Verify: `pmset -g | grep autorestart`

**If Test 10 fails:**
- Enable FileVault: System Settings > Privacy & Security > FileVault
- Verify: `fdesetup status`

---

## 📝 NOTES

- **Test Cleanup:** Tests create temporary data (decisions, audio files) and clean up automatically
- **Timing:** Some tests include delays to allow async operations (embeddings, transcription)
- **Dependencies:** Tests require all services running and Ollama available
- **Non-Destructive:** Tests don't modify production data (uses test IDs)

---

## 🚀 NEXT STEPS

Once all tests pass:
- Proceed to Phase 7: Seed Data (enter real OMEGA decisions)
- Begin daily use
- Monitor logs and health endpoint

---

## ✅ SUCCESS CRITERIA

Phase 6 is complete when:
- All 10 tests pass
- No critical failures
- All services operational
- Automation working
- Security configured
