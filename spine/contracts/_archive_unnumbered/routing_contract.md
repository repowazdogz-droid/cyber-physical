# Routing & Model Orchestration Contract

This contract ensures Omega routes work to the right models and tools with maximum quality, minimum cost, and zero silent degradation.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Principles

Routing must follow these principles:

### Quality First, Cost Second, Speed Third
- Quality is the primary concern for all routing decisions
- Cost is optimized only when quality requirements are met
- Speed is optimized only when quality and cost are acceptable
- Explicit human override may reverse priorities, but must be logged

### Explicit Task-to-Model Mapping
- Every task type must have an explicit model mapping
- No implicit or inferred routing
- Routing decisions must be traceable and auditable
- Ambiguous tasks require human clarification

### No Single-Vendor Dependency
- Routing must support multiple vendors
- Fallback paths must use different vendors when possible
- No vendor lock-in through routing logic
- Vendor diversity is a requirement, not optional

### Local-First for Bulk or Low-Risk Work
- Bulk operations default to local models
- Low-risk tasks prefer local models
- Escalate to cloud only when local fails or task is high-stakes
- Local-first is mandatory for bulk work

### Frontier Models Reserved for High-Stakes Reasoning
- Frontier models are expensive and reserved for critical work
- High-stakes reasoning, architecture decisions, safety-critical analysis
- Frontier models require justification for use
- No bulk or low-stakes work on frontier models

---

## 2. Task Classification

Routing is defined for these canonical task types only:

### Research & Retrieval
- Information gathering, fact-checking, source finding
- Current events, trends, real-time data
- Knowledge base queries, documentation lookup
- **Allowed model set**: Tier B, Tier D (tools)

### Deep Reasoning / Planning
- Decision structuring, trade-off analysis
- Strategic planning, architecture decisions
- Complex reasoning, multi-step logic
- Critical analysis, evaluation
- **Allowed model set**: Tier A, Tier B

### Drafting & Synthesis
- Document drafting, content creation
- Summarization, synthesis of multiple sources
- Tone-sensitive communication
- Narrative or explanatory writing
- **Allowed model set**: Tier B, Tier C

### Code Generation
- Code generation, refactoring
- Bug fixes, code review
- Documentation generation
- Test writing, debugging
- **Allowed model set**: Tier B, Tier C

### Red-Teaming & Critique
- Security analysis, threat modeling
- Failure mode identification
- Adversarial testing, edge case discovery
- Critical review, dissent generation
- **Allowed model set**: Tier A, Tier B (dual-run preferred)

### Bulk Generation
- Synthetic data creation at scale
- Template filling, batch processing
- Repetitive content generation
- Large-scale formatting
- **Allowed model set**: Tier C only

### Evaluation & Judging
- Output quality assessment
- Consistency checks, validation
- Comparative evaluation
- Quality scoring
- **Allowed model set**: Tier B, Tier C

---

## 3. Model Tiers

Models are classified into these tiers:

### Tier A: Frontier Reasoning
- **Capability**: High-stakes, complex reasoning
- **Cost**: High
- **Volume**: Low (reserved for critical work)
- **Use cases**: Architecture decisions, critical analysis, high-stakes reasoning
- **Justification required**: Yes

### Tier B: Strong General Models
- **Capability**: General-purpose, strong performance
- **Cost**: Medium to High
- **Volume**: Medium
- **Use cases**: Most judgment, planning, writing, coding tasks
- **Justification required**: No (default for most tasks)

### Tier C: Local / Open Models
- **Capability**: Bulk processing, local computation
- **Cost**: Low (or free if local)
- **Volume**: High
- **Use cases**: Bulk generation, repetitive tasks, low-risk work
- **Justification required**: No (default for bulk)

### Tier D: Tools
- **Capability**: Specialized functions (search, parsing, linting)
- **Cost**: Low
- **Volume**: High
- **Use cases**: Information retrieval, code analysis, data processing
- **Justification required**: No

### Tier Rules

#### Bulk Work Defaults to Tier C
- All bulk generation uses Tier C
- No exceptions without explicit override
- Tier C is mandatory for high-volume tasks

#### Tier A Requires Justification
- Every Tier A use must have documented justification
- Justification must state why Tier B is insufficient
- Justification is logged with routing decision

#### Fallback Paths Must Exist for Every Tier
- Every tier must have a fallback option
- Fallback may be same tier (different model) or lower tier
- Fallback paths are documented and tested
- No tier is without fallback

---

## 4. Routing Logic

Routing logic must specify:

### Primary Model
- Default model for task type and tier
- Model selection based on task requirements
- Capability matching, not availability matching

### Fallback Model
- Alternative model if primary fails
- Different vendor preferred for fallback
- Fallback capability must meet task requirements

### Escalation Conditions
- When to escalate from lower tier to higher tier
- Conditions: quality failure, validation failure, explicit request
- Escalation requires logging and justification

### Confidence Thresholds for Escalation
- Minimum confidence required to avoid escalation
- Confidence below threshold triggers escalation
- Thresholds are task-type specific

### Max Retries Per Task
- Maximum number of retries before giving up
- Retries may use fallback or escalate tier
- After max retries: surface failure to human
- No infinite loops permitted

---

## 5. Cost Controls

Cost management is mandatory:

### Per-Task Cost Ceilings
- Maximum cost allowed per task type
- Ceilings are tier-specific
- Exceeding ceiling triggers downgrade or human approval

### Daily and Weekly Budgets
- Soft budgets: warnings when approached
- Hard budgets: stops when exceeded (if configured)
- Budgets are configurable but default to conservative

### Automatic Downgrades When Thresholds Hit
- When budget thresholds hit: automatically downgrade tier
- Downgrade from Tier A → Tier B → Tier C
- Quality may be reduced, but must be logged
- Human is notified of downgrade

### Alerts Before Hard Stops
- Alerts at 80% of daily/weekly budget
- Alerts at 95% of budget
- Hard stop at 100% (if configured)
- Alerts include: current spend, projected spend, time remaining

### No Silent Overspend
- All cost overruns are logged and surfaced
- No silent budget violations
- Overspend requires explicit approval or automatic downgrade

---

## 6. Performance Monitoring

Routing performance must be tracked:

### Success Rate by Task Type
- Percentage of tasks that meet quality threshold
- Tracked per task type and per tier
- Success rate informs routing updates

### Cost Per Output
- Average cost per successful output
- Tracked by task type and tier
- Used to optimize cost-efficiency

### Latency
- Time from task start to output delivery
- Tracked by task type and tier
- Used to optimize speed when quality allows

### Rollback Frequency
- How often routing decisions are rolled back
- Rollback indicates routing misalignment
- High rollback frequency triggers routing review

### Metrics Inform Routing Updates, Not Product Decisions
- Metrics are used to improve routing logic
- Metrics are not used to change product features or capabilities
- Routing optimization only, not product optimization

---

## 7. Human Override

Humans may override routing decisions:

### Human Can Force a Model or Tier
- Human operator may specify exact model or tier
- Override applies to single task or session
- Override reason must be provided

### Overrides Are Logged
- All overrides are logged with:
  - Human identifier
  - Override reason
  - Original routing decision
  - Override routing decision
  - Outcome (success/failure)

### Overrides Do Not Auto-Become Defaults
- Human overrides do not automatically update routing rules
- Overrides are one-time, not permanent
- To make override permanent: explicit routing rule update required

---

## 8. Audit & Transparency

Every routed task must be logged:

### Task Type
- Which canonical task type from section 2
- Task description or identifier

### Model Used
- Specific model identifier
- Model tier (A, B, C, or D)
- Vendor or provider

### Tier
- Tier classification (A, B, C, or D)
- Tier selection reason

### Reason for Selection
- Why this model/tier was selected
- Primary model, fallback, or escalation?
- Justification if Tier A

### Cost Estimate vs Actual
- Estimated cost before routing
- Actual cost after completion
- Variance and reason if significant

### Fallback Used (Yes/No)
- Whether fallback model was used
- Why fallback was triggered
- Fallback model identifier

### Log Format

```
[timestamp] [task_type] [model] [tier] [reason] [cost_est] [cost_actual] [fallback]
```

Example:
```
2024-12-13T10:23:45Z deep_reasoning model-x Tier_A "high-stakes architecture" high high no
```

### Log Retention

- All routing decisions: Retained for auditability
- Cost tracking: Retained for budget analysis
- Performance metrics: Retained for routing optimization
- Minimum retention: 2 years for all routing logs

---

## 9. Change Control

Routing rules may change only through defined process:

### Explicit Update
- Routing rule changes must be explicit and documented
- No ad-hoc edits to routing logic
- Changes require version control

### Explanation
- Every routing rule change must include explanation:
  - What changed
  - Why it changed
  - What it affects
  - Expected impact on quality, cost, speed

### Rollback Path
- Every routing rule change must have rollback path
- Previous routing rules must be preserved
- Rollback procedure must be documented

### No Ad-Hoc Edits
- No temporary routing changes
- No experimental routing without documentation
- No routing changes outside change control process

---

## Enforcement

Violations of this contract include:
- Routing bulk work to Tier A without justification
- Exceeding cost ceilings without downgrade
- Missing fallback paths for any tier
- Infinite retry loops
- Silent budget violations
- Missing or incomplete logs
- Ad-hoc routing rule changes

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing principles, task classification, model tiers, or cost controls require:
- Impact assessment on quality, cost, and vendor diversity
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---