#!/bin/bash
set -euo pipefail

# Deterministic restore orchestrator
# Usage: ./restore.sh <component> [snapshot-id]
# Components: postgres, redis, volumes, configs, all

COMPONENT="${1:-}"
SNAPSHOT_ID="${2:-latest}"

if [ -z "$COMPONENT" ]; then
    echo "Usage: $0 <component> [snapshot-id]"
    echo "Components: postgres, redis, volumes, configs, all"
    exit 1
fi

# Resolve snapshot ID
if [ "$SNAPSHOT_ID" = "latest" ]; then
    SNAPSHOT_ID=$(docker compose -f compose/backup.yml exec -T backup restic snapshots --json --last | jq -r '.[0].id // empty')
fi

if [ -z "$SNAPSHOT_ID" ]; then
    echo "ERROR: No snapshots found"
    exit 1
fi

echo "Restoring from snapshot: $SNAPSHOT_ID"

case "$COMPONENT" in
    postgres)
        echo "Restoring postgres..."
        docker compose -f compose/backup.yml exec -T backup restic restore "$SNAPSHOT_ID" --target /tmp/restore --include "/staging/postgres/*.sql.gz" --tag postgres
        LATEST_DUMP=$(docker compose -f compose/backup.yml exec -T backup find /tmp/restore/staging/postgres -name "*.sql.gz" -type f | sort -r | head -1)
        docker compose -f compose/backup.yml exec -T backup gunzip -c "$LATEST_DUMP" | docker compose exec -T postgres psql -U postgres
        docker compose -f compose/backup.yml exec -T backup rm -rf /tmp/restore
        echo "Postgres restored"
        ;;
    redis)
        echo "Restoring redis..."
        docker compose -f compose/backup.yml exec -T backup restic restore "$SNAPSHOT_ID" --target /tmp/restore --include "/staging/redis/*.rdb" --tag redis
        docker compose stop redis || true
        LATEST_RDB=$(docker compose -f compose/backup.yml exec -T backup find /tmp/restore/staging/redis -name "*.rdb" -type f | sort -r | head -1)
        docker compose -f compose/backup.yml exec -T backup cat "$LATEST_RDB" | docker compose exec -T redis sh -c "cat > /data/dump.rdb"
        docker compose start redis
        docker compose -f compose/backup.yml exec -T backup rm -rf /tmp/restore
        echo "Redis restored"
        ;;
    volumes)
        echo "Restoring volumes..."
        docker compose -f compose/backup.yml exec -T backup restic restore "$SNAPSHOT_ID" --target /tmp/restore --tag volume
        echo "Volume data restored to /tmp/restore. Manual volume recreation required."
        ;;
    configs)
        echo "Restoring configs..."
        docker compose -f compose/backup.yml exec -T backup restic restore "$SNAPSHOT_ID" --target /tmp/restore --include "/backups/compose/*" --include "/backups/env/*"
        docker compose -f compose/backup.yml exec -T backup cp -r /tmp/restore/backups/compose/* /backups/compose/
        docker compose -f compose/backup.yml exec -T backup rm -rf /tmp/restore
        echo "Configs restored. Review before using."
        ;;
    all)
        echo "Restoring all components..."
        docker compose -f compose/backup.yml exec -T backup restic restore "$SNAPSHOT_ID" --target /tmp/restore
        echo "All data restored to /tmp/restore. Manual restoration required."
        ;;
    *)
        echo "Unknown component: $COMPONENT"
        exit 1
        ;;
esac

echo "Restore complete"
