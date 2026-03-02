#!/bin/bash

# Sync Omega workspace from MacBook to PC via Tailscale
# Usage: bash mac/sync-to-pc.sh

set -e

# Configuration - UPDATE THESE VALUES
PC_TAILSCALE_IP="100.71.44.93"  # PC Tailscale IP
PC_HOSTNAME="omega-rtx"         # PC Tailscale hostname (if MagicDNS enabled)
PC_USER=""                      # PC username (UPDATE THIS)
PC_PATH=""                      # Destination path on PC (UPDATE THIS)
                                # Examples:
                                #   Linux: "/home/username/Omega"
                                #   Windows (WSL): "/home/username/Omega"
                                #   Windows (SMB): "C:/Users/username/Omega"

# Source path
SOURCE_PATH="/Users/warre/Omega"

# Exclude patterns
EXCLUDE_PATTERNS=(
  "--exclude=node_modules"
  "--exclude=.git"
  "--exclude=*.pyc"
  "--exclude=__pycache__"
  "--exclude=.DS_Store"
  "--exclude=.npm-cache"
  "--exclude=dist"
  "--exclude=build"
  "--exclude=.next"
)

echo "=========================================="
echo "Omega Workspace Sync: MacBook → PC"
echo "=========================================="
echo ""

# Check if Tailscale is running
if ! command -v tailscale &> /dev/null; then
    echo "❌ Tailscale not found. Install from: https://tailscale.com/download/mac"
    exit 1
fi

if ! tailscale status &> /dev/null; then
    echo "❌ Tailscale not running. Please start Tailscale."
    exit 1
fi

# Get MacBook Tailscale IP
MACBOOK_IP=$(tailscale ip -4)
echo "✓ MacBook Tailscale IP: $MACBOOK_IP"
echo ""

# Check configuration
if [ -z "$PC_HOSTNAME" ] && [ -z "$PC_TAILSCALE_IP" ]; then
    echo "❌ Configuration required!"
    echo ""
    echo "Please edit this script and set:"
    echo "  PC_HOSTNAME or PC_TAILSCALE_IP"
    echo "  PC_USER"
    echo "  PC_PATH"
    echo ""
    echo "Get PC Tailscale IP from: tailscale status (on PC)"
    exit 1
fi

# Determine target
if [ -n "$PC_HOSTNAME" ]; then
    TARGET="${PC_USER}@${PC_HOSTNAME}:${PC_PATH}"
    echo "Target: ${PC_HOSTNAME}"
else
    TARGET="${PC_USER}@${PC_TAILSCALE_IP}:${PC_PATH}"
    echo "Target: ${PC_TAILSCALE_IP}"
fi

echo "User: ${PC_USER}"
echo "Destination: ${PC_PATH}"
echo ""

# Test connectivity
echo "Testing connectivity..."
if [ -n "$PC_HOSTNAME" ]; then
    if ping -c 1 -W 2 "$PC_HOSTNAME" &> /dev/null; then
        echo "✓ PC reachable via $PC_HOSTNAME"
    else
        echo "❌ Cannot reach PC at $PC_HOSTNAME"
        echo "Check Tailscale connection on both devices"
        exit 1
    fi
else
    if ping -c 1 -W 2 "$PC_TAILSCALE_IP" &> /dev/null; then
        echo "✓ PC reachable via $PC_TAILSCALE_IP"
    else
        echo "❌ Cannot reach PC at $PC_TAILSCALE_IP"
        echo "Check Tailscale connection on both devices"
        exit 1
    fi
fi

echo ""
echo "Starting sync..."
echo ""

# Build rsync command
RSYNC_CMD="rsync -avz --progress"

# Add exclude patterns
for exclude in "${EXCLUDE_PATTERNS[@]}"; do
    RSYNC_CMD="$RSYNC_CMD $exclude"
done

# Add source and destination
RSYNC_CMD="$RSYNC_CMD ${SOURCE_PATH}/ $TARGET/"

# Execute sync
echo "Command: $RSYNC_CMD"
echo ""

if $RSYNC_CMD; then
    echo ""
    echo "=========================================="
    echo "✓ Sync complete!"
    echo "=========================================="
    echo ""
    echo "Files synced to PC at: ${PC_PATH}"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ Sync failed!"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify Tailscale is running on both devices"
    echo "2. Check SSH access: ssh ${PC_USER}@${PC_HOSTNAME:-$PC_TAILSCALE_IP}"
    echo "3. Verify destination path exists on PC"
    echo "4. Check file permissions"
    exit 1
fi
