# Risk Analysis

Critical failure modes and mitigation strategies.

## Most Likely Backup Failure Mode

**Scenario**: Repository password lost or forgotten.

**Probability**: Medium-High (single operator, no redundancy)

**Impact**: Catastrophic - all backups unrecoverable

**Mitigation**:
- Store password in password manager
- Document password location in runbook
- Consider password escrow for team environments

**Detection**: Health check fails, restore attempts fail

---

## Most Dangerous False Sense of Security

**Scenario**: Backups running successfully but restore untested.

**Probability**: High (common operational blind spot)

**Impact**: High - discover backup failure during disaster

**Mitigation**:
- Quarterly restore drills (mandatory)
- Automated restore testing
- Document restore procedures clearly
- Test restore after any backup system changes

**Detection**: Regular DR drills, automated test-restore

---

## Operator Mistake That Destroys Recoverability

**Scenario**: Accidental `restic forget --prune` with wrong retention policy.

**Probability**: Low-Medium (human error)

**Impact**: Catastrophic - all historical backups deleted

**Mitigation**:
- Use environment variables for retention (not command-line)
- Implement retention policy in script (not manual)
- Require confirmation for destructive operations
- Consider repository-level retention locks

**Detection**: Snapshot count drops unexpectedly, alerts

---

## Additional Risks

### 1. Repository Corruption

**Probability**: Low (restic handles this well)

**Impact**: High - backups unusable

**Mitigation**:
- Regular integrity checks (`restic check`)
- Multiple repository copies (B2 + SSH)
- Test restores validate integrity

### 2. Credential Compromise

**Probability**: Low-Medium

**Impact**: High - unauthorized access to backups

**Mitigation**:
- Rotate credentials regularly
- Use application keys (not master keys)
- Monitor access logs
- Encrypt repository (restic default)

### 3. Storage Exhaustion

**Probability**: Medium (if not monitored)

**Impact**: Medium - backups stop, no new snapshots

**Mitigation**:
- Retention policy limits growth
- Monitor repository size
- Alert on storage thresholds
- Regular pruning

### 4. Network Failure During Backup

**Probability**: Medium (network issues)

**Impact**: Low - backup fails, retries next run

**Mitigation**:
- Backup service retries automatically
- Health checks detect failures
- Alerts notify operator
- Local cache reduces retry impact

### 5. Container Failure

**Probability**: Low (Docker is stable)

**Impact**: Low - service restarts automatically

**Mitigation**:
- `restart: unless-stopped` policy
- Health checks
- Monitoring
- Log aggregation

### 6. Silent Data Corruption

**Probability**: Very Low (restic validates)

**Impact**: High - corrupted backups restore bad data

**Mitigation**:
- restic checksums all data
- Regular integrity checks
- Test restores validate data
- Multiple backup sources

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation Priority |
|------|-------------|--------|---------------------|
| Password loss | Medium-High | Catastrophic | **Critical** |
| Untested restore | High | High | **Critical** |
| Accidental deletion | Low-Medium | Catastrophic | **High** |
| Repository corruption | Low | High | **Medium** |
| Credential compromise | Low-Medium | High | **Medium** |
| Storage exhaustion | Medium | Medium | **Medium** |
| Network failure | Medium | Low | **Low** |
| Container failure | Low | Low | **Low** |
| Silent corruption | Very Low | High | **Low** (restic handles) |

---

## Mitigation Summary

### Critical Mitigations (Implement Immediately)

1. **Password Management**
   - Store in password manager
   - Document location
   - Test recovery procedure

2. **Restore Testing**
   - Quarterly DR drills
   - Automated test-restore
   - Document procedures

3. **Retention Safety**
   - Use environment variables
   - Script-based policies
   - Require confirmation

### High Priority Mitigations

4. **Integrity Validation**
   - Regular `restic check`
   - Test restores
   - Monitor snapshot counts

5. **Credential Security**
   - Rotate regularly
   - Use application keys
   - Monitor access

### Medium Priority Mitigations

6. **Storage Management**
   - Monitor repository size
   - Alert on thresholds
   - Regular pruning

7. **Redundancy**
   - Consider dual repositories
   - Offsite password backup
   - Document recovery

---

## Operational Safeguards

### Implemented

- ✅ Retention policy (prevents unbounded growth)
- ✅ Snapshot pruning (automatic cleanup)
- ✅ Health check command (detects failures)
- ✅ Alert hook (optional notification)

### Additional Recommendations

- Repository size monitoring
- Snapshot count alerts
- Backup age warnings
- Integrity check scheduling

---

## Failure Response Playbook

### Backup Service Down

1. Check container status: `docker compose ps`
2. Check logs: `docker compose logs backup`
3. Restart if needed: `docker compose restart backup`
4. Verify: `./scripts/health-check.sh`

### Restore Fails

1. Verify snapshot exists: `restic snapshots`
2. Check repository access: `restic check`
3. Verify credentials: Check `.env`
4. Test with dry-run: `./scripts/test-restore.sh`
5. Check disk space: `df -h`

### Repository Corrupted

1. Run integrity check: `restic check`
2. If repairable: `restic check --read-data`
3. If not: Restore from secondary repository
4. Re-initialize if necessary
5. Run full backup immediately

---

## Continuous Improvement

- Review risks quarterly
- Update mitigations based on incidents
- Improve procedures based on DR drills
- Document lessons learned
