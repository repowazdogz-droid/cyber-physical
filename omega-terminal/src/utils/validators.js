/**
 * OMEGA Trust Terminal — R&D Engine validators, JSON repair, parse
 */

const VALID_METHODS = ["constraint_flip", "dimensional_shift", "inversion", "collision", "absence"];

export function validateHypothesis(h, idx) {
  const e = [];
  if (!h.id) e.push("H[" + idx + "] missing id");
  if (!h.statement) e.push((h.id || "H" + idx) + " missing statement");
  if (!VALID_METHODS.includes(h.generation_method)) e.push((h.id || "H" + idx) + " invalid method");
  if (typeof h.testable !== "boolean") e.push((h.id || "H" + idx) + " testable must be boolean");
  if (!h.falsification) e.push((h.id || "H" + idx) + " missing falsification");
  return { valid: e.length === 0, errors: e };
}

export function validateExperiment(exp, idx) {
  const e = [];
  if (!exp.id) e.push("E[" + idx + "] missing id");
  if (!exp.tests_hypothesis) e.push((exp.id || "E" + idx) + " missing tests_hypothesis");
  if (!exp.title) e.push((exp.id || "E" + idx) + " missing title");
  if (!exp.method) e.push((exp.id || "E" + idx) + " missing method");
  if (!exp.success_metric) e.push((exp.id || "E" + idx) + " missing success_metric");
  return { valid: e.length === 0, errors: e };
}

export const REQUIRED_FIELDS_RD = {
  problem: ["title", "problem_statement", "domain", "bottleneck", "success_criteria"],
  literature: ["known_and_settled", "key_papers", "state_of_art"],
  hypotheses: ["hypotheses", "strongest_hypothesis"],
  experimental: ["experiments", "sequence", "kill_signals"],
  validation: ["validation_framework", "governance", "timeline", "executive_summary", "one_sentence"],
};

export const STRICT_VALIDATORS_RD = {
  problem(d) {
    const e = [];
    if (!d.title) e.push("missing title");
    if (!d.problem_statement) e.push("missing problem_statement");
    if (!d.domain) e.push("missing domain");
    if (!d.bottleneck) e.push("missing bottleneck");
    if (!d.success_criteria) e.push("missing success_criteria");
    return { valid: e.length === 0, errors: e };
  },
  literature(d) {
    const e = [];
    if (!Array.isArray(d.known_and_settled) || !d.known_and_settled.length) e.push("missing known_and_settled");
    if (!Array.isArray(d.key_papers) || !d.key_papers.length) e.push("missing key_papers");
    if (!d.state_of_art) e.push("missing state_of_art");
    if (Array.isArray(d.key_papers))
      d.key_papers.forEach((p, i) => {
        if (!p.title) e.push("paper[" + i + "] missing title");
        if (!p.finding) e.push("paper[" + i + "] missing finding");
      });
    return { valid: e.length === 0, errors: e };
  },
  hypotheses(d) {
    const e = [];
    if (!Array.isArray(d.hypotheses) || !d.hypotheses.length) e.push("no hypotheses");
    if (!d.strongest_hypothesis) e.push("missing strongest_hypothesis");
    if (Array.isArray(d.hypotheses)) {
      d.hypotheses.forEach((h, i) => {
        const v = validateHypothesis(h, i);
        if (!v.valid) v.errors.forEach((err) => e.push(err));
      });
      const methods = {};
      d.hypotheses.forEach((h) => { if (h.generation_method) methods[h.generation_method] = true; });
      const miss = VALID_METHODS.filter((m) => !methods[m]);
      if (miss.length) e.push("missing methods: " + miss.join(", "));
    }
    return { valid: e.length === 0, errors: e };
  },
  experimental(d) {
    const e = [];
    if (!Array.isArray(d.experiments) || !d.experiments.length) e.push("no experiments");
    if (!d.sequence) e.push("missing sequence");
    if (!Array.isArray(d.kill_signals) || !d.kill_signals.length) e.push("no kill signals");
    if (Array.isArray(d.experiments))
      d.experiments.forEach((exp, i) => {
        const v = validateExperiment(exp, i);
        if (!v.valid) v.errors.forEach((err) => e.push(err));
      });
    return { valid: e.length === 0, errors: e };
  },
  validation(d) {
    const e = [];
    if (!d.validation_framework) e.push("missing validation_framework");
    if (!d.governance) e.push("missing governance");
    if (!d.timeline) e.push("missing timeline");
    if (!d.executive_summary) e.push("missing executive_summary");
    if (!d.one_sentence) e.push("missing one_sentence");
    if (d.governance) {
      if (!Array.isArray(d.governance.decision_gates) || !d.governance.decision_gates.length) e.push("no decision_gates");
      if (!Array.isArray(d.governance.halt_triggers) || !d.governance.halt_triggers.length) e.push("no halt_triggers");
      if (!d.governance.abandonment_threshold) e.push("missing abandonment_threshold");
    }
    return { valid: e.length === 0, errors: e };
  },
};

export function validateSchemaRD(stageId, data) {
  const required = REQUIRED_FIELDS_RD[stageId] || [];
  if (!data || typeof data !== "object") return { valid: false, missing: required, total: required.length, present: 0 };
  const missing = required.filter((f) => !(f in data));
  return { valid: missing.length === 0, missing, total: required.length, present: required.length - missing.length };
}

export function repairJSON(text, requiredFields) {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}
  try { return JSON.parse(cleaned.replace(/,(\s*[}\]])/g, "$1")); } catch (e) {}
  const blocks = [];
  let depth = 0, start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") { if (depth === 0) start = i; depth++; }
    else if (cleaned[i] === "}") { depth--; if (depth === 0 && start >= 0) { blocks.push(cleaned.substring(start, i + 1)); start = -1; } }
  }
  const cands = [];
  for (const block of blocks) {
    let p = null;
    try { p = JSON.parse(block); } catch (e) {}
    if (!p) try { p = JSON.parse(block.replace(/,(\s*[}\]])/g, "$1")); } catch (e) {}
    if (p && typeof p === "object" && !Array.isArray(p)) cands.push(p);
  }
  if (!cands.length) return null;
  if (cands.length === 1) return cands[0];
  if (requiredFields?.length) {
    let best = cands[0], bs = 0;
    for (const c of cands) {
      const s = requiredFields.filter((f) => f in c).length;
      if (s > bs) { bs = s; best = c; }
    }
    return best;
  }
  return cands.sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0];
}

export function parseLLMResponse(text, stageId, requiredFieldsMap = REQUIRED_FIELDS_RD) {
  if (!text?.trim()) return { ok: false, kind: "empty", data: null, raw: text };
  const required = requiredFieldsMap[stageId] || [];
  const parsed = repairJSON(text, required);
  if (!parsed) return { ok: false, kind: "unparseable", data: null, raw: text };
  return { ok: true, kind: "json", data: parsed, raw: text };
}

// — Decision Engine v6 validators —
export const REQUIRED_FIELDS_DEC = {
  strategic_assessment: ["governing_tension", "failure_pathway", "state_of_art", "key_sources"],
  options_analysis: ["options", "recommended_option", "comparison_criteria"],
  risk_governance: ["kill_criteria", "structural_tests", "governance_gates"],
  board_brief: ["the_sentence", "authorization_statement", "conditions", "prohibitions", "decision_posture"],
};

export const STRICT_VALIDATORS_DEC = {
  strategic_assessment(d) {
    const e = [];
    if (!d.governing_tension) e.push("missing governing_tension");
    if (!d.failure_pathway) e.push("missing failure_pathway");
    if (!d.state_of_art) e.push("missing state_of_art");
    if (!Array.isArray(d.key_sources) || !d.key_sources.length) e.push("missing key_sources");
    return { valid: e.length === 0, errors: e };
  },
  options_analysis(d) {
    const e = [];
    if (!Array.isArray(d.options) || !d.options.length) e.push("no options");
    if (!d.recommended_option) e.push("missing recommended_option");
    return { valid: e.length === 0, errors: e };
  },
  risk_governance(d) {
    const e = [];
    if (!Array.isArray(d.kill_criteria) || !d.kill_criteria.length) e.push("no kill_criteria");
    if (!Array.isArray(d.structural_tests) || !d.structural_tests.length) e.push("no structural_tests");
    if (!d.governance_gates) e.push("missing governance_gates");
    return { valid: e.length === 0, errors: e };
  },
  board_brief(d) {
    const e = [];
    if (!d.the_sentence) e.push("missing the_sentence");
    if (!d.authorization_statement) e.push("missing authorization_statement");
    if (!d.decision_posture) e.push("missing decision_posture");
    return { valid: e.length === 0, errors: e };
  },
};

export function validateSchemaDEC(stageId, data) {
  const required = REQUIRED_FIELDS_DEC[stageId] || [];
  if (!data || typeof data !== "object") return { valid: false, missing: required, total: required.length, present: 0 };
  const missing = required.filter((f) => !(f in data));
  return { valid: missing.length === 0, missing, total: required.length, present: required.length - missing.length };
}
