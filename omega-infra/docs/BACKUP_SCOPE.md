# Backup Scope Definition

Explicit backup coverage and recovery time implications.

## Components Backed Up

### 1. Postgres Database

**What**: Full database dumps via `pg_dumpall`

**Why**: Critical application data. Loss requires full restore from last backup.

**Recovery Time**: 5-10 minutes (dump restore)

**Frequency**: Daily (configurable)

**Storage Impact**: ~100MB per dump (compressed)

---

### 2. Redis Persistence

**What**: RDB file and AOF (if enabled)

**Why**: Session data, cache state, transient application data.

**Recovery Time**: 5 minutes (RDB load)

**Frequency**: Daily

**Storage Impact**: ~50MB per backup

**Note**: Redis is often ephemeral. Assess if full backup is necessary.

---

### 3. Docker Volumes

**What**: All named volumes (postgres_data, redis_data, app_data)

**Why**: Persistent application data, uploaded files, generated content.

**Recovery Time**: 10-15 minutes (volume recreation + data copy)

**Frequency**: Daily

**Storage Impact**: Varies by volume size (deduplication helps)

---

### 4. Compose Files

**What**: All docker-compose.yml files

**Why**: Infrastructure definition. Required to recreate services.

**Recovery Time**: Immediate (git clone) but backup ensures version alignment

**Frequency**: With every backup run

**Storage Impact**: Negligible

---

### 5. Environment Configuration

**What**: `.env` files (excluding secrets - see Secrets Strategy)

**Why**: Configuration state. Critical for service recreation.

**Recovery Time**: Immediate

**Frequency**: With every backup run

**Storage Impact**: Negligible

**Note**: Secrets are NOT backed up. Must be restored manually.

---

### 6. Nginx Configs

**What**: Nginx configuration files

**Why**: Web server routing, SSL configs, reverse proxy rules.

**Recovery Time**: 5 minutes (config restore + reload)

**Frequency**: With every backup run

**Storage Impact**: Negligible

---

## Recovery Time Analysis

### Single Component Failure

| Component | RTO | RPO | Impact |
|-----------|-----|-----|--------|
| Postgres | 10 min | 24h | High - application data |
| Redis | 5 min | 24h | Medium - sessions/cache |
| Volume | 15 min | 24h | High - persistent files |
| Configs | 5 min | Real-time | Medium - service config |

### Total System Failure

**RTO**: 30-60 minutes
**RPO**: 24 hours

**Breakdown**:
- Infrastructure setup: 10 min
- Volume restore: 15 min
- Database restore: 10 min
- Service startup: 5 min
- Verification: 10 min

---

## What is NOT Backed Up

### Excluded Components

1. **Container images**: Re-pulled from registries
2. **Logs**: Ephemeral, not critical for restore
3. **Secrets**: Handled separately (see Secrets Strategy)
4. **Temporary files**: `/tmp`, cache directories
5. **Host OS**: Out of scope (use Time Machine or similar)

### Rationale

- Container images: Large, reproducible from Dockerfile
- Logs: Not needed for restore, can regenerate
- Secrets: Security risk if backed up, must rotate
- Temp files: Not persistent, not needed
- Host OS: Separate concern, use system backup

---

## Backup Frequency Justification

**Daily backups** balance:
- Recovery point objective (24h acceptable)
- Storage costs (deduplication limits growth)
- Operational overhead (minimal with automation)

**Weekly/Monthly retention** provides:
- Point-in-time recovery options
- Protection against delayed corruption detection
- Compliance with data retention policies

---

## Storage Estimation

**Initial backup**: ~500MB-2GB (depends on data)

**Daily growth**: ~100-200MB (deduplication reduces this)

**Monthly total**: ~5-10GB (with retention)

**Annual projection**: ~50-100GB

**Note**: restic deduplication significantly reduces storage vs raw backups.
