# Model Routing & Orchestration Contract

This contract ensures Omega routes tasks to the right models deterministically, safely, and cost-efficiently.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Principle

### Route by Task Class, Not Preference

- Routing is based on task class classification
- Task class determines model selection
- Routing is objective, not subjective
- Task class is the primary routing factor

### No Manual "Pick a Model Because It Feels Good"

- Model selection is not based on preference
- Model selection is not based on feeling
- Model selection is rule-based, not intuitive
- Manual preference-based routing is prohibited

### Routing Is Deterministic

- Routing decisions are deterministic
- Same task class always routes to same model type
- Routing is predictable and repeatable
- Non-deterministic routing is prohibited

---

## 2. Task Classes (Exhaustive)

Each task must declare one class:

### Architecture & System Design
- System architecture planning and design
- Structural decisions with long-term impact
- Architecture tasks require deep reasoning
- Architecture is a distinct task class

### Safety / Red Teaming
- Safety analysis and risk assessment
- Adversarial testing and failure mode analysis
- Red teaming and misuse resistance
- Safety/red teaming is a distinct task class

### High-Stakes Reasoning
- Complex reasoning with significant consequences
- Strategic decisions affecting outcomes
- High-stakes judgment and analysis
- High-stakes reasoning is a distinct task class

### Long-Form Drafting
- Extended content creation and writing
- Document generation and synthesis
- Narrative and communication tasks
- Long-form drafting is a distinct task class

### Bulk Generation
- Large-scale content or data generation
- Batch processing and repetitive operations
- High-volume production tasks
- Bulk generation is a distinct task class

### Verification & Review
- Quality checks and validation
- Consistency verification and error detection
- Review and approval workflows
- Verification/review is a distinct task class

### Multimodal Analysis
- Image, video, or audio processing
- Cross-modal understanding and synthesis
- Multimodal content generation
- Multimodal analysis is a distinct task class

### Real-Time Research
- Live information retrieval and synthesis
- Current events and trend analysis
- Time-sensitive research tasks
- Real-time research is a distinct task class

### Task Class Declaration Is Mandatory

- Every task must declare its class
- Undeclared tasks are rejected
- Task class declaration is non-negotiable
- Missing task class is a violation

---

## 3. Default Routing Map

### Architecture / High-Stakes Reasoning → Frontier Reasoning Model
- Architecture tasks route to frontier reasoning models
- High-stakes reasoning routes to frontier reasoning models
- Frontier reasoning models provide required capability
- Routing to frontier reasoning is mandatory for these classes

### Safety / Red Team → Independent Frontier Model
- Safety tasks route to independent frontier models
- Red team tasks route to independent frontier models
- Independence prevents conflict of interest
- Routing to independent frontier models is mandatory for safety/red team

### Long-Form Drafting → High-Quality Writing Model
- Long-form drafting routes to high-quality writing models
- Writing models provide language and synthesis capability
- High-quality writing models are required
- Routing to writing models is mandatory for drafting

### Bulk Generation → Local Models (See Contract 31)
- Bulk generation routes to local models
- Contract 31 governs bulk generation routing
- Local models are mandatory for bulk generation
- Routing to local models is mandatory for bulk generation

### Verification / Review → Different Model Than Author
- Verification routes to different model than content author
- Review routes to different model than content author
- Different model prevents self-verification
- Routing to different model is mandatory for verification/review

### Multimodal (Images/Video/Audio) → Native Multimodal Model
- Multimodal tasks route to native multimodal models
- Native multimodal models provide required capability
- Multimodal models are required for multimodal tasks
- Routing to multimodal models is mandatory for multimodal tasks

### Real-Time Research → Search-Enabled Model
- Real-time research routes to search-enabled models
- Search-enabled models provide current information access
- Search capability is required for real-time research
- Routing to search-enabled models is mandatory for real-time research

### Undeclared Tasks Are Rejected

- Tasks without declared class are rejected
- Undeclared tasks do not proceed
- Task class declaration is required
- Rejection of undeclared tasks is mandatory

---

## 4. Separation of Roles

### A Model That Authors Content Must Not Verify It
- Content authoring model cannot verify its own content
- Self-verification is prohibited
- Different model must perform verification
- Separation of author and verifier is mandatory

### A Model That Authors Content Must Not Safety-Approve It
- Content authoring model cannot safety-approve its own content
- Self-approval is prohibited
- Different model must perform safety approval
- Separation of author and safety approver is mandatory

### No Single-Model Pipelines

- Single-model pipelines are prohibited
- Multiple models are required for author-verify workflows
- Role separation is mandatory
- Single-model author-verify pipelines are violations

---

## 5. Escalation Rules

Escalate to frontier only if:

### Local Model Fails Quality Gates
- Local model quality gate failure justifies escalation
- Quality gate failure is an escalation trigger
- Escalation to frontier is allowed after quality gate failure
- Quality gate failure is a valid escalation reason

### Task Is Safety-Critical
- Safety-critical tasks justify frontier escalation
- Safety-critical classification is an escalation trigger
- Escalation to frontier is allowed for safety-critical tasks
- Safety-critical classification is a valid escalation reason

### Architecture Is Being Defined or Revised
- Architecture definition justifies frontier escalation
- Architecture revision justifies frontier escalation
- Architecture work is an escalation trigger
- Architecture work is a valid escalation reason

### Escalation Must Be Logged

- All escalations must be logged
- Escalation logging is mandatory
- Escalation reason must be recorded
- Missing escalation logs are violations

---

## 6. Cost Discipline

Every routed task must declare:

### Expected Cost Class (LOW / MED / HIGH)
- Cost class declaration is mandatory
- LOW, MED, or HIGH must be specified
- Cost class is required for all tasks
- Missing cost class declaration is a violation

### Justification If Not LOW
- MED cost class requires justification
- HIGH cost class requires justification
- Justification must explain why higher cost is necessary
- Missing justification for MED/HIGH is a violation

### Cost Class Defaults

- Default cost class is LOW
- LOW is assumed if not specified
- Higher cost classes require explicit declaration
- Defaulting to LOW is standard practice

---

## 7. Determinism

Routing decisions must be:

### Rule-Based
- Routing decisions follow explicit rules
- Rules are documented and auditable
- Rule-based routing is mandatory
- Ad-hoc routing decisions are prohibited

### Explainable
- Routing decisions are explainable
- Explanations are accessible and understandable
- Explainability is mandatory
- Unexplainable routing is prohibited

### Reproducible
- Routing decisions are reproducible
- Same inputs produce same routing decisions
- Reproducibility is mandatory
- Non-reproducible routing is prohibited

### No Hidden Heuristics

- Hidden heuristics are prohibited
- All routing logic must be explicit
- Hidden routing logic is a violation
- Transparency in routing is mandatory

---

## 8. Failure Handling

If a routed model:

### Refuses
- Model refusal triggers failure handling
- Refusal must be surfaced to human
- Pipeline must halt on refusal
- Refusal handling is mandatory

### Degrades Quality
- Quality degradation triggers failure handling
- Quality degradation must be detected
- Pipeline must halt on quality degradation
- Quality degradation handling is mandatory

### Produces Unsafe Output
- Unsafe output triggers failure handling
- Unsafe output must be detected
- Pipeline must halt on unsafe output
- Unsafe output handling is mandatory

### Then:

#### Halt the Pipeline
- Pipeline halts immediately on failure
- No continuation after failure
- Halt is mandatory on failure
- Continuing after failure is prohibited

#### Surface the Failure
- Failure must be surfaced to human operator
- Failure details must be visible
- Failure visibility is mandatory
- Hidden failures are violations

#### Require Human Decision
- Human decision is required after failure
- No automatic retry or recovery
- Human decision is mandatory
- Automatic recovery is prohibited

---

## 9. Audit Trail

For each routed task record:

### Task Class
- Task class that was declared
- Task class used for routing
- Task class is mandatory in audit trail
- Missing task class in audit trail is a violation

### Model Used
- Specific model that was used
- Model identifier and version
- Model used is mandatory in audit trail
- Missing model in audit trail is a violation

### Reason for Routing
- Why this model was selected
- Which routing rule applied
- Reason for routing is mandatory in audit trail
- Missing reason in audit trail is a violation

### Cost Class
- Cost class that was declared
- Cost class that was used
- Cost class is mandatory in audit trail
- Missing cost class in audit trail is a violation

### Outcome
- Success or failure status
- Quality gate results
- Outcome details
- Outcome is mandatory in audit trail

### Audit Trail Format

```
[timestamp] [task_id] [task_class] [model] [reason] [cost_class] [outcome]
```

Example:
```
2024-12-13T10:23:45Z task-001 "high_stakes_reasoning" "frontier_reasoning_v2" "default_routing_map" "HIGH" "success"
```

### Audit Trail Retention

- All routing audit trails: Retained for 2 years minimum
- Cost tracking: Retained for budget analysis
- Failure records: Retained permanently
- Minimum retention: 2 years for all routing logs

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to routing rules or task classes
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on routing, cost, and safety

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Routing by preference instead of task class
- Missing task class declaration
- Single-model author-verify pipelines
- Unlogged escalations
- Missing cost class declaration
- Hidden routing heuristics
- Continuing pipeline after failure
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing principles, task classes, default routing map, or escalation rules require:
- Impact assessment on routing quality, cost, and safety
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---
