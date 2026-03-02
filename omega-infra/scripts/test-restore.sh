#!/bin/bash
set -euo pipefail

# Dry-run restore test
# Validates backup integrity without restoring

COMPONENT="${1:-all}"

echo "Testing restore for: $COMPONENT"
echo "This is a dry-run - no data will be modified"

LATEST_SNAPSHOT=$(docker compose -f compose/backup.yml exec -T backup restic snapshots --json --last | jq -r '.[0].id // empty')

if [ -z "$LATEST_SNAPSHOT" ]; then
    echo "ERROR: No snapshots found"
    exit 1
fi

echo "Latest snapshot: $LATEST_SNAPSHOT"

# Test repository integrity
echo "Testing repository integrity..."
docker compose -f compose/backup.yml exec -T backup restic check --read-data-subset=10% || exit 1

# Test restore to temp location
TEMP_RESTORE="/tmp/test-restore-$$"

case "$COMPONENT" in
    postgres)
        docker compose -f compose/backup.yml exec -T backup restic restore "$LATEST_SNAPSHOT" --target "$TEMP_RESTORE" --tag postgres
        if docker compose -f compose/backup.yml exec -T backup test -f "$TEMP_RESTORE/staging/postgres/"*.sql.gz; then
            echo "Postgres backup test: OK"
        else
            echo "ERROR: Postgres backup test failed - no dump file found"
            docker compose -f compose/backup.yml exec -T backup rm -rf "$TEMP_RESTORE"
            exit 1
        fi
        ;;
    redis)
        docker compose -f compose/backup.yml exec -T backup restic restore "$LATEST_SNAPSHOT" --target "$TEMP_RESTORE" --tag redis
        if docker compose -f compose/backup.yml exec -T backup test -f "$TEMP_RESTORE/staging/redis/"*.rdb; then
            echo "Redis backup test: OK"
        else
            echo "ERROR: Redis backup test failed - no dump file found"
            docker compose -f compose/backup.yml exec -T backup rm -rf "$TEMP_RESTORE"
            exit 1
        fi
        ;;
    volumes)
        docker compose -f compose/backup.yml exec -T backup restic restore "$LATEST_SNAPSHOT" --target "$TEMP_RESTORE" --tag volume
        echo "Volume backup test: OK"
        ;;
    all)
        docker compose -f compose/backup.yml exec -T backup restic restore "$LATEST_SNAPSHOT" --target "$TEMP_RESTORE"
        echo "All backups test: OK"
        ;;
esac

docker compose -f compose/backup.yml exec -T backup rm -rf "$TEMP_RESTORE"
exit 0
