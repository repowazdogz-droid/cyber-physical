# Verification Checklist

Production verification steps for Omega backup system.

## Quick Verification

Run automated verification script:

```bash
./scripts/verify.sh
```

## Manual Verification Steps

### 1. Verify No Exposed DB Ports

```bash
# Should return nothing
sudo lsof -iTCP -sTCP:LISTEN | egrep ':(5432|6379)\s' || true
docker ps --format '{{.Names}}\t{{.Ports}}' | egrep '(5432|6379)' || true
```

### 2. Verify Backup Container Security

```bash
docker inspect "$(docker ps -qf name=backup)" \
  | jq '.[0].HostConfig | {Privileged, NetworkMode, ReadonlyRootfs, CapAdd, CapDrop, Binds}'
```

Expected:
- `Privileged`: false
- `ReadonlyRootfs`: true
- `CapDrop`: contains "ALL"
- `Binds`: no docker.sock

### 3. One-Time Setup

```bash
cp env/.env.example env/.env
$EDITOR env/.env
docker compose -f compose/backup.yml up -d --build
```

### 4. First-Run Backup

```bash
docker compose -f compose/backup.yml exec backup /backups/backup.sh
# Must exit 0
```

### 5. Health Check

```bash
./scripts/health-check.sh
# Must exit 0
```

### 6. List Snapshots

```bash
docker compose -f compose/backup.yml exec backup restic snapshots
```

### 7. Restore Smoke Test

```bash
./scripts/test-restore-postgres.sh
# Must exit 0
```

### 8. Cron Check

```bash
docker compose -f compose/backup.yml exec backup ps aux | grep -E '[c]rond|[c]ron'
# Must show cron PID
```

### 9. Repository Verification

```bash
grep -E '^RESTIC_REPOSITORY=' env/.env
# Must start with s3: or sftp:
```

### 10. Optional Firewall Hardening

```bash
# macOS firewall (if applicable)
sudo pfctl -f /etc/pf.conf

# Or use application firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

## Quarterly DR Drill

1. Run restore smoke test: `./scripts/test-restore-postgres.sh`
2. Verify snapshots: `docker compose -f compose/backup.yml exec backup restic snapshots`
3. Test restore procedure: `./scripts/restore.sh postgres latest` (on test environment)
4. Document results in `docs/DR_DRILL.md`

## Git-Based Deployment

Ensure backup stack is deployed from git, not edited in Portainer UI:

```bash
git status
git log -1 --oneline
```

All changes should be committed to git before deployment.
