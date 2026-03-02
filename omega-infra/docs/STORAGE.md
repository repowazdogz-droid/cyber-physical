# Remote Repository Options

Two production-ready storage targets.

## Option 1: Backblaze B2 (Recommended)

### Configuration

```
RESTIC_REPOSITORY=s3:s3.us-west-000.backblazeb2.com/bucket-name/restic
B2_ACCOUNT_ID=your-account-id
B2_ACCOUNT_KEY=your-application-key
```

### Selection Criteria

**Pros**:
- ✅ S3-compatible API (restic native support)
- ✅ Low cost ($5/TB/month, no egress fees for restic)
- ✅ High durability (11 9's)
- ✅ Fast upload/download
- ✅ Simple setup

**Cons**:
- ❌ Requires B2 account
- ❌ Costs scale with storage

### Setup Steps

1. Create B2 bucket
2. Generate application key (read/write)
3. Configure `.env` with credentials
4. Initialize repository: `restic init`

### Cost Estimate

- Storage: $5/TB/month
- Example: 100GB = $0.50/month
- Example: 1TB = $5/month

---

## Option 2: SSH Target

### Configuration

```
RESTIC_REPOSITORY=sftp:user@host.example.com:/path/to/restic
```

Requires SSH key authentication (no password in URL).

### Selection Criteria

**Pros**:
- ✅ Full control over storage
- ✅ No per-GB costs
- ✅ Works with existing infrastructure
- ✅ Can use NAS/backup server

**Cons**:
- ❌ Requires SSH server setup
- ❌ Network dependency
- ❌ Manual capacity management
- ❌ Single point of failure (unless replicated)

### Setup Steps

1. Provision SSH server with sufficient storage
2. Create restic directory
3. Configure SSH key authentication
4. Test connection: `ssh user@host`
5. Initialize repository: `restic init`

### Requirements

- SSH server accessible from Mac mini
- Sufficient disk space
- SSH key authentication configured
- Network reliability

---

## Selection Guide

### Choose B2 If:
- You want managed storage
- Cost is acceptable
- You prefer simplicity
- You need high availability

### Choose SSH If:
- You have existing infrastructure
- You want zero cloud costs
- You have storage capacity
- You can manage the server

---

## Hybrid Approach

Use both:
- B2 as primary (automated)
- SSH as secondary (manual or separate schedule)

Provides redundancy at cost of complexity.

---

## Migration Between Targets

### B2 → SSH

```bash
# On B2
restic snapshots > snapshots.txt

# On SSH
restic init
restic copy --from-repo s3:... --from-password-file ...
```

### SSH → B2

```bash
# On SSH
restic snapshots > snapshots.txt

# On B2
restic init
restic copy --from-repo sftp:... --from-password-file ...
```

---

## Capacity Planning

### Initial Size

- Postgres: ~100MB/dump
- Redis: ~50MB/dump
- Volumes: Varies (deduplication helps)
- Configs: <1MB

**Estimate**: 500MB-2GB initial

### Growth Rate

- Daily: ~100-200MB (deduplication reduces)
- Monthly: ~5-10GB
- Annual: ~50-100GB

### Retention Impact

- 30 daily: ~3-6GB
- 12 weekly: ~1-2GB
- 12 monthly: ~5-10GB

**Total**: ~10-20GB with retention policy

---

## Performance Characteristics

### B2

- Upload: ~50-100 MB/s (depends on connection)
- Download: ~50-100 MB/s
- Latency: ~50-100ms

### SSH

- Upload: Limited by network/disk
- Download: Limited by network/disk
- Latency: Depends on location

---

## Recommendation

**Start with B2**:
- Lower operational overhead
- Better reliability
- Predictable costs
- Easy to scale

**Consider SSH if**:
- You have existing infrastructure
- Cost is primary concern
- You can manage the server
