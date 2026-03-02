#!/bin/sh
set -euo pipefail

# Production backup orchestrator
# Exits non-zero on any failure

LOCK_FILE="/tmp/backup.lock"
LOG_FILE="${LOG_FILE:-/var/log/backup.log}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$TIMESTAMP] $*" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $*" >&2
    exit 1
}

# Acquire lock
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    error "Backup already in progress (lock file exists)"
fi

# Verify restic repository is accessible
restic snapshots > /dev/null 2>&1 || error "Cannot access restic repository"

log "Starting backup run"

# Backup postgres
log "Backing up postgres..."
/backups/postgres.sh || error "Postgres backup failed"

# Backup redis
log "Backing up redis..."
/backups/redis.sh || error "Redis backup failed"

# Backup volumes
log "Backing up volumes..."
/backups/volumes.sh || error "Volume backup failed"

# Backup configs
log "Backing up configs..."
restic backup \
    --exclude-caches \
    --tag config \
    /backup-config/compose \
    /backup-config/env \
    || error "Config backup failed"

# Enforce retention policy
log "Enforcing retention policy..."
restic forget \
    --keep-daily 7 \
    --keep-weekly 4 \
    --keep-monthly 6 \
    --prune \
    || error "Retention enforcement failed"

# Verify repository integrity
log "Verifying repository integrity..."
restic check --read-data-subset=5% || error "Integrity check failed"

SNAPSHOT_ID=$(restic snapshots --json --last | jq -r '.[0].id // empty')
log "Backup complete. Snapshot: $SNAPSHOT_ID"

log "Backup run complete"

# Optional webhook notification
if [ -n "${HEALTHCHECK_WEBHOOK:-}" ]; then
    curl -fsS -m 10 --retry 3 "$HEALTHCHECK_WEBHOOK" > /dev/null 2>&1 || true
fi

exit 0
