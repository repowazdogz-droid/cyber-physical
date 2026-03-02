#!/bin/sh
set -euo pipefail

# Fail-fast entrypoint
# Exits non-zero on any error

# Verify remote repository is configured
if [ -z "${RESTIC_REPOSITORY:-}" ]; then
    echo "ERROR: RESTIC_REPOSITORY not set" >&2
    exit 1
fi

# Reject local repositories
case "$RESTIC_REPOSITORY" in
    /tmp/*|/var/*|/home/*|/root/*|/backup/*|file:*)
        echo "ERROR: Local repository not allowed. Use s3: or sftp:" >&2
        exit 1
        ;;
esac

# Verify repository password
if [ -z "${RESTIC_PASSWORD:-}" ]; then
    echo "ERROR: RESTIC_PASSWORD not set" >&2
    exit 1
fi

# Initialize repository if needed
restic snapshots > /dev/null 2>&1 || restic init || exit 1

# Create staging directory
mkdir -p /staging/postgres /staging/redis /staging/volumes

# Create crontab
echo "${BACKUP_SCHEDULE:-0 2 * * *} /backups/backup.sh >> /var/log/backup.log 2>&1" | crontab -

# Log rotation cron (daily at 1 AM)
echo "0 1 * * * find /var/log/backup.log -size +10M -exec truncate -s 0 {} \;" | crontab -

# Run initial backup (non-blocking - cron will handle subsequent backups)
/backups/backup.sh || echo "Initial backup failed, will retry on schedule"

# Start cron
exec crond -f -l 2
