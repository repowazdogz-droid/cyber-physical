# OMEGA Surface Standard

**Version:** 1.0  
**Package:** `omega-surface`

## 1. Purpose

This standard unifies all OMEGA products under:

- **Two surface types:** Room (spatial, layered, inspect-only) and Terminal (pipeline, stages, verification)
- **One ontology:** Structure / Constraints / Uncertainty / Assumptions
- **One artifact envelope:** Content + `_integrity` block (content hash, hash chain, Merkle root, known limitations, generation audit)
- **One verification philosophy:** Post-hoc verification — verify after generation, don’t bias before (no RAG in the reasoning path)

It is **not** a new product. It is the foundational layer that every existing and future build imports.

---

## 2. Ontology

Every OMEGA analysis is classified into four layers:

| Layer         | Purpose |
|---------------|--------|
| **Structure** | What exists: entities, relationships, source (observed / derived / declared) |
| **Constraints** | Rules and limits: hard / soft / policy; status (active / violated / satisfied / unknown); falsifiable |
| **Uncertainty** | What is unknown: magnitude (low / medium / high); reducible; method to reduce |
| **Assumptions** | What is taken for granted: status (active / tested / violated / retired); sensitivity; testable; test |

`OntologyState` holds arrays per layer and a `classified_at` ISO timestamp. Use `classifyToOntologyState()` to build it from classifiable items.

---

## 3. Artifact Envelope

Every OMEGA export is an `ArtifactEnvelope<T>`:

- `artifact_id`, `artifact_type`, `schema_version`, `created_at`
- `content: T` — the payload (synthesis, trace, brief, etc.)
- `ontology: OntologyState` — the four layers
- `_integrity: IntegrityBlock` — tamper-evident seal

### Integrity block

- `version`: e.g. `omega-surface-1.0`
- `sealed_at`: ISO timestamp
- `content_hash`: SHA-256 of canonical(content)
- `chain`: Hash chain of reasoning steps (each link: `node_type`, `content_hash`, `prev_hash`, `timestamp`)
- `merkle_root`: Merkle root of the chain
- `known_limitations`: Explicit list of what this artifact does **not** cover
- `generation_audit`: Deterministic vs LLM modules; verification status; verified / unverified / flagged counts

### Operations

- **createEnvelope**(artifact_type, content, ontology) → unsealed envelope
- **sealEnvelope**(envelope, chain_items, audit, known_limitations) → sealed envelope
- **verifyEnvelope**(envelope) → `{ valid, errors }`

Canonical encoding (sorted keys, no undefined, -0 → 0, non-finite → null) is the basis of deterministic hashing. Same content ⇒ same hash ⇒ same seal.

---

## 4. Surface Types

### Room

- **Type:** `room`
- **Semantics:** Spatial, layered, inspect-only. Human-in-the-loop locus. No autonomous execution.
- **Fields:** name, layers, presets, inspector (boolean), **execution: false**, human_controls (freeze, annotate, challenge)
- **Use:** Constraint Room, Orientation Lab, Pressure Lab, Vision rooms — layer toggles + inspector + no execution

### Terminal

- **Type:** `terminal`
- **Semantics:** Pipeline, stages, verification. Runs pipelines and proves work with integrity chains.
- **Fields:** name, stages (id, label, order, type, deterministic), integrity (hash_chain, post_hoc_verification, citation_check, tamper_detection), human_controls (freeze, revise, export)
- **Use:** Omega Trust Terminal, R&D engine, Decision engine — staged run → validate → hash chain → integrity panel

---

## 5. Post-Hoc Verification

Design rule: *Reasoning stays independent; then you ground only the claims that matter.*

- **verifyClaimsPostHoc**(claims, verifier) → summary (results, coverage, phantom_count, verified / unverified / contradicted / phantom)
- Inject your own verifier (e.g. web search, citation check, database). Do **not** run RAG before generation; verify claims **after** generation.

---

## 6. Integrity Check

- **recomputeChain**(envelope) → valid, content_hash_match, chain_valid, merkle_root_match, first_broken_index, errors
- **detectTamper**(envelope) → tampered, first_broken_index, errors

---

## 7. Export

- **exportAsJson**(envelope) / **exportAsJsonPretty**(envelope) — JSON string with `_integrity`
- **exportAsHtml**(envelope) — self-verifying HTML (embeds payload + inline verify script)
- **exportAsPdf**(envelope) — stub (implement later)

---

## 8. Acceptance Tests

All 15 acceptance tests (AT-SURFACE-001 … AT-SURFACE-015) must pass. See `tests/` for the canonical list and implementation.

---

## 9. What This Enables

Once this package is in use:

- **Tamper-evident exports** — seal any output, verify any import
- **Shared ontology** — Structure / Constraints / Uncertainty / Assumptions everywhere
- **Surface classification** — Room or Terminal with the correct invariants
- **Post-hoc verification** — shared infrastructure
- **Known limitations** — first-class field on every artifact

The package is the answer to: *How do 37 IP assets become one platform?*
