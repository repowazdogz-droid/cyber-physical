# Capability Sourcing Contract

This contract ensures Omega sources capabilities (models, tools, compute) deliberately, cost-efficiently, and without lock-in.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Capability Definition

A capability is:

### A Model
- Language models, reasoning models, or specialized models
- Models that generate outputs or make decisions
- Models are capabilities
- Models must be sourced according to this contract

### A Tool
- Software tools, utilities, or applications
- Tools that process inputs or produce outputs
- Tools are capabilities
- Tools must be sourced according to this contract

### A Compute Resource
- Computing infrastructure, servers, or processing units
- Resources that execute tasks or run models
- Compute resources are capabilities
- Compute resources must be sourced according to this contract

### A Service Endpoint
- API endpoints, web services, or remote services
- Endpoints that provide functionality or data
- Service endpoints are capabilities
- Service endpoints must be sourced according to this contract

### A Local System
- Local software, hardware, or integrated systems
- Systems that operate on-device or on-premises
- Local systems are capabilities
- Local systems must be sourced according to this contract

### Anything That Produces Outputs or Decisions Counts

- Any system that produces outputs is a capability
- Any system that makes decisions is a capability
- Output or decision production defines capability
- All capabilities must be sourced according to this contract

---

## 2. Sourcing Hierarchy

Omega must prefer, in order:

### Local Models
- Local models are first preference
- Local models provide privacy and cost efficiency
- Local models are preferred over external options
- Local models are tier 1

### Self-Hosted Tools
- Self-hosted tools are second preference
- Self-hosted tools provide control and independence
- Self-hosted tools are preferred over external services
- Self-hosted tools are tier 2

### Open or Replaceable APIs
- Open or replaceable APIs are third preference
- Open APIs provide flexibility and avoid lock-in
- Open APIs are preferred over proprietary APIs
- Open or replaceable APIs are tier 3

### Proprietary External APIs
- Proprietary external APIs are last preference
- Proprietary APIs are used only when necessary
- Proprietary APIs are least preferred
- Proprietary external APIs are tier 4

### Exceptions Require Justification

- Exceptions to sourcing hierarchy require justification
- Justification must explain why lower-tier option is necessary
- Exceptions are logged and reviewed
- Unjustified exceptions are violations

---

## 3. Use-Case Matching

Each capability must be mapped to:

### Task Type
- Specific task type the capability handles
- Task type mapping is mandatory
- Capabilities must match task types
- Unmapped capabilities are not used

### Required Reliability
- Reliability requirements for the capability
- Reliability level must be specified
- Reliability mapping is mandatory
- Missing reliability mapping is a violation

### Acceptable Error
- Acceptable error rate or tolerance
- Error tolerance must be defined
- Error mapping is mandatory
- Missing error mapping is a violation

### Cost Ceiling
- Maximum cost per use or per period
- Cost ceiling must be specified
- Cost ceiling mapping is mandatory
- Missing cost ceiling is a violation

### Latency Tolerance
- Acceptable latency for the capability
- Latency tolerance must be defined
- Latency mapping is mandatory
- Missing latency mapping is a violation

### Unmatched Capabilities Are Not Used

- Capabilities without use-case mapping are not used
- Unmatched capabilities are rejected
- Use-case matching is mandatory
- Using unmatched capabilities is prohibited

---

## 4. Bulk vs High-Stakes

Omega must:

### Route Bulk Generation to Local or Low-Cost Models
- Bulk generation uses local or low-cost models
- Bulk tasks default to cost-efficient capabilities
- Bulk routing to local/low-cost is mandatory
- Using premium models for bulk is prohibited

### Reserve Premium Models for High-Stakes Judgment
- Premium models are reserved for high-stakes judgment
- High-stakes tasks justify premium capability use
- Premium model reservation is mandatory
- Using premium models for non-high-stakes is prohibited

### Never Use Premium Models for Volume by Default

- Premium models are not used for volume by default
- Volume tasks default to cost-efficient capabilities
- Premium models for volume are exceptions
- Defaulting to premium models for volume is prohibited

---

## 5. Vendor Independence

Omega must:

### Avoid Single-Vendor Dependency
- Single-vendor dependency is avoided
- Multiple vendor options are maintained
- Avoiding single-vendor dependency is mandatory
- Single-vendor dependency is a violation

### Maintain at Least One Fallback Option
- At least one fallback option is maintained
- Fallback capabilities are available
- Maintaining fallback options is mandatory
- Missing fallback options is a violation

### Document Replacement Paths

- Replacement paths are documented for all capabilities
- Documentation explains how to replace capabilities
- Replacement path documentation is mandatory
- Missing replacement paths is a violation

---

## 6. Cost Discipline

For each capability, Omega must track:

### Per-Unit Cost
- Cost per use or per unit of output
- Per-unit cost tracking is mandatory
- Cost tracking is comprehensive and accurate
- Missing per-unit cost tracking is a violation

### Expected Volume
- Expected usage volume for the capability
- Volume estimates are required
- Expected volume tracking is mandatory
- Missing expected volume is a violation

### Monthly Ceiling
- Maximum monthly cost for the capability
- Monthly cost ceiling is required
- Monthly ceiling tracking is mandatory
- Missing monthly ceiling is a violation

### Exceeding Ceilings Requires Human Approval

- Exceeding cost ceilings requires human approval
- Approval must be explicit and logged
- Exceeding ceilings without approval is prohibited
- Unauthorized ceiling exceedance is a violation

---

## 7. Performance Review

Capabilities must be periodically reviewed for:

### Accuracy
- Accuracy of outputs or decisions
- Accuracy review is mandatory
- Accuracy degradation triggers review
- Missing accuracy review is a violation

### Drift
- Behavioral drift or quality degradation
- Drift detection is mandatory
- Drift triggers capability review
- Missing drift detection is a violation

### Cost-Effectiveness
- Cost-effectiveness compared to alternatives
- Cost-effectiveness review is mandatory
- Cost-effectiveness analysis is required
- Missing cost-effectiveness review is a violation

### Availability of Better Alternatives
- Better alternatives that may be available
- Alternative availability review is mandatory
- Alternative assessment is required
- Missing alternative review is a violation

### Stagnant Choices Are Retired

- Capabilities that do not improve are retired
- Stagnant capabilities are replaced
- Retiring stagnant choices is mandatory
- Retaining stagnant capabilities is prohibited

---

## 8. Security & Privacy Alignment

Capabilities must comply with:

### Data Handling Requirements
- Data handling requirements are met
- Capabilities comply with data policies
- Data handling compliance is mandatory
- Non-compliant data handling is prohibited

### Privacy Constraints
- Privacy constraints are respected
- Capabilities protect user privacy
- Privacy compliance is mandatory
- Privacy violations are prohibited

### Security Posture

- Security posture requirements are met
- Capabilities meet security standards
- Security compliance is mandatory
- Security violations are prohibited

### Non-Compliant Tools Are Disallowed

- Non-compliant tools are not used
- Compliance is mandatory for all capabilities
- Using non-compliant tools is prohibited
- Non-compliant tool use is a violation

---

## 9. Human Control

The human may:

### Approve or Block Capabilities
- Human can approve or block any capability
- Approval or blocking is absolute
- Human authority over capabilities is absolute
- Capability approval/blocking cannot be overridden

### Force Local-Only Operation
- Human can force local-only operation
- Local-only mode overrides sourcing hierarchy
- Local-only authority is absolute
- Local-only mode cannot be overridden

### Override Sourcing Priority
- Human can override sourcing priority
- Priority overrides are absolute
- Override authority is absolute
- Priority overrides cannot be overridden

### Demand Cost Reports
- Human can demand cost reports for any capability
- Cost reports must be provided
- Cost report demand authority is absolute
- Cost report requests cannot be denied

---

## 10. Audit Trail

For every capability, record:

### Source
- Source of the capability
- Vendor, provider, or origin
- Source is mandatory in audit trail
- Missing source in audit trail is a violation

### Purpose
- Purpose of the capability
- What the capability is used for
- Purpose is mandatory in audit trail
- Missing purpose in audit trail is a violation

### Cost Profile
- Cost profile of the capability
- Per-unit cost, volume, and monthly ceiling
- Cost profile is mandatory in audit trail
- Missing cost profile in audit trail is a violation

### Approval State
- Current approval state of the capability
- Approved, blocked, or pending
- Approval state is mandatory in audit trail
- Missing approval state in audit trail is a violation

### Replacement Options
- Available replacement options
- Fallback capabilities or alternatives
- Replacement options are mandatory in audit trail
- Missing replacement options in audit trail is a violation

### Audit Trail Format

```
[timestamp] [capability_id] [source] [purpose] [cost_profile] [approval_state] [replacement_options]
```

Example:
```
2024-12-13T10:23:45Z capability-001 "local_model" "bulk_generation" "$0.001/unit,1000/month,$1.00" "approved" "local_model_v2,cloud_fallback"
```

### Audit Trail Retention

- All capability audit trails: Retained for 2 years minimum
- Cost tracking: Retained for budget analysis
- Approval records: Retained permanently
- Minimum retention: 2 years for all capability logs

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to sourcing principles or rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on sourcing, cost, and independence

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Using capabilities without use-case matching
- Using premium models for bulk by default
- Single-vendor dependency without justification
- Exceeding cost ceilings without approval
- Using non-compliant tools
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to sourcing hierarchy, use-case matching, cost discipline, or vendor independence require:
- Impact assessment on sourcing, cost, and independence
- Testing with representative capabilities
- Approval from system owner
- Version increment
- Documentation in change logs

---
