# Secrets Strategy

Secure credential handling for backup system.

## Design Decision

**Pattern**: `.env` file excluded from git, `.env.example` committed as template.

**Rationale**: 
- Simple, standard pattern
- No additional tooling required
- Works with Docker Compose natively
- Low operational overhead

## Implementation

### Repository Structure

```
env/
├── .env.example  # Committed - shows required variables
├── .env          # Gitignored - contains actual secrets
└── .gitignore    # Ensures .env never committed
```

### Secret Categories

1. **Restic Repository Password**
   - Stored in `.env` as `RESTIC_PASSWORD`
   - Never committed
   - Must be backed up separately (password manager)

2. **Backblaze B2 Credentials**
   - `B2_ACCOUNT_ID` and `B2_ACCOUNT_KEY`
   - Stored in `.env`
   - Rotatable via B2 console

3. **Database Passwords**
   - `PGPASSWORD` (if needed)
   - Stored in `.env`
   - Separate from application secrets

## Security Considerations

### What We Do

- ✅ `.env` excluded from git
- ✅ `.env.example` shows structure without values
- ✅ Secrets never logged
- ✅ Backup repository encrypted (restic)

### What We Don't Do

- ❌ Commit secrets to git
- ❌ Store secrets in backup repository
- ❌ Log credentials
- ❌ Hardcode credentials

## Alternative Patterns (Not Used)

### SOPS (Secrets Operations)

**Why not**: Adds complexity, requires key management, overkill for single-operator environment.

**When to use**: Multi-operator, CI/CD integration, compliance requirements.

### Docker Secrets

**Why not**: Requires Swarm mode, adds orchestration complexity.

**When to use**: Swarm/Kubernetes environments, multi-host deployments.

## Secret Rotation

### Restic Password

1. Create new repository with new password
2. Re-initialize: `restic init`
3. Run full backup
4. Update `.env` with new password
5. Verify backups work
6. Archive old repository

### B2 Credentials

1. Generate new B2 application key
2. Update `.env` with new credentials
3. Verify backup succeeds
4. Revoke old key in B2 console

### Database Passwords

1. Rotate password in database
2. Update `.env` with new password
3. Restart backup service
4. Verify backup succeeds

## Backup of Secrets

**Critical**: Repository password must be backed up separately.

**Options**:
- Password manager (1Password, Bitwarden)
- Encrypted file in separate backup
- Physical secure storage

**Never**: Store password in same repository or unencrypted.

## Recovery Procedure

If `.env` is lost:

1. Restore from password manager
2. Or recreate from `.env.example` + known values
3. Verify repository access: `restic snapshots`
4. Update any rotated credentials

## Tradeoffs

| Pattern | Pros | Cons |
|---------|------|------|
| `.env` file | Simple, standard | Single point of failure |
| SOPS | Encrypted in git | Complex, requires key management |
| Docker Secrets | Integrated | Requires Swarm |
| Vault/Consul | Centralized | Infrastructure overhead |

**Chosen**: `.env` file - simplest, sufficient for single-operator environment.

## Compliance Notes

- Secrets not in version control ✅
- Secrets encrypted at rest (restic) ✅
- Secrets encrypted in transit (HTTPS/SSH) ✅
- Access controlled (file permissions) ✅
- Audit trail (git history shows changes) ✅
