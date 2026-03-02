# Deployment Guide

30-minute deployment checklist.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned
- Backblaze B2 account (or SSH server) configured
- Existing Docker volumes: `postgres_data`, `redis_data`, `app_data`

## Step 1: Configure Environment (5 minutes)

```bash
cd omega-infra
cp env/.env.example env/.env
```

Edit `env/.env`:
- Set `RESTIC_REPOSITORY` (B2 or SSH)
- Set `RESTIC_PASSWORD` (generate strong password, store securely)
- Set `B2_ACCOUNT_ID` and `B2_ACCOUNT_KEY` (if using B2)
- Adjust retention policy if needed
- Set backup schedule (default: 2 AM daily)

## Step 2: Initialize Repository (2 minutes)

```bash
docker compose -f compose/backup.yml run --rm backup restic init
```

Enter repository password when prompted.

## Step 3: Start Backup Service (1 minute)

```bash
docker compose -f compose/backup.yml up -d
```

## Step 4: Verify Backup (5 minutes)

```bash
# Check container is running
docker compose -f compose/backup.yml ps

# Wait for initial backup (runs on startup)
sleep 60

# Verify backup succeeded
docker compose -f compose/backup.yml exec backup restic snapshots

# Check health
./scripts/health-check.sh
```

## Step 5: Test Restore (10 minutes)

```bash
# Dry-run restore test
./scripts/test-restore.sh postgres

# Should complete without errors
```

## Step 6: Verify Scheduled Backup (7 minutes)

```bash
# Check logs
docker compose -f compose/backup.yml logs backup

# Verify cron is running
docker compose -f compose/backup.yml exec backup crontab -l
```

## Verification Checklist

- [ ] Backup container running
- [ ] Initial backup completed
- [ ] Snapshots visible in repository
- [ ] Health check passes
- [ ] Test restore succeeds
- [ ] Cron schedule configured
- [ ] Logs show no errors

## Troubleshooting

### Container won't start

Check logs:
```bash
docker compose -f compose/backup.yml logs backup
```

Common issues:
- Missing `.env` file
- Invalid repository credentials
- Docker socket permissions

### Backup fails

Check backup logs:
```bash
docker compose -f compose/backup.yml exec backup cat /var/log/backup.log
```

Common issues:
- Database container not accessible
- Volume mount paths incorrect
- Insufficient disk space

### Repository init fails

Verify credentials:
```bash
# For B2
echo $B2_ACCOUNT_ID
echo $B2_ACCOUNT_KEY

# Test B2 connection
docker compose -f compose/backup.yml run --rm backup \
  restic -r s3:s3.us-west-000.backblazeb2.com/test-bucket/restic snapshots
```

## Security Note

The backup container mounts `/var/run/docker.sock` to access other containers. This is necessary for database dumps but grants container access to Docker API.

**Mitigation**:
- Container runs as non-root (restic image)
- Read-only socket mount
- Isolated network (if possible)
- Regular security updates

For production, consider:
- Docker-in-Docker (more complex)
- Separate backup host (more secure)
- Network-based access (requires container networking)

## Next Steps

1. **Store repository password securely**
   - Add to password manager
   - Document location in runbook

2. **Set up monitoring** (optional)
   - Configure `HEALTHCHECK_WEBHOOK` in `.env`
   - Use healthchecks.io or similar

3. **Schedule DR drill**
   - Add quarterly reminder
   - Follow `docs/DR_DRILL.md`

4. **Review retention policy**
   - Adjust based on storage costs
   - Balance RPO vs storage

## Operational Commands

```bash
# Manual backup
make backup

# Check health
make health-check

# View snapshots
make snapshots

# Test restore
make test-restore COMPONENT=postgres

# View logs
make logs
```

## Support

- Restore procedures: `docs/RESTORE.md`
- DR drills: `docs/DR_DRILL.md`
- Risk analysis: `docs/RISKS.md`
