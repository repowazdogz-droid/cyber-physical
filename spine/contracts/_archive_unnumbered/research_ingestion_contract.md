# Research Ingestion & Evidence Discipline Contract

This contract ensures Omega ingests research rigorously without bias, hype, or contamination.

Version: 1.0  
Effective: 2024-12-13

---

## 1. What Qualifies as Research

Accepted:

### Peer-Reviewed Papers
- Academic papers with peer review
- Conference proceedings with peer review
- Preprints from reputable sources
- Peer review is required

### Technical Reports with Methods
- Technical reports that document methodology
- Reports with explicit methods sections
- Technical documentation with procedures
- Methods documentation is required

### Primary Data with Provenance
- Primary data with documented provenance
- Data with clear source and collection methods
- Primary data with metadata
- Provenance documentation is required

### Documented Field Observations
- Field observations with documentation
- Observations with context and methodology
- Field notes with explicit documentation
- Documentation is required

### Reproducible Experiments
- Experiments that can be reproduced
- Experiments with documented procedures
- Reproducible methodology
- Reproducibility is required

### Rejected

The following are rejected:

- **Opinion pieces**: Editorial content, opinion articles, commentary without evidence
- **Marketing material**: Promotional content, sales materials, marketing communications
- **Anonymous claims**: Claims without identifiable source or attribution
- **Social engagement metrics**: Likes, shares, engagement rates, popularity signals
- **Unverified summaries**: Summaries without source verification or validation

---

## 2. Source Classification

Each input must be labeled:

### Primary / Secondary / Tertiary
- Primary: Original research, first-hand data
- Secondary: Analysis or synthesis of primary sources
- Tertiary: Summaries or compilations of secondary sources
- Classification is mandatory

### Empirical / Theoretical / Anecdotal
- Empirical: Based on observation or experiment
- Theoretical: Based on theory or models
- Anecdotal: Based on individual cases or stories
- Classification is mandatory

### Internal / External
- Internal: Generated within Omega system
- External: From outside Omega system
- Classification is mandatory

### Time-Sensitive / Stable
- Time-sensitive: Information that changes over time
- Stable: Information that remains valid over time
- Classification is mandatory

### Unlabeled Inputs Are Ignored

- Inputs without classification are ignored
- Classification is mandatory for ingestion
- Unlabeled inputs are not processed
- Classification requirement is non-negotiable

---

## 3. Ingestion Gates

Research is ingested only if:

### Source Is Identifiable
- Source can be identified and verified
- Author or organization is known
- Source attribution is clear
- Identifiability is required

### Methodology Is Stated
- Research methodology is explicitly stated
- Methods are documented and described
- Methodology is clear and understandable
- Methodology statement is required

### Limitations Are Explicit
- Research limitations are explicitly stated
- Limitations are documented and clear
- Limitations are not hidden or minimized
- Explicit limitations are required

### Assumptions Are Declared
- Research assumptions are explicitly declared
- Assumptions are documented and visible
- Assumptions are not implicit or hidden
- Assumption declaration is required

### Otherwise → Quarantine

- Research that fails gates is quarantined
- Quarantined research is not ingested
- Quarantine is logged and reviewable
- Quarantine is automatic for gate failures

---

## 4. Evidence Weighting

Weight evidence by:

### Methodological Rigor
- More rigorous methods receive higher weight
- Rigor assessment is explicit
- Rigor is assessed objectively
- Methodological rigor is primary weighting factor

### Relevance to Current Decision
- More relevant research receives higher weight
- Relevance is assessed for specific decisions
- Relevance is context-dependent
- Relevance is a weighting factor

### Recency (Where Applicable)
- Recency matters when information changes over time
- Recency is not always relevant
- Recency is assessed contextually
- Recency is a secondary weighting factor

### Independence from Other Sources
- Independent sources receive higher weight
- Dependent sources receive lower weight
- Independence is assessed explicitly
- Independence is a weighting factor

### No Single Source Dominates

- No single source can dominate decision-making
- Multiple sources are required for important decisions
- Source diversity is maintained
- Single-source dominance is prohibited

---

## 5. Conflict Handling

When sources conflict:

### Surface Disagreement Explicitly
- Disagreements are surfaced, not hidden
- Conflicting views are presented clearly
- Disagreement is visible and accessible
- Explicit surfacing is mandatory

### Do Not Average Away Contradictions
- Contradictions are not averaged or smoothed
- Disagreement is preserved, not resolved
- Contradictions remain visible
- Averaging contradictions is prohibited

### Preserve Minority Findings
- Minority findings are preserved
- Dissenting views are maintained
- Minority positions are not suppressed
- Minority preservation is mandatory

### Flag Uncertainty Increase
- Conflicts increase uncertainty
- Uncertainty is explicitly flagged
- Uncertainty level is communicated
- Uncertainty flagging is mandatory

---

## 6. Hype Suppression

Omega must:

### Strip Claims to Testable Statements
- Claims are reduced to testable statements
- Hype and exaggeration are removed
- Core testable claims are extracted
- Hype stripping is mandatory

### Ignore Novelty as a Signal
- Novelty is not a quality indicator
- Novelty does not increase weight
- Novelty is ignored in evaluation
- Novelty is not a signal

### Downweight Sensational Language
- Sensational language reduces weight
- Hyperbolic claims are downweighted
- Sensationalism is penalized
- Sensational language is downweighted

### Avoid Trend-Following
- Trend-following is avoided
- Popularity does not increase weight
- Bandwagon effects are resisted
- Trend-following is prohibited

---

## 7. Research Decay

Omega must:

### Timestamp All Inputs
- Every research input is timestamped
- Timestamps are immutable
- Timestamps enable temporal analysis
- Timestamping is mandatory

### Periodically Revalidate Key Claims
- Key claims are periodically revalidated
- Revalidation schedule is documented
- Revalidation checks claim validity
- Periodic revalidation is mandatory

### Expire Stale Findings Deliberately
- Stale findings are deliberately expired
- Expiration is intentional and documented
- Stale findings are removed from active use
- Deliberate expiration is mandatory

---

## 8. Separation from Learning

Research ingestion does not equal learning.

### Research Ingestion Is Information Gathering
- Research ingestion is information collection
- Ingestion does not imply learning
- Research is information, not knowledge
- Ingestion is separate from learning

### Learning Requires Outcomes (See Learning Loop Contract)
- Learning requires outcomes from decisions
- Learning requires feedback and results
- Learning is separate from research ingestion
- Learning follows learning_loop_contract

---

## 9. Human Oversight

Human may:

### Whitelist Sources
- Human may whitelist trusted sources
- Whitelisted sources bypass some gates
- Whitelist is logged and documented
- Human whitelist authority is absolute

### Blacklist Domains
- Human may blacklist domains or sources
- Blacklisted sources are not ingested
- Blacklist is logged and documented
- Human blacklist authority is absolute

### Override Weighting
- Human may override evidence weighting
- Override is explicit and documented
- Override is logged with rationale
- Human override authority is absolute

### Demand Justification
- Human may demand justification for ingestion
- Justification must be provided
- Ingestion is blocked until justification
- Human justification demand is absolute

---

## 10. Audit Trail

All ingested research must have:

### Source Link
- Link to original source
- Source is accessible and verifiable
- Source link is permanent
- Source link is mandatory

### Ingestion Date
- Date when research was ingested
- Ingestion date is immutable
- Date enables temporal analysis
- Ingestion date is mandatory

### Assigned Weight
- Weight assigned to research
- Weighting rationale is documented
- Weight is reviewable and adjustable
- Assigned weight is mandatory

### Usage Context
- Context in which research is used
- Decision or application context
- Usage is documented and traceable
- Usage context is mandatory

### Log Format

```
[timestamp] [source_id] [classification] [weight] [context] [status]
```

Example:
```
2024-12-13T10:23:45Z src-001 primary_empirical_external_stable 0.85 "decision_quality" ingested
```

### Log Retention

- All ingestion logs: Retained permanently
- Source history: Retained permanently
- Weighting history: Retained permanently
- Minimum retention: 5 years for all ingestion logs

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to research definitions or requirements
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on research ingestion and evidence discipline

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Ingesting unqualified sources
- Missing source classification
- Ingesting research that fails gates
- Allowing single-source dominance
- Averaging away contradictions
- Missing or incomplete audit trails
- Overriding human oversight

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to research definitions, source classification, ingestion gates, or evidence weighting require:
- Impact assessment on evidence quality and rigor
- Testing with representative sources
- Approval from system owner
- Version increment
- Documentation in change logs

---