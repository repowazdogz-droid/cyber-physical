# Model Routing & Execution Orchestration Contract

This contract ensures Omega uses the right model (local or API) for each task, maximizing quality, cost-efficiency, privacy, and reliability. Prevent accidental overuse of frontier models.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Principles (Non-Negotiable)

Routing must follow these principles:

### Use the Cheapest Model That Meets Requirements
- Select lowest-cost model that satisfies task requirements
- Do not over-provision model resources
- Cost optimization is mandatory when quality is sufficient
- Escalate to expensive models only when cheaper models fail

### Prefer Local Models for Bulk, Repetitive, or Synthetic Generation
- Bulk operations default to local models
- Repetitive tasks use local models
- Synthetic data generation uses local models
- Local-first is mandatory for high-volume work

### Reserve Frontier APIs for High-Stakes Reasoning, Synthesis, or Judgment
- Frontier APIs are expensive and reserved for critical work
- Use frontier APIs only for: high-stakes reasoning, complex synthesis, critical judgment
- No bulk or convenience use of frontier APIs
- Frontier API use requires justification

### Never Couple Logic to a Single Vendor
- Routing must support multiple vendors
- Fallback paths must use different vendors when possible
- No vendor lock-in through routing logic
- Vendor diversity is a requirement, not optional

---

## 2. Task Classification

Tasks must be classified into these classes. Each task must declare its class before execution:

### Bulk Generation
- Synthetic data creation at scale
- Template filling, batch processing
- Repetitive content generation
- Large-scale formatting

### Exploratory Reasoning
- Hypothesis generation, what-if analysis
- Exploratory thinking, brainstorming
- Divergent ideation, alternative exploration
- Non-critical reasoning tasks

### High-Stakes Logic
- Architecture decisions, strategic planning
- Safety-critical analysis, governance decisions
- Complex multi-step reasoning
- Critical judgment tasks

### Creative Synthesis
- Writing, content creation, narrative generation
- Synthesis of multiple sources
- Tone-sensitive communication
- Nuanced expression

### Red Teaming / Adversarial Critique
- Security analysis, threat modeling
- Failure mode identification
- Adversarial testing, edge case discovery
- Critical review, dissent generation

### Summarisation / Formatting
- Document summarization
- Content formatting, restructuring
- Information extraction, key point identification
- Low-complexity text processing

### Perception / Multimodal Analysis
- Image analysis, video processing
- Spatial reasoning, 3D understanding
- Multimodal content generation
- XR content creation

---

## 3. Default Routing Table

Specify defaults for model selection:

### Local Open Models → Bulk, Data Generation, Simulations
- Default for: bulk generation, data generation, simulations
- Use when: High volume, low complexity, privacy-sensitive
- Cost: Lowest
- Capability: Sufficient for bulk and repetitive tasks

### GPT-Class Reasoning Models → Complex Planning & Judgment
- Default for: high-stakes logic, complex planning, critical judgment
- Use when: Deep reasoning required, multi-step logic, architecture decisions
- Cost: High
- Capability: Strong reasoning and planning

### Claude-Class Models → Writing, Nuance, Interpretation
- Default for: creative synthesis, writing, nuanced communication
- Use when: Tone-sensitive, interpretation, sophisticated language
- Cost: High
- Capability: Strong language and interpretation

### Gemini-Class Models → Multimodal & Large-Context Tasks
- Default for: perception/multimodal analysis, large-context tasks
- Use when: Vision, video, spatial reasoning, very long context
- Cost: Highest
- Capability: Multimodal and large-context processing

### Grok-Class Models → Red Teaming, Trend Scanning, Adversarial Views
- Default for: red teaming/adversarial critique, trend scanning
- Use when: Adversarial analysis, contrarian perspectives, trend analysis
- Cost: Medium to High
- Capability: Adversarial thinking, real-time information

### Abstraction Note

These are abstract model classes, not hard vendor lock-in. Actual routing may use equivalent models from different vendors that provide similar capabilities.

---

## 4. Cost Controls

Cost management is mandatory:

### Define Per-Task Cost Ceilings
- Maximum cost allowed per task class
- Ceilings are model-class specific
- Exceeding ceiling triggers downgrade or human approval
- Cost ceilings are documented and auditable

### Hard Stop When Budget Exceeded
- Daily/weekly budgets are enforced
- Hard stop when budget exceeded (if configured)
- No tasks proceed after hard stop
- Human approval required to continue

### Fallback to Cheaper Model with Warning
- When cost ceiling approached: automatically fallback to cheaper model
- Warning is surfaced to human
- Quality may be reduced, but must be logged
- Fallback is automatic, not optional

### Log All Overruns
- All cost overruns are logged
- Overruns include: task, model, cost, reason
- Overruns are reviewed for routing optimization
- No silent cost overruns

---

## 5. Privacy & Data Handling

Privacy requirements:

### Sensitive Data Defaults to Local or Private Models
- Customer data, personal information, credentials: local or private models only
- Proprietary data: local or approved private models only
- Sensitive data may not use public APIs without approval
- Approved models are explicitly listed and documented

### No External API Calls Without Classification Approval
- Data classification determines routing eligibility
- Restricted data may not make external API calls
- Classification approval required for external calls
- Restricted tasks are logged and monitored

### Redact or Abstract Before Sending Externally Where Possible
- Sensitive identifiers must be redacted before external routing
- Customer data must be anonymized or abstracted
- Secrets must be replaced with placeholders
- Redaction must be explicit and logged

---

## 6. Multi-Model Verification

When reliability matters:

### Allow Parallel Execution Across Models
- Critical tasks may execute on multiple models simultaneously
- Parallel execution uses different vendors when possible
- Parallel execution is optional, not mandatory
- Parallel execution requires explicit configuration

### Compare Outputs
- Outputs from parallel execution are compared
- Differences are identified and surfaced
- Comparison is automated and logged
- Comparison results inform final output selection

### Surface Disagreement Explicitly
- When models disagree: both outputs are presented
- Disagreement is explicitly noted
- No automatic resolution of disagreements
- Human decides between conflicting outputs

### Never Silently Merge Conflicting Answers
- Do not average or combine conflicting outputs
- Do not select "best" output automatically
- Do not weight outputs by model capability
- All selection must be explicit and human-directed

---

## 7. Bulk Execution Rule

Any task marked with the following must run on local models unless explicitly overridden:

### "Bulk"
- Tasks explicitly marked as bulk
- High-volume operations
- Repetitive processing
- Batch operations

### "Dataset Generation"
- Synthetic dataset creation
- Data generation at scale
- Training data generation
- Test data generation

### "Simulation Sweep"
- Parameter sweeps
- Monte Carlo simulations
- Large-scale scenario generation
- Exploratory simulation runs

### Override Requirements

Overrides for bulk execution rule require:
- Explicit human approval
- Justification for non-local execution
- Cost impact assessment
- Override is logged with reason

---

## 8. Override Mechanism

Allow manual override with the following requirements:

### Reason
- Override must include explicit reason
- Reason must justify deviation from default routing
- Reason is logged with override
- Reason must be substantive, not convenience

### Scope
- Override applies to: single task, session, or time period
- Scope is explicitly defined
- Scope is logged
- Override expires according to scope

### Duration
- Override duration is specified
- Duration may be: single use, session, time-limited, or indefinite
- Duration is logged
- Override expires according to duration

### Cost Impact
- Override cost impact is estimated
- Cost impact is surfaced to human
- Cost impact is logged
- Human acknowledges cost impact

### Overrides Are Logged

All overrides are logged with:
- Human identifier
- Reason, scope, duration, cost impact
- Original routing decision
- Override routing decision
- Outcome (success/failure)

---

## 9. Logging & Audit

For every routed task, the system must log:

### Task ID
- Unique identifier for the task
- Task description or identifier
- Task class from section 2

### Model Used
- Specific model identifier
- Model class (local, GPT-class, Claude-class, etc.)
- Vendor or provider

### Cost Estimate
- Estimated cost before routing
- Cost estimate based on: model tier, token usage, task complexity
- Cost estimate is logged with routing decision

### Success/Failure
- Whether task succeeded or failed
- Quality assessment if applicable
- Error details if failed
- Outcome is logged

### Fallback Usage
- Whether fallback model was used
- Why fallback was triggered
- Fallback model identifier
- Fallback outcome

### Log Format

```
[timestamp] [task_id] [model] [cost_est] [outcome] [fallback]
```

Example:
```
2024-12-13T10:23:45Z task-001 local_open_model low succeeded no
```

### Log Retention

- All routing decisions: Retained for auditability
- Cost tracking: Retained for budget analysis
- Failure patterns: Retained for routing improvements
- Minimum retention: 2 years for all routing logs

---

## 10. Change Control

Routing rules may only change via:

### Explicit Revision
- Routing rule changes must be explicit and documented
- No ad-hoc edits to routing logic
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every routing rule change must include rationale:
  - What changed
  - Why it changed
  - What it affects
  - Expected impact on quality, cost, privacy, reliability

### Rollback Path
- Every routing rule change must have rollback path
- Previous routing rules must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Using frontier APIs for bulk work without override
- Exceeding cost ceilings without downgrade
- Routing sensitive data to unapproved models
- Missing task classification before execution
- Silent merging of conflicting model outputs
- Missing or incomplete logs
- Routing rule changes without documented rationale

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing principles, task classification, default routing table, or cost controls require:
- Impact assessment on quality, cost, privacy, and reliability
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---