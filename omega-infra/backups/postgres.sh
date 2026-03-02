#!/bin/sh
set -euo pipefail

# Postgres logical backup via pg_dumpall
# Creates consistent, compressed dump to staging directory

STAGING_DIR="/staging/postgres"
DUMP_FILE="$STAGING_DIR/postgres-$(date -u +%Y-%m-%d).sql.gz"

mkdir -p "$STAGING_DIR"

PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-}"

# Export password for pg_dumpall
export PGPASSWORD

# Create consistent dump
pg_dumpall -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" | gzip > "$DUMP_FILE" || exit 1

# Verify dump file exists and is non-empty
if [ ! -s "$DUMP_FILE" ]; then
    echo "ERROR: Postgres dump file is empty" >&2
    exit 1
fi

# Backup to restic
restic backup "$DUMP_FILE" --tag postgres --tag database || exit 1

# Cleanup staging (keep only latest)
find "$STAGING_DIR" -name "*.sql.gz" -type f -mtime +1 -delete || true

exit 0
