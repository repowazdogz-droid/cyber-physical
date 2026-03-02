# Disaster Recovery Drill

Quarterly disaster recovery validation procedure.

## Schedule

- **Frequency**: Quarterly
- **Duration**: 2-3 hours
- **Participants**: Infrastructure operator
- **Documentation**: Update this file with results

## Pre-Drill Checklist

- [ ] Backup service operational
- [ ] Recent backups exist (< 25 hours old)
- [ ] Repository integrity verified
- [ ] Test environment available (optional)
- [ ] Runbook printed/accessible

## Drill Scenarios

### Scenario 1: Postgres Database Loss

**Objective**: Restore postgres database from backup.

**Steps**:
1. Simulate failure: `docker compose stop postgres && docker volume rm postgres_data`
2. Execute restore: `./scripts/restore.sh postgres latest`
3. Verify data integrity
4. Measure restore time

**Success Criteria**:
- [ ] Restore completes without errors
- [ ] Data matches expected state
- [ ] Restore time < 10 minutes
- [ ] Application functions correctly

**Expected Time**: 10 minutes

---

### Scenario 2: Full System Restore

**Objective**: Restore entire system on clean host.

**Steps**:
1. Provision clean test environment
2. Clone repository
3. Configure environment
4. Restore all components
5. Verify system functionality

**Success Criteria**:
- [ ] All services operational
- [ ] Data integrity verified
- [ ] Restore time < 60 minutes
- [ ] Health checks pass

**Expected Time**: 60 minutes

---

### Scenario 3: Backup Integrity Validation

**Objective**: Verify backup system is functioning correctly.

**Steps**:
1. Run health check: `./scripts/health-check.sh`
2. Test restore: `./scripts/test-restore.sh all`
3. Verify repository integrity: `restic check`
4. Review backup logs
5. Verify retention policy

**Success Criteria**:
- [ ] Health check passes
- [ ] Test restore succeeds
- [ ] Repository integrity verified
- [ ] Retention policy enforced
- [ ] No errors in logs

**Expected Time**: 15 minutes

---

## Validation Steps

### Data Integrity

1. **Postgres**:
   ```bash
   docker compose exec postgres psql -U postgres -c "SELECT COUNT(*) FROM each_table;"
   ```
   Compare counts with production baseline.

2. **Redis**:
   ```bash
   docker compose exec redis redis-cli DBSIZE
   ```
   Verify key count matches expectations.

3. **Volumes**:
   ```bash
   docker compose exec app ls -la /data
   ```
   Verify file structure and permissions.

### Performance Validation

- Restore time meets RTO
- Application response times normal
- No resource exhaustion

### Operational Validation

- Backup service running
- Scheduled backups executing
- Logs clean
- Alerts functioning (if configured)

## Post-Drill Actions

1. **Document Results**
   - Date: ___________
   - Operator: ___________
   - Scenarios tested: ___________
   - Issues found: ___________
   - Restore times: ___________

2. **Update Runbooks**
   - Note any procedure changes
   - Update timing estimates
   - Document workarounds

3. **Remediate Issues**
   - Fix any discovered problems
   - Update backup configuration if needed
   - Improve documentation

4. **Schedule Next Drill**
   - Set calendar reminder
   - Update this document

## Common Issues and Solutions

### Issue: Restore fails with "snapshot not found"
**Solution**: Verify snapshot ID with `restic snapshots`. Use full snapshot ID.

### Issue: Postgres restore hangs
**Solution**: Check postgres container logs. May need to recreate container.

### Issue: Volume restore incomplete
**Solution**: Verify volume mount paths. May require manual file copy.

### Issue: Repository access denied
**Solution**: Verify credentials in `.env`. Check network connectivity.

## Success Metrics

- **Restore Success Rate**: 100%
- **RTO Compliance**: All scenarios < target time
- **Data Integrity**: 100% match with baseline
- **Operator Confidence**: High

## Drill History

| Date | Operator | Scenarios | Results | Issues |
|------|----------|-----------|---------|--------|
| | | | | |
