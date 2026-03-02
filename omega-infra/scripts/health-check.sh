#!/bin/bash
set -euo pipefail

# Backup health check
# Exits 0 if healthy, non-zero if unhealthy

HEALTHY=0

# Check backup container is running
if ! docker compose -f compose/backup.yml ps backup | grep -q "Up"; then
    echo "UNHEALTHY: Backup container not running"
    exit 1
fi

# Verify repository is reachable
if ! docker compose -f compose/backup.yml exec -T backup restic snapshots > /dev/null 2>&1; then
    echo "UNHEALTHY: Cannot access restic repository"
    exit 1
fi

# Check for recent backup (within last 26 hours)
LATEST_BACKUP=$(docker compose -f compose/backup.yml exec -T backup restic snapshots --json --last | jq -r '.[0].time // empty')
if [ -z "$LATEST_BACKUP" ]; then
    echo "UNHEALTHY: No backups found"
    exit 1
fi

# Parse ISO8601 timestamp
BACKUP_TIME=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LATEST_BACKUP" +%s 2>/dev/null || date -d "$LATEST_BACKUP" +%s 2>/dev/null || echo "0")
CURRENT_TIME=$(date +%s)

if [ "$BACKUP_TIME" = "0" ]; then
    echo "UNHEALTHY: Cannot parse backup timestamp"
    exit 1
fi

AGE_HOURS=$(( (CURRENT_TIME - BACKUP_TIME) / 3600 ))

if [ $AGE_HOURS -ge 26 ]; then
    echo "UNHEALTHY: Last backup is $AGE_HOURS hours old (threshold: 26)"
    exit 1
fi

echo "HEALTHY: Last backup $AGE_HOURS hours ago"
exit 0
