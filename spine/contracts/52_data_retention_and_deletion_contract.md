# Data Retention & Deletion Contract

This contract ensures Omega retains, expires, and deletes data deliberately, safely, and auditably.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Data Categories

All data must be classified as:

### Transient
- Transient data is temporary
- Transient data has short retention
- Transient classification is mandatory when applicable
- Missing transient classification is a violation

### Working
- Working data is operational
- Working data supports current operations
- Working classification is mandatory when applicable
- Missing working classification is a violation

### Reference
- Reference data is archival
- Reference data is kept for reference purposes
- Reference classification is mandatory when applicable
- Missing reference classification is a violation

### Audit
- Audit data is for accountability
- Audit data supports auditability and compliance
- Audit classification is mandatory when applicable
- Missing audit classification is a violation

### Prohibited

- Prohibited data must not be retained
- Prohibited data is not allowed
- Prohibited classification is mandatory when applicable
- Missing prohibited classification is a violation

### Unclassified Data Is Not Retained

- Unclassified data is not retained
- Data classification is mandatory
- Unclassified data is deleted
- Retaining unclassified data is prohibited

---

## 2. Retention Rules

Each category has a defined:

### Retention Duration
- Retention duration is defined for each category
- Duration specifies how long data is kept
- Retention duration definition is mandatory
- Missing retention duration is a violation

### Review Interval
- Review interval is defined for each category
- Interval specifies when data is reviewed
- Review interval definition is mandatory
- Missing review interval is a violation

### Deletion Condition

- Deletion condition is defined for each category
- Condition specifies when data is deleted
- Deletion condition definition is mandatory
- Missing deletion condition is a violation

### No Default "Keep Forever"

- No default "keep forever" retention
- All data must have defined retention limits
- Defaulting to "keep forever" is prohibited
- "Keep forever" without explicit justification is a violation

---

## 3. Minimum Retention

Omega must retain:

### Audit Records
- Audit records are retained for minimum period
- Minimum period required for accountability
- Retaining audit records is mandatory
- Missing audit record retention is a violation

### Release Records
- Release records are retained for minimum period
- Minimum period required for accountability
- Retaining release records is mandatory
- Missing release record retention is a violation

### Decision Rationales

- Decision rationales are retained for minimum period
- Minimum period required for accountability
- Retaining decision rationales is mandatory
- Missing decision rationale retention is a violation

### For the Minimum Period Required for Accountability

- Retention is for minimum period required for accountability
- Period is defined and justified
- Minimum retention period is mandatory
- Missing minimum retention period is a violation

### Nothing Else Is Mandatory

- Only audit records, release records, and decision rationales are mandatory
- Other data retention is optional
- Mandatory retention is limited to these categories
- Requiring mandatory retention for other categories is prohibited

---

## 4. Expiry Enforcement

Expired data must:

### Be Flagged
- Expired data is flagged
- Flags indicate data has expired
- Flagging expired data is mandatory
- Missing flags is a violation

### Be Removed from Active Use
- Expired data is removed from active use
- Expired data is not used in operations
- Removing from active use is mandatory
- Using expired data is prohibited

### Be Deleted or Archived Explicitly

- Expired data is deleted or archived explicitly
- Deletion or archiving is deliberate and logged
- Explicit deletion/archiving is mandatory
- Silent deletion/archiving is prohibited

### Silent Expiry Is Forbidden

- Silent expiry is forbidden
- Expiry must be visible and logged
- Silent expiry is prohibited
- Silent expiry is a violation

---

## 5. Deletion Guarantees

When deletion is triggered:

### Data Is Removed from Storage
- Data is removed from storage
- Physical deletion occurs
- Removing from storage is mandatory
- Soft deletion only is prohibited

### References Are Invalidated
- References to deleted data are invalidated
- References no longer point to deleted data
- Invalidating references is mandatory
- Leaving valid references is prohibited

### Downstream Artifacts Are Notified

- Downstream artifacts are notified of deletion
- Artifacts that depend on deleted data are informed
- Notifying downstream artifacts is mandatory
- Missing notification is a violation

### Soft Deletes Are Not Sufficient

- Soft deletes are not sufficient
- Hard deletion is required
- Soft deletion only is prohibited
- Soft deletes are violations

---

## 6. Prohibited Data

Omega must not retain:

### Personal Identifiers Without Consent
- Personal identifiers are not retained without consent
- Consent is required for personal identifier retention
- Retaining without consent is prohibited
- Retaining personal identifiers without consent is a violation

### Sensitive Data Without Purpose
- Sensitive data is not retained without purpose
- Purpose must justify sensitive data retention
- Retaining without purpose is prohibited
- Retaining sensitive data without purpose is a violation

### Scraped Content Without Provenance

- Scraped content is not retained without provenance
- Provenance must be documented
- Retaining without provenance is prohibited
- Retaining scraped content without provenance is a violation

### Detected Prohibited Data → Immediate Purge

- Detected prohibited data is immediately purged
- Purge occurs without delay
- Immediate purge is mandatory
- Delaying purge is prohibited

---

## 7. Human Controls

Humans may:

### Extend Retention Explicitly
- Human can extend retention explicitly
- Extension is deliberate and logged
- Extending retention is allowed
- Extension cannot be prevented

### Force Deletion
- Human can force deletion
- Deletion is immediate and complete
- Forcing deletion is allowed
- Forced deletion cannot be prevented

### Audit Stored Categories

- Human can audit stored categories
- Categories and data are reviewable
- Auditing stored categories is allowed
- Audit requests cannot be denied

### Overrides Must Be Logged

- All human overrides must be logged
- Override logging is mandatory
- Missing override logs is a violation
- Override logging is required

---

## 8. Audit Trail

All retention actions must record:

### Data Category
- Data category is recorded
- Category classification is logged
- Category recording is mandatory
- Missing category is a violation

### Action Taken
- Action taken is recorded
- Retention, expiry, or deletion action is logged
- Action recording is mandatory
- Missing action is a violation

### Timestamp
- Timestamp is recorded
- Exact time of action is logged
- Timestamp recording is mandatory
- Missing timestamp is a violation

### Initiator

- Initiator is recorded
- Who triggered the action is logged
- Initiator recording is mandatory
- Missing initiator is a violation

### Audit Trail Format

```
[timestamp] [data_id] [category] [action] [initiator]
```

Example:
```
2024-12-13T10:23:45Z data-001 "transient" "deleted" "system_auto"
```

### Audit Trail Retention

- All retention action audit trails: Retained permanently
- Retention history: Retained for compliance
- Deletion records: Retained for accountability
- Minimum retention: Permanent for all retention logs

---

## 9. Separation from Learning

Deleted data must not:

### Influence Learning
- Deleted data does not influence learning
- Learning is not affected by deleted data
- Preventing learning influence is mandatory
- Deleted data influencing learning is prohibited

### Remain Embedded in Models
- Deleted data does not remain embedded in models
- Models do not contain deleted data
- Preventing embedding is mandatory
- Deleted data in models is prohibited

### Affect Future Decisions

- Deleted data does not affect future decisions
- Decisions are not influenced by deleted data
- Preventing decision influence is mandatory
- Deleted data affecting decisions is prohibited

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to retention or deletion rules
- Explicit revision is mandatory
- Ad-hoc changes are prohibited

### Revision Requirements

- Contract revisions must be documented
- Revisions require version control
- Revisions are traceable and auditable
- Undocumented revisions are violations

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to data categories or retention rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on data retention and privacy

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Unclassified data retention
- Missing retention duration, review interval, or deletion condition
- Defaulting to "keep forever" without justification
- Silent expiry or deletion
- Soft deletes only
- Retaining prohibited data
- Missing override logging
- Deleted data influencing learning or decisions
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to data categories, retention rules, minimum retention, or deletion guarantees require:
- Impact assessment on data retention and privacy
- Testing with representative data scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
