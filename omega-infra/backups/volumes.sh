#!/bin/sh
set -euo pipefail

# Backup Docker volumes
# Uses mounted volume paths directly

VOLUMES="postgres_data:/var/backup/postgres redis_data:/var/backup/redis app_data:/var/backup/app"

for VOLUME_MAP in $VOLUMES; do
    VOLUME_NAME=$(echo "$VOLUME_MAP" | cut -d: -f1)
    MOUNT_PATH=$(echo "$VOLUME_MAP" | cut -d: -f2)
    
    # Check if volume is mounted and accessible
    if [ -d "$MOUNT_PATH" ] && [ -n "$(ls -A "$MOUNT_PATH" 2>/dev/null)" ]; then
        # Backup volume contents
        restic backup \
            --tag volume \
            --tag "$VOLUME_NAME" \
            "$MOUNT_PATH" || exit 1
    fi
done

exit 0
