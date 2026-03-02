# OMEGA Test Scenarios

Canonical specification for deterministic scenario playback across Factory, Defence, and MEV demos. Run before deploy via `test-scenarios.html` (local server required, e.g. `npx serve .`).

---

## 1. MEV Trust Auction (5 scenarios)

**Demo:** `mev-trust-auction-v2.html`

| # | Scenario | Trigger | Expected outcome |
|---|----------|---------|------------------|
| 1 | **Clean Auction** | `runScenario('clean')` | No blocked bundles; no broken bundles; no adversarial alerts; Watcher verification hash present. |
| 2 | **Sandwich Attack Blocked** | `runScenario('sandwich')` | Exactly one bundle type SANDWICH with status BLOCKED; policy text includes SANDWICH_DETECTED; no CENSORSHIP DETECTED; no ADVERSARIAL INTEGRITY CHECK FAILED; no non-sandwich bundle wrongly BLOCKED. |
| 3 | **Bid Tampering Caught** | `runScenario('tamper')` | Adversarial integrity / bid altered text; at least one bundle BROKEN; no SANDWICH_DETECTED. |
| 4 | **Relay Censorship** | `runScenario('censor')` | CENSORSHIP DETECTED present; no SANDWICH_DETECTED. |
| 5 | **Full Adversarial** | `runScenario('adversarial')` | Sandwich blocked (SANDWICH_DETECTED or SANDWICH + BLOCKED); bid tampering detected (ADVERSARIAL INTEGRITY CHECK FAILED or BROKEN). |

**Checks (summary):** Bundle status (BLOCKED, BROKEN, SELECTED), policy violation text, Watcher verification, absence of wrong alert types per scenario.

---

## 2. Factory Floor Intelligence (4 scenarios)

**Demo:** `factory-floor-intelligence.html`

| # | Scenario | Trigger | Expected outcome |
|---|----------|---------|------------------|
| 1 | **Nominal** | `loadExample('nominal'); analyse()` | No policy enforcement (no LOTO ENFORCED, LINE HALT, DERATE); line speed 100% or no 70% derate. |
| 2 | **Safety Derate** | `loadExample('safety'); analyse()` | MFG-SAFE-001 / derate / 70% present; bearing temp display ≥ 95°C. |
| 3 | **LOTO Breach** | `loadExample('loto'); analyse()` | LOTO lockout (LOTO + LOCKOUT or MFG-LOTO-001); motor current display > 22A. |
| 4 | **Quality Halt** | `loadExample('quality'); analyse()` | MFG-QUAL-001 or HALT or LINE HALT; scrap rate display > 5%. |

**Checks (summary):** Policy IDs and enforcement text, sensor readouts (bearing temp, motor current, scrap rate, line speed) match scenario intent.

---

## 3. Defence Autonomous Governance (4 scenarios)

**Demo:** `defence-autonomous-governance.html`

| # | Scenario | Trigger | Expected outcome |
|---|----------|---------|------------------|
| 1 | **ISR** | `applyMissionPreset('isr'); runAnalysis()` | Monitoring / WEAPONS HOLD; no CLEARED TO ENGAGE or Executing. |
| 2 | **Convoy Escort** | `applyMissionPreset('escort'); runAnalysis()` | Engagement blocked by PID (PID + BLOCKED or below-threshold). |
| 3 | **Precision Strike** | `applyMissionPreset('strike'); runAnalysis()` | Blocked by civilian proximity (CIVILIAN/civilian + BLOCKED or SAFE ZONE). |
| 4 | **CASEVAC** | `applyMissionPreset('casevac'); runAnalysis()` | DANGER CLOSE or HUMAN AUTH or friendly-related escalation. |

**Checks (summary):** ROE/PID/civilian proximity and escalation text; no inappropriate engagement when preset implies hold or block.

---

## Architecture thread (shared across all three)

- **Single reasoning spine:** OBSERVE → DERIVE → ASSUME → DECIDE → ACT. Same five nodes in every demo; only the *content* of each node is domain-specific.
- **Hash chaining:** Each node’s hash depends on its content and the previous node’s hash. Tampering any node invalidates every downstream hash. Canonical encoding is deterministic (identical inputs → identical hashes).
- **Human mandates:** Policies (Factory: MFG-SAFE-001, MFG-LOTO-001, MFG-QUAL-001; MEV: no sandwich, bid ceiling, receipt = canonical; Defence: ROE, PID, civilian proximity, danger-close rules) are set *before* the system runs. The AI cannot relax or override them; it can only enforce or refuse.
- **Deterministic playback:** Scenarios are defined by fixed inputs (sliders, presets, or scenario IDs). No randomness in scenario data. Same scenario → same reasoning chain and same observable outcome, so tests are repeatable.
- **Audit surface:** Every demo exposes the chain (and, where applicable, mechanism/audit inspector). Verification is “recompute hash from canonical encoding and compare”; disputes reduce to the first point of divergence.

---

## Cross-domain primitive

The cross-domain primitive is: **governed transition**.

- **Input:** A proposed action (or state change) and a set of human-defined policies.
- **Process:** Run the single spine (OBSERVE → DERIVE → ASSUME → DECIDE → ACT) on a canonical encoding of the input and context; evaluate each policy against derived state; compute outcome (proceed / block / flag / hold) and record it in the chain.
- **Output:** A hash-chained trace of what was observed, derived, assumed, decided, and done (or refused), plus an explicit outcome (e.g. APPROVED, BLOCKED, FLAGGED, HELD).

Domain changes only the *vocabulary* of the input and the *names* of the policies. The mechanism—one spine, one chain, policies as boundaries, deterministic replay—is the same. That is what we test: same architecture, three domains, 13 scenarios.
