#!/bin/sh
set -euo pipefail

# Redis backup via synchronous BGSAVE
# Authenticates, triggers save, polls for completion with dual verification

STAGING_DIR="/staging/redis"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"
REDIS_BACKUP_TIMEOUT="${REDIS_BACKUP_TIMEOUT:-600}"
POLL_INTERVAL=5

mkdir -p "$STAGING_DIR"

# Build redis-cli command with auth
REDIS_CLI_CMD="redis-cli --no-auth-warning -h $REDIS_HOST -p $REDIS_PORT"
if [ -n "$REDIS_PASSWORD" ]; then
    REDIS_CLI_CMD="$REDIS_CLI_CMD -a $REDIS_PASSWORD"
fi

# Capture initial LASTSAVE before triggering BGSAVE
LASTSAVE_INITIAL=$($REDIS_CLI_CMD LASTSAVE 2>/dev/null || echo "0")

# Trigger BGSAVE
if ! $REDIS_CLI_CMD BGSAVE > /dev/null 2>&1; then
    echo "ERROR: Failed to trigger Redis BGSAVE" >&2
    exit 1
fi

# Poll for completion: both rdb_bgsave_in_progress:0 AND LASTSAVE increased
START_TIME=$(date +%s)
TIMEOUT=$REDIS_BACKUP_TIMEOUT
LAST_LOG_TIME=$START_TIME
ITERATION=0

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    # Log progress every 30 seconds
    if [ $((CURRENT_TIME - LAST_LOG_TIME)) -ge 30 ]; then
        echo "Redis BGSAVE in progress: ${ELAPSED}s elapsed..."
        LAST_LOG_TIME=$CURRENT_TIME
    fi
    
    # Check timeout
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo "ERROR: Redis BGSAVE timeout after ${TIMEOUT}s" >&2
        echo "=== DIAGNOSTIC INFO ===" >&2
        echo "Persistence:" >&2
        $REDIS_CLI_CMD INFO persistence 2>&1 | grep -E "(rdb_bgsave_in_progress|rdb_last_bgsave_status|rdb_last_bgsave_time_sec|rdb_current_bgsave_time_sec|rdb_last_save_time)" >&2 || true
        echo "Memory:" >&2
        $REDIS_CLI_CMD INFO memory 2>&1 | grep -E "(used_memory_human|used_memory_peak_human)" >&2 || true
        exit 1
    fi
    
    # Check BGSAVE in progress status
    BGSAVE_IN_PROGRESS=$($REDIS_CLI_CMD INFO persistence 2>/dev/null | grep -E "^rdb_bgsave_in_progress:" | cut -d: -f2 | tr -d '\r\n ' || echo "1")
    
    # Check LASTSAVE has increased
    LASTSAVE_CURRENT=$($REDIS_CLI_CMD LASTSAVE 2>/dev/null || echo "0")
    
    # Both conditions must be met: not in progress AND LASTSAVE changed
    if [ "$BGSAVE_IN_PROGRESS" = "0" ] && [ "$LASTSAVE_CURRENT" != "$LASTSAVE_INITIAL" ] && [ "$LASTSAVE_CURRENT" != "0" ]; then
        break
    fi
    
    ITERATION=$((ITERATION + 1))
    sleep $POLL_INTERVAL
done

# Verify save completed successfully
BGSAVE_STATUS=$($REDIS_CLI_CMD INFO persistence 2>/dev/null | grep -E "^rdb_last_bgsave_status:" | cut -d: -f2 | tr -d '\r\n ' || echo "unknown")

if [ "$BGSAVE_STATUS" != "ok" ]; then
    echo "ERROR: Redis BGSAVE failed with status: $BGSAVE_STATUS" >&2
    echo "Persistence info:" >&2
    $REDIS_CLI_CMD INFO persistence 2>&1 | grep -E "(rdb_bgsave_in_progress|rdb_last_bgsave_status|rdb_last_bgsave_time_sec|rdb_current_bgsave_time_sec)" >&2 || true
    exit 1
fi

# Copy RDB file (assumes redis data volume is mounted at /var/backup/redis)
DUMP_FILE="$STAGING_DIR/redis-$(date -u +%Y-%m-%d).rdb"
if [ -f "/var/backup/redis/dump.rdb" ]; then
    cp "/var/backup/redis/dump.rdb" "$DUMP_FILE" || exit 1
else
    echo "ERROR: Redis dump.rdb not found at /var/backup/redis/dump.rdb" >&2
    exit 1
fi

# Verify dump file exists and is non-empty
if [ ! -s "$DUMP_FILE" ]; then
    echo "ERROR: Redis dump file is empty" >&2
    exit 1
fi

# Backup to restic
restic backup "$DUMP_FILE" --tag redis --tag database || exit 1

# Cleanup staging (keep only latest)
find "$STAGING_DIR" -name "*.rdb" -type f -mtime +1 -delete || true

exit 0
