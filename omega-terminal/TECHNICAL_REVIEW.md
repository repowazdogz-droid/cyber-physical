# OMEGA Terminal — Full Technical Description for External Review

## 1. What the tool does — user flow

The OMEGA Terminal has **two surfaces** that share the same conceptual engines but different runtimes and feature sets.

### 1.1 Browser UI (Vite + React)

- **Entry:** `npm run dev` → http://localhost:5173
- **Flow:** User picks **Engines** in the rail → selects **R&D** or **Decision** → enters a research question (R&D) or brief+context (Decision). Preloaded buttons fill the form. User clicks **EXECUTE**.
- **R&D:** Corpus is built (model-generated search queries → web search tool → assembled sources with SRC-1, SRC-2, …). Five stages run in order: Problem Definition → Literature Scan → Hypothesis Generation → Experimental Design → Validation & Governance. Each stage is validated (required fields + strict schema); literature stage gets citation verification (phantom detection, coverage). On success, a Merkle chain over stage outputs is computed and shown in **Integrity**. **Trust Stack** and **Signals** show protocol names and activity.
- **Decision:** Corpus is built the same way. Four stages: Strategic Assessment → Options Analysis → Risk & Governance → Board Brief. Same validation and Merkle chain. User can **FREEZE** then **REVISE** for another iteration.
- **Integrity panel:** Displays R&D and Decision chain root hashes and stage hashes; **RE-VERIFY** recomputes the chain from current stage data and compares to stored root.

### 1.2 Terminal test script (Node)

- **Entry:** `node scripts/test-engines.mjs [rd|dec] [--rigor] [--verify-dec]`
- **Flow (no flags):** One API call per engine (R&D Problem Definition with fixed Biomineralisation query; Decision Strategic Assessment with fixed ARIA Trust Infra brief). JSON is printed to stdout.
- **Flow (--rigor):** Baseline R&D and/or Decision → adversarial pass (stripped context: commitments + bottleneck / governing_tension) → unknowns prioritisation (impact/uncertainty/decision_sensitivity; VoI computed in code) → artifacts written to `test-output/rigor/`: `baseline.json`, `adversarial.json`, `prioritized-unknowns.json`, `quality-scorecard.md`, and when applicable `citations-to-verify.json`, `claims-to-verify.json`. Optional `--verify-dec` adds `decision-verification.json` (stub: claims listed with `verification_status: "not_run"`).
- **No browser, no Merkle chain, no SRC-N corpus, no schema validators** in the script; it is a separate pipeline for testing prompt quality and rigor flows.

---

## 2. Architecture: stages, state machine, pipeline steps

### 2.1 Browser UI

- **Modes:** Two engines (R&D, Decision). Navigation rail: Engines | Trust Stack | Integrity | Signals. Single active panel; no formal state machine — linear pipeline run plus freeze/revise (Decision only).
- **R&D pipeline steps (in order):**  
  1) Build corpus (query gen → web search → assemble SRC-N sources; hash corpus).  
  2) For each of 5 stages: call API with system prompt + previous stage outputs + corpus (when `needsCorpus`); parse JSON (repairJSON/parseLLMResponse); validate (required fields + STRICT_VALIDATORS_RD); for literature, run citation verification.  
  3) On all done: compute Merkle chain over stage data; set chain in state; show “the sentence” and chain root.
- **Decision pipeline steps:** Same pattern: build corpus → 4 stages (validate with STRICT_VALIDATORS_DEC) → compute Merkle chain.
- **Per-stage state:** idle | running | retrying | done | error. Up to MAX_RETRIES (2) on parse/validation failure.

### 2.2 Terminal script

- **Stages/modes:** Two engines (rd, dec). With `--rigor`: baseline → adversarial → unknowns → write artifacts. With `--verify-dec`: after artifacts, run `verifyDecisionClaims()` stub and write `decision-verification.json`.
- **State:** No explicit state machine. Sequential async: baseline.rd, baseline.dec, then adversarial.rd, adversarial.dec, then unknowns.rd, unknowns.dec, then `writeRigorArtifacts`, then optionally `writeDecisionVerificationIfRequested`. All in one process; no persistence.

---

## 3. AAT integrity features — what is implemented and how

| Feature | Implemented | Where | How |
|--------|-------------|--------|-----|
| **Canonical JSON hashing (lexicographic key sort, -0/NaN/Infinity handling)** | **Partial** | UI only: `src/utils/crypto.js` | `canonicalJSON()`: keys sorted with `Object.keys(obj).sort()`; numbers: `!Number.isFinite(obj) → "null"`, `Object.is(obj, -0) → "0"`. So lexicographic sort and -0/non-finite handling are there. **Terminal script:** does not hash or canonicalise JSON. |
| **SHA-256 with non-crypto fallback** | **Yes** | UI only: `src/utils/crypto.js` | `sha256()`: tries `crypto.subtle.digest("SHA-256", …)`; on failure (e.g. non-HTTPS) falls back to 32-bit hash string prefixed `NOCRYPTO-`. **Terminal script:** no hashing. |
| **Strict schema validators (type/value/enum)** | **Partial** | UI only: `src/utils/validators.js` | `STRICT_VALIDATORS_RD` / `STRICT_VALIDATORS_DEC`: required fields, array length, nested checks (e.g. key_papers[].title/finding, hypothesis generation_method in VALID_METHODS, governance.decision_gates/halt_triggers/abandonment_threshold). Not full JSON Schema; type and structural checks only. **Terminal script:** no validators; only `extractJSON()` (first `{` to last `}` + strip markdown). |
| **Externalized search corpus with SRC-N identifiers** | **Yes (UI)** | R&D/Decision engines | `buildCorpus()` assembles sources with `id: "SRC-" + srcC++`. Prompts: “Cite SRC-N only” / “EXTERNAL SOURCE CORPUS … Cite using SRC-N only.” **Terminal script:** no corpus; fixed prompts and briefs only. |
| **Citation verification (phantom detection, coverage %)** | **Yes (UI, R&D literature only)** | `src/utils/citations.js`, `RDEngine.jsx` | `verifyCitations(stageData, corpus)`: extracts SRC-N refs from stage data, compares to corpus ids; returns `valid_citations`, `phantom_citations`, `uncited_sources`, `coverage` (valid/corpus length), `all_verified`. Used for literature stage; phantom count shown in signals. **Terminal script:** extracts citations to `citations-to-verify.json` with warning; no verification step. |
| **Tamper-evident export envelope with _integrity block and recomputed hash** | **No** | — | No export format that wraps payload in an envelope with `_integrity: { rootHash, stageHashes, ... }` and a recomputed hash. IntegrityConsole shows chain and RE-VERIFY but there is no downloadable “export package” with an _integrity block. |
| **Known limitations array** | **Partial** | UI: `RDEngine.jsx` | `KNOWN_LIMITATIONS` constant exists and is referenced in design (TrustStackPanel lists KLD-1.0). It is **not** attached to a formal export or audit document; not in a single envelope. |
| **Generation audit trail** | **No** | — | No single structure (timestamp, model, corpus hash, chain root, limitations) written to a file or export. Chain root and stage hashes live in React state and are shown in Integrity; pipeline time and signals are ephemeral. |

**Summary:** The UI implements canonical JSON + SHA-256 + fallback, Merkle chain over stages, externalized SRC-N corpus, and citation verification (phantom + coverage) for the R&D literature stage. Strict validators are structural/type and partial enum. Tamper-evident export envelope, formal known-limitations export, and generation audit trail are not implemented.

---

## 4. Compromises for the runtime / “artifact” context

- **Browser vs Node:** Terminal script runs in Node; it does not use the UI’s crypto, citations, or validators. So integrity (hashing, chain, citation verification) exists only in the browser. No compromise per se for “Claude artifact renderer” — the script is headless and writes files.
- **UI renderer:** The app is a standard React SPA. No special “artifact” renderer; stage outputs are rendered inline (expand/collapse). Long hashes and JSON are shown in monospace with word-break. No markdown or rich artifact pane.
- **API key:** Browser cannot call Anthropic directly (CORS). Vite proxy and/or Vercel serverless (`api/anthropic/v1/messages.js`) forward to Anthropic and inject API key server-side. Terminal script reads key from `.env` and calls Anthropic directly from Node.
- **Web search:** In the UI, corpus uses the model’s web_search tool (Anthropic). Terminal script has no search; no corpus, so no SRC-N or citation verification there.

---

## 5. What’s stubbed, broken, or incomplete

- **Terminal script**  
  - **Stubbed:** `verifyDecisionClaims()` — no search API; returns claims with `verification_status: "not_run"`.  
  - **Incomplete:** No retrieval, no RAG, no citation verification, no hashing, no schema validation, no Merkle chain.  
  - **Fixed inputs:** R&D query and Decision brief/context are hardcoded (Biomineralisation, ARIA Trust Infra).

- **Browser UI**  
  - **Incomplete:** No export that includes an `_integrity` block and recomputed hash.  
  - **Incomplete:** Known limitations not included in a downloadable export or audit object.  
  - **Incomplete:** No generation audit trail document (model, timestamp, corpus hash, chain root, limitations in one structure).  
  - **Decision engine:** Citation verification (phantom/coverage) is not run for Decision stages; only R&D literature stage uses `verifyCitations`.

- **Shared**  
  - **Citation grounding:** Decision baseline (in terminal) uses “general knowledge — not verified”; no retrieval or post-hoc search verification is wired (only stub in script).  
  - **canonicalJSON:** No explicit handling of `NaN`/`Infinity` as distinct (they are collapsed to `"null"` via `Number.isFinite`); no bigint or special types.

---

## 6. Full source code (terminal pipeline)

The terminal pipeline is a single executable: **`scripts/test-engines.mjs`** in this repo (~530 lines). It contains the full runnable source: env loading, Anthropic API calls, R&D/Decision baseline prompts, adversarial prompts, unknowns prioritisation prompt, `extractJSON`, `computeVoI`, `stripBaselineForAdversarial`, `extractCitations`, `extractEmpiricalClaims`, `verifyDecisionClaims` stub, `scorecardFromArtifacts`, `writeRigorArtifacts`, `writeDecisionVerificationIfRequested`, and the main async IIFE that parses `rd`/`dec`/`--rigor`/`--verify-dec` and runs the pipelines.

**Canonical location:** `omega-terminal/scripts/test-engines.mjs`

Other relevant sources for the UI and integrity features:

- `omega-terminal/src/utils/crypto.js` — canonicalJSON, sha256, computeMerkleChain  
- `omega-terminal/src/utils/citations.js` — extractCitations, extractAllCitations, verifyCitations  
- `omega-terminal/src/utils/validators.js` — REQUIRED_FIELDS_*, STRICT_VALIDATORS_*, validateSchema*, repairJSON, parseLLMResponse  
- `omega-terminal/src/engines/RDEngine.jsx` — R&D pipeline, corpus, citation report, KNOWN_LIMITATIONS  
- `omega-terminal/src/engines/DecisionEngine.jsx` — Decision pipeline, corpus  
- `omega-terminal/src/components/IntegrityConsole.jsx` — chain display, RE-VERIFY  
- `omega-terminal/DESIGN.md` — epistemic hierarchy, post-hoc verification design, VoI note  

---

*Document generated for external review. AAT = Analytical Assurance / Integrity (feature set as discussed in context).*
