# Model & Agent Routing Contract

This contract defines how Omega routes tasks across models, agents, tools, and local systems without fragmentation or over-optimization.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Principle

Omega routes by:

### Task Type
- Task classification determines routing
- Task type is explicitly declared
- Routing matches task type to model capability
- Task type is primary routing factor

### Risk Level
- Risk level determines model selection
- High-risk tasks require higher-capability models
- Low-risk tasks use local or lower-cost models
- Risk level is a routing factor

### Required Reasoning Depth
- Reasoning depth requirement determines routing
- Deep reasoning requires reasoning-capable models
- Shallow reasoning uses simpler models
- Reasoning depth is a routing factor

### Cost Sensitivity
- Cost sensitivity determines routing
- Cost-sensitive tasks prefer local models
- Cost-insensitive tasks may use frontier models
- Cost sensitivity is a routing factor

### Latency Tolerance
- Latency tolerance determines routing
- Low-latency requirements prefer local models
- High-latency tolerance allows remote models
- Latency tolerance is a routing factor

### No Routing by Novelty or Brand

- Novelty is not a routing factor
- Brand is not a routing factor
- Routing is capability-based, not novelty-based
- Routing by novelty or brand is prohibited

---

## 2. Model Roles

Models are classified as:

### Reasoning
- Deep reasoning and complex logic
- Multi-step analysis and planning
- Architecture and strategic decisions
- High-stakes judgment tasks

### Drafting
- Content creation and writing
- Document generation and formatting
- Communication and synthesis
- Language-focused tasks

### Verification
- Quality checks and validation
- Consistency verification
- Error detection and correction
- Verification and review tasks

### Synthesis
- Combining multiple sources
- Integrating diverse information
- Cross-domain synthesis
- Synthesis and integration tasks

### Bulk Generation
- High-volume data generation
- Repetitive content creation
- Batch processing and formatting
- Bulk and scale tasks

### Each Task Must Declare Its Required Role

- Tasks must explicitly declare required model role
- Role declaration is mandatory
- Routing matches declared role to model capability
- Role declaration is non-negotiable

---

## 3. Agent Scope

Agents:

### Have One Responsibility
- Each agent has a single, defined responsibility
- Agent scope is explicitly bounded
- Agents do not expand beyond their responsibility
- Single responsibility is mandatory

### Cannot Self-Expand Scope
- Agents may not expand their own scope
- Agents may not assume new responsibilities
- Scope expansion requires explicit authorization
- Self-expansion is prohibited

### Cannot Call Other Agents Unless Explicitly Permitted
- Agents may not call other agents by default
- Agent-to-agent calls require explicit permission
- Permission is documented and logged
- Unauthorized agent calls are prohibited

### No Agent Autonomy Creep

- Agent autonomy does not increase over time
- Autonomy boundaries are fixed
- No gradual expansion of agent authority
- Autonomy creep is prohibited

---

## 4. Local vs Remote Execution

Omega must prefer:

### Local Models for Bulk, Low-Risk Work
- Bulk operations default to local models
- Low-risk tasks prefer local models
- Local-first is mandatory for bulk work
- Local models are preferred for low-risk tasks

### Remote Frontier Models for High-Stakes Reasoning
- High-stakes reasoning uses remote frontier models
- Complex reasoning requires frontier capability
- High-stakes tasks justify remote model use
- Frontier models are reserved for high-stakes work

### Cost-Aware Routing Is Mandatory

- Cost awareness is required in all routing decisions
- Cost is a routing factor, not optional
- Cost-aware routing is mandatory
- Cost-blind routing is prohibited

---

## 5. Fallback Behavior

If a routed model fails:

### Escalate Once
- Escalate to higher-capability model once
- Single escalation attempt only
- No multiple escalations
- Escalation is limited to one attempt

### Downgrade Complexity
- Reduce task complexity and retry
- Simplify requirements and retry
- Downgrade complexity is an option
- Complexity downgrade may be attempted

### Or Halt with Explanation
- Stop execution and explain failure
- Surface failure to human operator
- Provide clear explanation of failure
- Halt is acceptable when escalation/downgrade fail

### No Silent Retries

- Retries must be logged and visible
- No silent retry loops
- Retries are explicit and documented
- Silent retries are prohibited

---

## 6. Isolation

Routing decisions:

### Are Logged
- Every routing decision is logged
- Logging is mandatory, not optional
- Logs are comprehensive and complete
- Missing logs are violations

### Are Explainable
- Routing decisions are explainable
- Explanations are accessible and understandable
- Explanations do not require technical expertise
- Explainability is mandatory

### Do Not Leak Task Context Across Unrelated Runs
- Task context is isolated between runs
- Context does not leak between unrelated tasks
- Isolation is enforced and verified
- Context leakage is prohibited

---

## 7. Human Override

Human may:

### Pin a Model
- Human may specify exact model for a task
- Pinned model overrides default routing
- Pin is logged and documented
- Human pin authority is absolute

### Forbid a Model
- Human may prohibit use of specific model
- Forbidden models are excluded from routing
- Forbid is logged and documented
- Human forbid authority is absolute

### Force Local-Only Execution
- Human may force all tasks to use local models
- Local-only mode overrides all routing rules
- Local-only is logged and documented
- Human local-only authority is absolute

### Inspect Routing Logic
- Human may inspect routing decisions and logic
- Routing logic is accessible and reviewable
- Inspection does not require technical expertise
- Human inspection authority is absolute

---

## 8. Prohibited Behavior

Omega must not:

### Route Everything to the Strongest Model
- Not all tasks require strongest model
- Routing must match task needs, not default to strongest
- Over-provisioning is prohibited
- Defaulting to strongest model is prohibited

### Chase Benchmark Performance
- Benchmark performance is not a routing goal
- Routing is not optimized for benchmarks
- Benchmark chasing is prohibited
- Performance metrics do not drive routing

### Optimize for Speed Over Correctness
- Correctness takes precedence over speed
- Speed optimization may not compromise correctness
- Speed-over-correctness optimization is prohibited
- Correctness is primary

### Hide Routing Choices
- Routing choices must be visible
- Routing decisions are transparent
- Hidden routing is prohibited
- Transparency is mandatory

---

## 9. Audit Trail

Every routed task must record:

### Model Used
- Specific model identifier
- Model class or capability
- Model selection rationale
- Model used is mandatory

### Agent Used
- Specific agent identifier
- Agent responsibility and scope
- Agent selection rationale
- Agent used is mandatory

### Reason for Routing
- Why this model/agent was selected
- Which routing factors applied
- Routing decision rationale
- Reason for routing is mandatory

### Cost Class (Low / Medium / High)
- Cost classification for the task
- Cost estimate or actual cost
- Cost class is mandatory
- Cost tracking is required

### Log Format

```
[timestamp] [task_id] [model] [agent] [reason] [cost_class]
```

Example:
```
2024-12-13T10:23:45Z task-001 reasoning_model agent-001 "high_stakes_reasoning" high
```

### Log Retention

- All routing logs: Retained for auditability
- Cost tracking: Retained for budget analysis
- Routing decisions: Retained permanently
- Minimum retention: 2 years for all routing logs

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to routing principles or requirements
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on routing and cost

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Routing by novelty or brand
- Missing task role declaration
- Agent autonomy creep
- Cost-blind routing
- Silent retries
- Context leakage between tasks
- Routing everything to strongest model
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing principles, model roles, agent scope, or fallback behavior require:
- Impact assessment on routing quality and cost
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---
