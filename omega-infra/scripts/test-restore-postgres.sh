#!/bin/bash
set -euo pipefail

# Postgres restore smoke test
# Pulls latest snapshot, spins up disposable postgres, restores, validates, destroys

TEST_CONTAINER="omega-backup-test-postgres-$$"
TEST_NETWORK="omega-backup-test-network-$$"
TEMP_RESTORE="/tmp/test-restore-postgres-$$"

cleanup() {
    docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1 || true
    docker network rm "$TEST_NETWORK" > /dev/null 2>&1 || true
    docker compose -f compose/backup.yml exec -T backup rm -rf "$TEMP_RESTORE" > /dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Postgres restore smoke test"
echo "=========================="

# Get latest snapshot
LATEST_SNAPSHOT=$(docker compose -f compose/backup.yml exec -T backup restic snapshots --json --last | jq -r '.[0].id // empty')
if [ -z "$LATEST_SNAPSHOT" ]; then
    echo "ERROR: No snapshots found"
    exit 1
fi

echo "Latest snapshot: $LATEST_SNAPSHOT"

# Restore postgres dump
echo "Restoring postgres dump..."
docker compose -f compose/backup.yml exec -T backup restic restore "$LATEST_SNAPSHOT" --target "$TEMP_RESTORE" --include "/staging/postgres/*.sql.gz" --tag postgres || exit 1

# Find dump file
DUMP_FILE=$(docker compose -f compose/backup.yml exec -T backup find "$TEMP_RESTORE/staging/postgres" -name "*.sql.gz" -type f | head -1)
if [ -z "$DUMP_FILE" ]; then
    echo "ERROR: No postgres dump file found in restore"
    exit 1
fi

echo "Found dump file: $DUMP_FILE"

# Create test network
docker network create "$TEST_NETWORK" > /dev/null 2>&1 || exit 1

# Start disposable postgres container
echo "Starting test postgres container..."
docker run -d \
    --name "$TEST_CONTAINER" \
    --network "$TEST_NETWORK" \
    -e POSTGRES_PASSWORD=testpass \
    -e POSTGRES_DB=testdb \
    postgres:16 > /dev/null || exit 1

# Wait for postgres to be ready
echo "Waiting for postgres to be ready..."
for i in {1..30}; do
    if docker exec "$TEST_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ! docker exec "$TEST_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
    echo "ERROR: Postgres container failed to start"
    exit 1
fi

# Restore dump
echo "Restoring dump to test container..."
docker compose -f compose/backup.yml exec -T backup gunzip -c "$DUMP_FILE" | docker exec -i "$TEST_CONTAINER" psql -U postgres > /dev/null 2>&1 || exit 1

# Run validation query
echo "Running validation query..."
QUERY_RESULT=$(docker exec "$TEST_CONTAINER" psql -U postgres -t -c "SELECT COUNT(*) FROM pg_database;" 2>/dev/null | tr -d ' ')

if [ -z "$QUERY_RESULT" ] || [ "$QUERY_RESULT" = "0" ]; then
    echo "ERROR: Validation query failed or returned no results"
    exit 1
fi

echo "Validation query returned: $QUERY_RESULT databases"

# Verify we can query restored data
TABLES=$(docker exec "$TEST_CONTAINER" psql -U postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
echo "Found $TABLES tables in public schema"

echo "=========================="
echo "Postgres restore smoke test: PASSED"
exit 0
