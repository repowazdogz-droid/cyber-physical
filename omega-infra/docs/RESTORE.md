# Restore Procedures

Deterministic restore runbooks for common failure scenarios.

## Prerequisites

- restic repository accessible
- Repository password known
- Docker operational
- Sufficient disk space

## Scenario A: Lost Postgres Database

**Symptom**: Postgres container data corrupted or deleted.

**Time to restore**: 5-10 minutes

### Steps

1. **Stop postgres container**
   ```bash
   docker compose stop postgres
   ```

2. **Identify snapshot**
   ```bash
   docker compose -f compose/backup.yml exec backup restic snapshots --tag postgres
   ```
   Note the snapshot ID (or use "latest")

3. **Restore postgres dump**
   ```bash
   ./scripts/restore.sh postgres latest
   ```
   Or with specific snapshot:
   ```bash
   ./scripts/restore.sh postgres abc123def
   ```

4. **Verify data**
   ```bash
   docker compose start postgres
   docker compose exec postgres psql -U postgres -c "SELECT COUNT(*) FROM your_table;"
   ```

5. **Restart application**
   ```bash
   docker compose up -d
   ```

### Verification

- Database queries return expected data
- Application connects successfully
- No error logs

---

## Scenario B: Total Host Death

**Symptom**: Mac mini hardware failure, need full restore on new host.

**Time to restore**: 30-60 minutes

### Steps

1. **Provision new Mac mini**
   - Install Docker
   - Clone repository
   ```bash
   git clone <repo-url>
   cd omega-infra
   ```

2. **Configure environment**
   ```bash
   cp env/.env.example env/.env
   # Edit env/.env with credentials
   ```

3. **Start backup service (to access restic)**
   ```bash
   docker compose -f compose/backup.yml up -d
   ```

4. **Verify repository access**
   ```bash
   docker compose -f compose/backup.yml exec backup restic snapshots
   ```

5. **Restore all data**
   ```bash
   ./scripts/restore.sh all latest
   ```

6. **Recreate volumes**
   ```bash
   # Create volumes
   docker volume create postgres_data
   docker volume create redis_data
   docker volume create app_data
   
   # Restore volume data (from /tmp/restore)
   # This requires manual copy based on restore output
   ```

7. **Restore configs**
   ```bash
   ./scripts/restore.sh configs latest
   # Review restored configs
   cp -r /tmp/restore/backups/compose/* ./compose/
   ```

8. **Start services**
   ```bash
   docker compose up -d
   ```

9. **Restore databases**
   ```bash
   ./scripts/restore.sh postgres latest
   ./scripts/restore.sh redis latest
   ```

10. **Verify system**
    ```bash
    ./scripts/health-check.sh
    docker compose ps
    # Test application endpoints
    ```

### Verification Checklist

- [ ] All containers running
- [ ] Postgres contains expected data
- [ ] Redis contains expected data
- [ ] Application responds correctly
- [ ] Backup service operational
- [ ] Health check passes

---

## Scenario C: Corrupted Volume

**Symptom**: Docker volume corruption detected.

**Time to restore**: 10-15 minutes

### Steps

1. **Stop affected service**
   ```bash
   docker compose stop <service>
   ```

2. **Remove corrupted volume**
   ```bash
   docker volume rm <volume_name>
   ```

3. **Create new volume**
   ```bash
   docker volume create <volume_name>
   ```

4. **Restore volume data**
   ```bash
   ./scripts/restore.sh volumes latest
   # Manually copy from /tmp/restore to volume
   ```

5. **Restart service**
   ```bash
   docker compose start <service>
   ```

---

## Emergency Commands

**List all snapshots:**
```bash
docker compose -f compose/backup.yml exec backup restic snapshots
```

**Find snapshot by tag:**
```bash
docker compose -f compose/backup.yml exec backup restic snapshots --tag postgres
```

**Test restore (dry-run):**
```bash
./scripts/test-restore.sh postgres
```

**Check repository integrity:**
```bash
docker compose -f compose/backup.yml exec backup restic check
```

**View backup contents:**
```bash
docker compose -f compose/backup.yml exec backup restic ls latest
```

---

## Recovery Time Objectives

| Scenario | RTO | Notes |
|----------|-----|-------|
| Postgres loss | 5-10 min | Fast restore from dump |
| Redis loss | 5 min | RDB restore |
| Volume corruption | 10-15 min | Manual volume restore |
| Total host loss | 30-60 min | Full infrastructure restore |

## Recovery Point Objectives

- **Postgres**: 24 hours (daily backups)
- **Redis**: 24 hours (daily backups)
- **Volumes**: 24 hours (daily backups)
- **Configs**: Real-time (backed up with each run)
