#!/bin/bash
set -euo pipefail

# Production verification script
# Runs all security and operational checks

echo "=========================================="
echo "Omega Backup System Verification"
echo "=========================================="
echo ""

ERRORS=0

# 1. Verify no exposed DB ports
echo "[1/10] Checking for exposed database ports..."
if lsof -iTCP -sTCP:LISTEN 2>/dev/null | grep -E ':(5432|6379)\s' > /dev/null; then
    echo "  ❌ FAIL: Database ports exposed on host"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASS: No database ports exposed"
fi

if docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null | grep -E '(5432|6379)' > /dev/null; then
    echo "  ❌ FAIL: Database ports exposed in containers"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASS: No database ports exposed in containers"
fi

# 2. Verify backup container has NO docker socket mount
echo ""
echo "[2/10] Checking backup container security..."
BACKUP_ID=$(docker ps -qf name=backup 2>/dev/null || echo "")
if [ -z "$BACKUP_ID" ]; then
    echo "  ⚠️  WARN: Backup container not running"
    ERRORS=$((ERRORS + 1))
else
    INSPECT=$(docker inspect "$BACKUP_ID" 2>/dev/null)
    
    if echo "$INSPECT" | jq -e '.[0].HostConfig.Binds[]? | select(contains("docker.sock"))' > /dev/null 2>&1; then
        echo "  ❌ FAIL: Docker socket mounted"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✅ PASS: No docker socket mount"
    fi
    
    if echo "$INSPECT" | jq -e '.[0].HostConfig.Privileged == true' > /dev/null 2>&1; then
        echo "  ❌ FAIL: Container is privileged"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✅ PASS: Container not privileged"
    fi
    
    if echo "$INSPECT" | jq -e '.[0].HostConfig.ReadonlyRootfs == true' > /dev/null 2>&1; then
        echo "  ✅ PASS: Read-only root filesystem"
    else
        echo "  ❌ FAIL: Root filesystem not read-only"
        ERRORS=$((ERRORS + 1))
    fi
    
    CAPS=$(echo "$INSPECT" | jq -r '.[0].HostConfig.CapDrop[]?' 2>/dev/null | grep -c "ALL" || echo "0")
    if [ "$CAPS" -gt 0 ]; then
        echo "  ✅ PASS: Capabilities dropped"
    else
        echo "  ❌ FAIL: Capabilities not dropped"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 3. Verify repository is remote
echo ""
echo "[3/10] Checking repository configuration..."
if [ ! -f "env/.env" ]; then
    echo "  ⚠️  WARN: env/.env not found (run setup first)"
    ERRORS=$((ERRORS + 1))
else
    REPO=$(grep -E '^RESTIC_REPOSITORY=' env/.env | cut -d= -f2- || echo "")
    if [ -z "$REPO" ]; then
        echo "  ❌ FAIL: RESTIC_REPOSITORY not set"
        ERRORS=$((ERRORS + 1))
    elif echo "$REPO" | grep -E '^(s3:|sftp:)' > /dev/null; then
        echo "  ✅ PASS: Remote repository configured: ${REPO:0:20}..."
    elif echo "$REPO" | grep -E '^(/tmp|/var|/home|/root|/backup|file:)' > /dev/null; then
        echo "  ❌ FAIL: Local repository detected (not allowed)"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ⚠️  WARN: Repository format unclear: ${REPO:0:30}..."
    fi
fi

# 4. Verify backup container is running
echo ""
echo "[4/10] Checking backup container status..."
if docker compose -f compose/backup.yml ps backup 2>/dev/null | grep -q "Up"; then
    echo "  ✅ PASS: Backup container running"
else
    echo "  ❌ FAIL: Backup container not running"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verify repository accessibility
echo ""
echo "[5/10] Checking repository accessibility..."
if docker compose -f compose/backup.yml ps backup 2>/dev/null | grep -q "Up"; then
    if docker compose -f compose/backup.yml exec -T backup restic snapshots > /dev/null 2>&1; then
        echo "  ✅ PASS: Repository accessible"
    else
        echo "  ❌ FAIL: Cannot access repository"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ⚠️  WARN: Cannot check repository (container not running)"
fi

# 6. Verify snapshots exist
echo ""
echo "[6/10] Checking for snapshots..."
if docker compose -f compose/backup.yml ps backup 2>/dev/null | grep -q "Up"; then
    SNAPSHOT_COUNT=$(docker compose -f compose/backup.yml exec -T backup restic snapshots 2>/dev/null | grep -c "snapshot" || echo "0")
    SNAPSHOT_COUNT=$(echo "$SNAPSHOT_COUNT" | tr -d '\n' | tr -d ' ')
    if [ "${SNAPSHOT_COUNT:-0}" -gt 0 ] 2>/dev/null; then
        echo "  ✅ PASS: $SNAPSHOT_COUNT snapshot(s) found"
    else
        echo "  ⚠️  WARN: No snapshots found (run backup first)"
    fi
else
    echo "  ⚠️  WARN: Cannot check snapshots (container not running)"
fi

# 7. Run health check
echo ""
echo "[7/10] Running health check..."
if docker compose -f compose/backup.yml ps backup 2>/dev/null | grep -q "Up"; then
    if ./scripts/health-check.sh > /dev/null 2>&1; then
        echo "  ✅ PASS: Health check passed"
    else
        echo "  ❌ FAIL: Health check failed"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ⚠️  WARN: Cannot run health check (container not running)"
fi

# 8. Verify cron is running
echo ""
echo "[8/10] Checking cron service..."
if docker compose -f compose/backup.yml ps backup 2>/dev/null | grep -q "Up"; then
    if docker compose -f compose/backup.yml exec -T backup ps aux 2>/dev/null | grep -E '[c]rond|[c]ron' > /dev/null; then
        echo "  ✅ PASS: Cron service running"
    else
        echo "  ❌ FAIL: Cron service not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ⚠️  WARN: Cannot check cron (container not running)"
fi

# 9. Verify lock file mechanism
echo ""
echo "[9/10] Checking backup lock mechanism..."
if grep -q "flock" backups/backup.sh 2>/dev/null; then
    echo "  ✅ PASS: Lock file mechanism present"
else
    echo "  ❌ FAIL: Lock file mechanism missing"
    ERRORS=$((ERRORS + 1))
fi

# 10. Verify retention policy
echo ""
echo "[10/10] Checking retention policy..."
if grep -q "keep-daily 7" backups/backup.sh 2>/dev/null && \
   grep -q "keep-weekly 4" backups/backup.sh 2>/dev/null && \
   grep -q "keep-monthly 6" backups/backup.sh 2>/dev/null; then
    echo "  ✅ PASS: Retention policy enforced (7/4/6)"
else
    echo "  ❌ FAIL: Retention policy incorrect"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ VERIFICATION PASSED"
    echo "All checks completed successfully"
    exit 0
else
    echo "❌ VERIFICATION FAILED"
    echo "$ERRORS error(s) found"
    echo ""
    echo "Next steps:"
    echo "  1. Copy env/.env.example to env/.env and configure"
    echo "  2. Run: docker compose -f compose/backup.yml up -d --build"
    echo "  3. Run: docker compose -f compose/backup.yml exec backup /backups/backup.sh"
    exit 1
fi
