# Omega Infrastructure Backup System

Production-grade backup architecture using restic.

## Quick Start

```bash
# 1. Clone and configure
git clone <repo>
cd omega-infra
cp env/.env.example env/.env
# Edit env/.env with your credentials

# 2. Deploy
docker compose -f compose/backup.yml up -d

# 3. Verify
docker compose -f compose/backup.yml exec backup restic snapshots

# 4. Test restore (dry-run)
./scripts/test-restore.sh postgres
```

## Architecture

- **Backup Engine**: restic (encrypted, deduplicated, versioned)
- **Scheduler**: cron (inside container)
- **Storage**: Backblaze B2 (primary) or SSH target (secondary)
- **Scope**: Postgres dumps, Redis persistence, Docker volumes, configs

## Repository Structure

```
omega-infra/
├── backups/          # Backup scripts and definitions
│   ├── postgres.sh   # Postgres backup logic
│   ├── redis.sh      # Redis backup logic
│   └── volumes.sh    # Volume backup logic
├── compose/          # Docker Compose definitions
│   └── backup.yml    # Backup service
├── scripts/          # Operational scripts
│   ├── restore.sh    # Restore orchestrator
│   ├── test-restore.sh
│   └── health-check.sh
├── env/              # Environment configuration
│   ├── .env.example  # Template (committed)
│   └── .env          # Secrets (gitignored)
└── docs/             # Runbooks and procedures
    ├── RESTORE.md    # Restore procedures
    └── DR_DRILL.md   # Disaster recovery drill
```

## Design Rationale

**Single Container**: Backup service runs as one container with cron. Fewer moving parts = fewer failure modes.

**restic**: Industry-standard, encrypted, deduplicated. Handles retention, pruning, integrity checks.

**Compose-based**: Fits existing Docker workflow. No external schedulers.

**Git-reproducible**: All code committed. Secrets externalized via .env.

## Operational Status

Check backup health:
```bash
./scripts/health-check.sh
```

View recent backups:
```bash
docker compose -f compose/backup.yml exec backup restic snapshots
```

## Restore Procedures

See `docs/RESTORE.md` for deterministic restore runbooks.

## Disaster Recovery

Quarterly drills documented in `docs/DR_DRILL.md`.
