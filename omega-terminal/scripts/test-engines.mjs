#!/usr/bin/env node
/**
 * Test R&D and Decision engines from terminal — one stage each, print output quality.
 * Usage: node scripts/test-engines.mjs   (runs both)
 *        node scripts/test-engines.mjs rd   (R&D only)
 *        node scripts/test-engines.mjs dec  (Decision only)
 *        node scripts/test-engines.mjs --rigor   (baseline + adversarial + unknowns + artifacts)
 *        node scripts/test-engines.mjs --rigor --verify-dec   (+ decision claim verification stub → decision-verification.json)
 *
 * Requires: .env with VITE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY (or parent .env)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  for (const dir of [root, resolve(root, "..")]) {
    const p = resolve(dir, ".env");
    if (!existsSync(p)) continue;
    try {
      readFileSync(p, "utf8").split("\n").forEach((line) => {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      });
    } catch (_) {}
  }
}
loadEnv();

const key = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!key || key === "sk-ant-...") {
  console.error("Missing API key. Set VITE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY in .env");
  process.exit(1);
}

async function anthropic(body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`API ${r.status}: ${raw}`);
  const data = JSON.parse(raw);
  const text = (data?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  if (!text) console.error("API returned no text content. Raw keys:", Object.keys(data || {}));
  return text;
}

function extractJSON(text) {
  if (!text || !text.trim()) throw new Error("Empty response");
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}") + 1;
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end));
    } catch (e) {
      console.error("Raw response (first 800 chars):", text.slice(0, 800));
      throw e;
    }
  }
  console.error("Raw response (first 800 chars):", text.slice(0, 800));
  throw new Error("No JSON object in response");
}

// --- R&D: Problem Definition (stage 1) ---
const RD_PROBLEM_PROMPT = `You are a research problem definition engine. Be opinionated: stake positions the adversarial pass will attempt to falsify.

CRITICAL: Respond with valid JSON only. No markdown fences. No preamble. Start with { and end with }.

Include a "commitments" array: your three strongest load-bearing claims — claims you believe are true and on which the rest of the analysis depends. Label them explicitly. The adversarial pass will attempt to falsify these. Example: ["Protein templating is necessary (not merely sufficient) for target mechanical properties.", "Correlation length is the primary scaling bottleneck.", "Lab-to-manufacturing gap is principally a control problem not a materials problem."]

{"title":"Concise research title","problem_statement":"One paragraph defining the core problem","domain":"Primary domain","adjacent_domains":["domain1","domain2"],"known_constraints":["constraint1"],"bottleneck":"The single point where progress is actually blocked","commitments":["claim1","claim2","claim3"],"hidden_variables":["Potential unmeasured forces"],"success_criteria":"What would a solution look like?","frontier_questions":["Questions not yet articulable"]}`;

const RD_QUERY =
  "How can protein-enabled biomineralisation achieve structural materials properties (>100 MPa tensile strength) at manufacturing scale, when current lab demonstrations are limited to millimetre-scale samples with highly variable mechanical properties?";

async function testRD() {
  console.log("\n" + "=".repeat(60));
  console.log("R&D ENGINE — Problem Definition (Biomineralisation)");
  console.log("=".repeat(60));
  console.log("Calling API...");
  const body = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    system: RD_PROBLEM_PROMPT,
    messages: [{ role: "user", content: "Research question: " + RD_QUERY + "\n\nProduce the Problem Definition." }],
  };
  const start = Date.now();
  const text = await anthropic(body);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const data = extractJSON(text);
  console.log(JSON.stringify(data, null, 2));
  console.log("\n[OK] R&D Problem Definition —", elapsed + "s");
  return data;
}

// --- Decision: Strategic Assessment (stage 1) ---
const DEC_STRATEGIC_PROMPT = `You are a strategic assessment engine. Be opinionated: stake positions the adversarial pass will attempt to falsify. Given a decision brief and context, produce a JSON object.

CRITICAL — Source discipline (lock this in): Do not invent specific report names, statistics, or citations. No "MIT Study 2023", no "4.2x duplication" or "89% failure rate" unless quoting from provided material. When no sources are provided to you, you MUST use key_sources with each entry having source_ref: "general knowledge — not verified". This is the required failure mode: honest labeling over impressive-looking fabrications. A decision-maker reading "general knowledge — not verified" knows to bring their own evidence.

Include a "commitments" array: your three strongest load-bearing claims — claims you believe are true and on which the recommendation depends. The adversarial pass will attempt to falsify these. Example: ["Horizontal-first fails without a single accountable owner.", "Hybrid model is politically feasible under current governance.", "12-month pressure makes pure vertical the default unless explicitly countered."]

Fields: governing_tension, failure_pathway, state_of_art, commitments (array of 3), key_sources (array of {title, finding, source_ref} — when no provided material, every source_ref MUST be exactly "general knowledge — not verified"). Valid JSON only, start { end }.`;

const DEC_BRIEF =
  "ARIA is evaluating whether to fund trust infrastructure as horizontal capability serving all programmes, or as vertical investments within specific programmes like Scaling Trust. Budget: £5M over 3 years.";
const DEC_CONTEXT =
  "Political pressure to show results within 12 months. Two programme directors have conflicting views.";

const RD_ADVERSARIAL_PROMPT = `You are an adversarial reviewer for research framing. You receive only the baseline's core commitments and bottleneck — attack these directly. Do not try to respond to every detail.

If the baseline makes a very specific testable claim (e.g. "variance originates in the first 5-15 minutes", or a precise mechanism), consider whether that claim is conveniently unfalsifiable without the exact experiments the baseline proposes — it could be motivated reasoning that directs resources toward the baseline's preferred investigation. Attack that too when relevant.

EVIDENCE DISCIPLINE: Do not invent specific statistics, study names, or citations (e.g. "150 MPa", "Additive manufacturing of X achieves Y"). Such claims are wrong 20-30% of the time and undermine the adversarial at the point it needs to be strongest. Prefer structural or theoretical arguments. If you use a specific empirical example, label it as "hypothetical" or "illustrative — not verified". The strongest adversarial move is reasoning that does not depend on unverifiable facts.

Return strict JSON only:
{
  "strongest_counterargument": "Single strongest critique of the baseline analysis",
  "contradiction_evidence": ["evidence that cuts against baseline assumptions — structural/theoretical preferred; no invented statistics or citations"],
  "failure_conditions": ["conditions where baseline framing fails"],
  "falsification_test": "experiment or observation that would most directly falsify baseline framing",
  "where_model_breaks": "specific regime where baseline logic is invalid"
}`;

const DEC_ADVERSARIAL_PROMPT = `You are an adversarial reviewer for strategic recommendations. You receive only the baseline's commitments and governing tension — attack these directly. Do not try to respond to every detail.

EVIDENCE DISCIPLINE: Do not invent specific statistics, report names, or citations (e.g. "DARPA Technical Office Review", "4.2x duplication", "89% failure rate"). Prefer structural or institutional reasoning. If you use a specific case or number, label it as "hypothetical" or "illustrative — not verified". The strongest adversarial move is reasoning that does not depend on unverifiable facts.

Return strict JSON only:
{
  "strongest_counterargument": "Single strongest critique of recommendation",
  "contradiction_evidence": ["historical or structural evidence against recommendation — no invented citations or stats"],
  "failure_conditions": ["conditions where recommendation fails"],
  "falsification_test": "what outcome/data would invalidate recommendation",
  "where_model_breaks": "governance or political regime where this model breaks"
}`;

const UNKNOWNS_PRIORITIZATION_PROMPT = `You are a value-of-information prioritization engine.
Given baseline + adversarial outputs, list unknowns by expected decision value. Provide impact_1_to_10, uncertainty_1_to_10, and decision_sensitivity_1_to_10 as integers (1-10). Do not compute VoI yourself — it will be computed from these three fields. Provide priority_rationale in prose.
Return strict JSON only:
{
  "top_unknowns": [
    {
      "unknown": "name",
      "why_decision_sensitive": "why this changes the decision",
      "impact_1_to_10": 1,
      "uncertainty_1_to_10": 1,
      "decision_sensitivity_1_to_10": 1,
      "next_action": "highest-leverage data pull or experiment"
    }
  ],
  "priority_rationale": "how you ranked these (prose); VoI will be computed as (impact × uncertainty × decision_sensitivity) / 30"
}`;

function hasNumber(str) {
  return /\d/.test(String(str || ""));
}

/** Compute VoI in code from impact × uncertainty × decision_sensitivity; re-sort; flag when model order disagrees with computed order. Model-supplied voi fields are stripped; only computed_voi_score is kept. */
function computeVoI(unknownsPayload) {
  const out = {};
  for (const [key, data] of Object.entries(unknownsPayload || {})) {
    if (!data?.top_unknowns?.length) {
      out[key] = { ...data, _voi_note: "VoI scores computed in code (impact × uncertainty × decision_sensitivity) / 30; model did not supply VoI." };
      continue;
    }
    const list = data.top_unknowns.map((u, idx) => {
      const { voi_score_1_to_10: _voi, ...rest } = u;
      const i = Math.min(10, Math.max(1, Number(u.impact_1_to_10) || 5));
      const uu = Math.min(10, Math.max(1, Number(u.uncertainty_1_to_10) || 5));
      const d = Math.min(10, Math.max(1, Number(u.decision_sensitivity_1_to_10) || 5));
      const computed = Math.round((i * uu * d) / 30 * 10) / 10;
      return { ...rest, computed_voi_score: computed, _model_index: idx };
    });
    const byComputed = [...list].sort((a, b) => (b.computed_voi_score || 0) - (a.computed_voi_score || 0));
    const modelOrderIds = list.map((u) => u.unknown);
    const computedOrderIds = byComputed.map((u) => u.unknown);
    const model_order_disagrees = modelOrderIds.some((id, i) => id !== computedOrderIds[i]);
    out[key] = {
      ...data,
      _voi_note: "VoI scores computed in code (impact × uncertainty × decision_sensitivity) / 30; model did not supply VoI.",
      top_unknowns: byComputed.map(({ _model_index, ...rest }) => rest),
      priority_rationale: data.priority_rationale,
      model_order_disagrees_with_computed_voi: model_order_disagrees,
    };
  }
  return out;
}

/** Pass only commitments + bottleneck (R&D) or commitments + governing_tension (Decision) so adversarial targets core claims. */
function stripBaselineForAdversarial(engine, baseline) {
  if (engine === "rd") {
    return {
      title: baseline?.title,
      commitments: baseline?.commitments ?? [],
      bottleneck: baseline?.bottleneck,
    };
  }
  if (engine === "dec") {
    return {
      governing_tension: baseline?.governing_tension,
      commitments: baseline?.commitments ?? [],
    };
  }
  return baseline;
}

/** Extract all cited sources from baseline for post-hoc verification. No verification is performed here. */
function extractCitations(baseline) {
  const out = [];
  const push = (engine, ref) => {
    if (ref && (ref.title || ref.source_ref)) out.push({ engine, ...ref });
  };
  for (const src of baseline?.dec?.key_sources || []) push("dec", src);
  for (const src of baseline?.rd?.key_sources || []) push("rd", src);
  return out;
}

/** Heuristic: pull out empirical-looking claims from adversarial (numbers, units, study-like phrases) for separate verification. */
function extractEmpiricalClaims(adversarial) {
  const claims = [];
  const add = (engine, sourceField, text) => {
    if (!text || typeof text !== "string") return;
    const hasNumber = /\d+(\.\d+)?\s*(%|MPa|GPa|months|years|x\s|×)/i.test(text) || /\b\d{2,}\b/.test(text);
    const looksLikeCitation = /\b(study|et al\.|report|assessment|review|survey)\b/i.test(text) || /\b(20\d{2}|19\d{2})\b/.test(text);
    if (hasNumber || looksLikeCitation) claims.push({ engine, source_field: sourceField, claim: text.slice(0, 400), verification_status: "unverified" });
  };
  for (const [key, data] of Object.entries(adversarial || {})) {
    add(key, "strongest_counterargument", data?.strongest_counterargument);
    add(key, "falsification_test", data?.falsification_test);
    for (const e of data?.contradiction_evidence || []) add(key, "contradiction_evidence", e);
  }
  return claims;
}

/**
 * Post-hoc verification stub for decision engine claims.
 * Design: search for each key claim (e.g. "programme director autonomy blocks infrastructure extraction")
 * and either upgrade source_ref with a real citation or flag "claim unverified — no supporting evidence found".
 * This preserves reasoning independence (no pre-generation RAG) while grounding claims after the fact.
 * Plug in your search API (Tavily, SerpAPI, etc.) here; for now returns claims with verification_status: "not_run".
 */
async function verifyDecisionClaims(decBaseline) {
  const claims = [];
  if (decBaseline?.governing_tension)
    claims.push({ claim: decBaseline.governing_tension, source_field: "governing_tension" });
  if (decBaseline?.failure_pathway)
    claims.push({ claim: decBaseline.failure_pathway, source_field: "failure_pathway" });
  for (const c of decBaseline?.commitments || [])
    claims.push({ claim: c, source_field: "commitments" });
  for (const s of decBaseline?.key_sources || [])
    if (s?.finding) claims.push({ claim: s.finding, source_field: "key_sources", title: s.title });
  return claims.map((c) => ({
    ...c,
    verification_status: "not_run",
    note: "Post-hoc web search verification can be plugged in; upgrade source_ref or set verification_status to 'unverified_no_evidence_found'.",
  }));
}

function scorecardFromArtifacts(baseline, adversarial, unknowns, citations = []) {
  const quantSignals = [
    baseline?.rd?.problem_statement,
    baseline?.rd?.bottleneck,
    baseline?.dec?.state_of_art,
  ].filter(hasNumber).length;
  const contradictionSignals =
    (adversarial?.rd?.contradiction_evidence?.length || 0) +
    (adversarial?.dec?.contradiction_evidence?.length || 0);
  const unknownSignals =
    (unknowns?.rd?.top_unknowns?.length || 0) + (unknowns?.dec?.top_unknowns?.length || 0);
  const actionSignals = [
    ...(unknowns?.rd?.top_unknowns || []),
    ...(unknowns?.dec?.top_unknowns || []),
  ].filter((u) => u?.next_action).length;

  const quantScore = Math.min(5, quantSignals * 2);
  const contradictionScore = Math.min(5, Math.ceil(contradictionSignals / 2));
  const uncertaintyScore = Math.min(5, Math.ceil(unknownSignals / 2));
  const actionabilityScore = Math.min(5, Math.ceil(actionSignals / 2));
  const overall =
    ((quantScore + contradictionScore + uncertaintyScore + actionabilityScore) / 4).toFixed(1);

  const voiDisagree =
    (unknowns?.rd?.model_order_disagrees_with_computed_voi ? 1 : 0) +
    (unknowns?.dec?.model_order_disagrees_with_computed_voi ? 1 : 0);
  const citationsNote =
    typeof citations !== "undefined" && citations?.length > 0
      ? `

## Generated citations (UNVERIFIED)
- ${citations.length} citation(s) extracted from baseline outputs. These may be fabricated or loosely attributed.
- **Do not quote in high-stakes documents without verification.** A post-hoc verification step (e.g. web search) should be run before use. See \`citations-to-verify.json\`.`
      : "";

  const evidenceWarning = `

## Evidence vs reasoning (reliability)
- **Reasoning** (commitments, counterarguments, failure conditions, VoI rationale): produced by the model and robust across runs; treat as structured analysis to stress-test.
- **Evidence** (citations, statistics, specific empirical claims): model-generated and stochastic; reliability is lower. Treat all as unverified unless grounded by retrieval or verification. See \`citations-to-verify.json\` and \`claims-to-verify.json\` (if present).`;

  return `# Quality Scorecard

- Overall: **${overall}/5**
- Quantification: **${quantScore}/5**
- Contradiction handling: **${contradictionScore}/5**
- Uncertainty discipline: **${uncertaintyScore}/5**
- Actionability: **${actionabilityScore}/5**
${voiDisagree > 0 ? `- **Model order vs computed VoI:** ${voiDisagree} engine(s) had different intuitive vs computed ranking (informative).` : ""}

## Notes
- Quantification score is based on numeric signals present in baseline outputs.
- Contradiction handling score is based on adversarial evidence coverage.
- **VoI:** All scores in \`prioritized-unknowns.json\` are computed in code as (impact × uncertainty × decision_sensitivity) / 30; the model supplies only the three inputs and prose rationale.
- Uncertainty and actionability scores are based on prioritized unknowns and next actions.
${citationsNote || ""}
${evidenceWarning}
`;
}

function writeRigorArtifacts({ baseline, adversarial, unknowns }) {
  const outDir = resolve(root, "test-output", "rigor");
  mkdirSync(outDir, { recursive: true });
  const unknownsComputed = computeVoI(unknowns);
  const citations = extractCitations(baseline);
  const empiricalClaims = extractEmpiricalClaims(adversarial);
  writeFileSync(
    resolve(outDir, "baseline.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), baseline }, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(outDir, "adversarial.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), adversarial }, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(outDir, "prioritized-unknowns.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        _read_me: "Ranking and computed_voi_score in this file are computed in code (impact × uncertainty × decision_sensitivity) / 30; they are authoritative. Ignore any VoI numbers in the model's priority_rationale text.",
        unknowns: unknownsComputed,
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(
    resolve(outDir, "quality-scorecard.md"),
    scorecardFromArtifacts(baseline, adversarial, unknownsComputed, citations),
    "utf8",
  );
  if (citations.length > 0) {
    writeFileSync(
      resolve(outDir, "citations-to-verify.json"),
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          warning: "Citations are model-generated and may be fabricated or loosely attributed. Verify before use.",
          citations,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
  if (empiricalClaims.length > 0) {
    writeFileSync(
      resolve(outDir, "claims-to-verify.json"),
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          warning: "Empirical claims extracted from adversarial outputs (numbers, units, study-like phrases). Not verified; reliability is lower than reasoning.",
          claims: empiricalClaims,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
  return outDir;
}

/** Run post-hoc verification stub for decision baseline and write decision-verification.json. */
async function writeDecisionVerificationIfRequested(baseline, outDir) {
  if (!baseline?.dec) return;
  const verified = await verifyDecisionClaims(baseline.dec);
  writeFileSync(
    resolve(outDir, "decision-verification.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        note: "Post-hoc verification: search each claim and upgrade source_ref or set verification_status to 'unverified_no_evidence_found'. Plug search API into verifyDecisionClaims() in test-engines.mjs.",
        claims: verified,
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function testDec() {
  console.log("\n" + "=".repeat(60));
  console.log("DECISION ENGINE — Strategic Assessment (ARIA Trust Infra)");
  console.log("=".repeat(60));
  console.log("Calling API...");
  const body = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    system: DEC_STRATEGIC_PROMPT,
    messages: [
      {
        role: "user",
        content: "Brief: " + DEC_BRIEF + "\n\nContext: " + DEC_CONTEXT + "\n\nProduce the Strategic Assessment.",
      },
    ],
  };
  const start = Date.now();
  const text = await anthropic(body);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const data = extractJSON(text);
  console.log(JSON.stringify(data, null, 2));
  console.log("\n[OK] Decision Strategic Assessment —", elapsed + "s");
  return data;
}

async function testRDAdversarial(rdBaseline) {
  console.log("\n" + "-".repeat(60));
  console.log("R&D ADVERSARIAL PASS");
  console.log("-".repeat(60));
  console.log("Calling API...");
  const stripped = stripBaselineForAdversarial("rd", rdBaseline);
  const body = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2500,
    system: RD_ADVERSARIAL_PROMPT,
    messages: [
      {
        role: "user",
        content: `Baseline commitments and bottleneck only:\n${JSON.stringify(stripped, null, 2)}\n\nReturn adversarial review JSON.`,
      },
    ],
  };
  const text = await anthropic(body);
  const data = extractJSON(text);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function testDecAdversarial(decBaseline) {
  console.log("\n" + "-".repeat(60));
  console.log("DECISION ADVERSARIAL PASS");
  console.log("-".repeat(60));
  console.log("Calling API...");
  const stripped = stripBaselineForAdversarial("dec", decBaseline);
  const body = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2500,
    system: DEC_ADVERSARIAL_PROMPT,
    messages: [
      {
        role: "user",
        content: `Baseline commitments and governing tension only:\n${JSON.stringify(stripped, null, 2)}\n\nReturn adversarial review JSON.`,
      },
    ],
  };
  const text = await anthropic(body);
  const data = extractJSON(text);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function prioritizeUnknowns(engineName, baselineData, adversarialData) {
  console.log("\n" + "-".repeat(60));
  console.log(`${engineName.toUpperCase()} UNKNOWNS PRIORITIZATION`);
  console.log("-".repeat(60));
  console.log("Calling API...");
  const body = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3000,
    system: UNKNOWNS_PRIORITIZATION_PROMPT,
    messages: [
      {
        role: "user",
        content: `Baseline:\n${JSON.stringify(baselineData, null, 2)}\n\nAdversarial:\n${JSON.stringify(adversarialData, null, 2)}\n\nReturn top unknowns JSON.`,
      },
    ],
  };
  const text = await anthropic(body);
  const data = extractJSON(text);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

const args = process.argv.slice(2).map((a) => a.toLowerCase());
const runRigor = args.includes("--rigor") || args.includes("rigor");
const runVerifyDec = args.includes("--verify-dec") || args.includes("verify-dec");
const which = args.find((a) => a === "rd" || a === "dec");

(async () => {
  try {
    const runRD = !which || which === "rd";
    const runDec = !which || which === "dec";

    if (!runRigor) {
      if (runRD) await testRD();
      if (runDec) await testDec();
      console.log("\nDone.\n");
      return;
    }

    const baseline = {};
    const adversarial = {};
    const unknowns = {};

    if (runRD) baseline.rd = await testRD();
    if (runDec) baseline.dec = await testDec();

    if (runRD) adversarial.rd = await testRDAdversarial(baseline.rd);
    if (runDec) adversarial.dec = await testDecAdversarial(baseline.dec);

    if (runRD) unknowns.rd = await prioritizeUnknowns("rd", baseline.rd, adversarial.rd);
    if (runDec) unknowns.dec = await prioritizeUnknowns("dec", baseline.dec, adversarial.dec);

    const outDir = writeRigorArtifacts({ baseline, adversarial, unknowns });
    if (runVerifyDec) await writeDecisionVerificationIfRequested(baseline, outDir);
    console.log(`\nRigor artifacts written to: ${outDir}`);
    console.log("\nDone.\n");
  } catch (e) {
    console.error("\nError:", e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  }
})();
