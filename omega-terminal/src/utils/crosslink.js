/**
 * OMEGA Trust Terminal — Cross-Engine Linking v1.0
 *
 * Formats one engine's completed outputs as structured context
 * for the other engine's system/user prompts. Enables:
 *
 *   R&D → Decision:  "Here's what we found. Now decide."
 *   Decision → R&D:   "Here are the constraints. Now design experiments."
 *   Loop:             R&D → Decision → refined R&D → refined Decision
 *
 * The key insight: instead of the downstream engine inventing context
 * from a brief, it receives the upstream engine's validated, hashed,
 * schema-checked output as ground truth.
 */

// ─── R&D → Decision Context ────────────────────────────────────────

/**
 * Format R&D engine outputs as structured context for Decision engine prompts.
 *
 * @param {Array} rdStageData - Array of 5 stage data objects [problem, literature, hypotheses, experimental, validation]
 * @returns {string} Formatted context block to inject into Decision engine user prompts
 */
export function rdToDecisionContext(rdStageData) {
  if (!rdStageData || rdStageData.length < 5) return "";

  const [problem, literature, hypotheses, experimental, validation] = rdStageData;

  const sections = [];

  sections.push("=== R&D ENGINE OUTPUTS (VERIFIED) ===");
  sections.push("These outputs are from a completed, hash-verified R&D pipeline. Use them as grounded evidence, not as claims to re-evaluate.");
  sections.push("");

  // Problem
  if (problem?.title) {
    sections.push("── RESEARCH PROBLEM ──");
    sections.push("Title: " + problem.title);
    if (problem.bottleneck) sections.push("Bottleneck: " + problem.bottleneck);
    if (problem.success_criteria) sections.push("Success criteria: " + problem.success_criteria);
    if (problem.domain) sections.push("Domain: " + problem.domain);
    sections.push("");
  }

  // Literature — key gaps
  if (literature) {
    sections.push("── LITERATURE FINDINGS ──");
    if (literature.absence_detected) sections.push("ABSENCE: " + literature.absence_detected);
    if (literature.state_of_art) sections.push("State of art: " + literature.state_of_art);
    const frontier = literature.unknown_and_not_yet_articulable || [];
    if (frontier.length > 0) {
      sections.push("Frontier unknowns (" + frontier.length + "):");
      frontier.forEach((f, i) => sections.push("  " + (i + 1) + ". " + f));
    }
    sections.push("");
  }

  // Hypotheses — strongest + method coverage
  if (hypotheses) {
    const hyps = hypotheses.hypotheses || [];
    sections.push("── HYPOTHESES (" + hyps.length + ") ──");
    if (hypotheses.strongest_hypothesis) sections.push("Strongest: " + hypotheses.strongest_hypothesis);
    if (hypotheses.most_novel_hypothesis) sections.push("Most novel: " + hypotheses.most_novel_hypothesis);
    hyps.forEach((h) => {
      sections.push("  " + (h.id || "H?") + " [" + (h.generation_method || "unknown") + "] " + (h.confidence || "") + ": " + (h.statement || ""));
    });
    sections.push("");
  }

  // Experimental — summary + kill signals
  if (experimental) {
    sections.push("── EXPERIMENTAL DESIGN ──");
    const summary = experimental.summary || {};
    if (summary.total_experiments) sections.push("Experiments: " + summary.total_experiments);
    if (summary.shortest_path_weeks) sections.push("Shortest path: " + summary.shortest_path_weeks + " weeks");
    if (summary.estimated_total_cost) sections.push("Estimated cost: " + summary.estimated_total_cost);
    if (experimental.sequence) sections.push("Sequence: " + experimental.sequence);

    const kills = experimental.kill_signals || [];
    if (kills.length > 0) {
      sections.push("Kill signals (" + kills.length + "):");
      kills.forEach((k) => {
        const sig = typeof k === "object" ? k.signal : k;
        const thresh = typeof k === "object" ? k.threshold : "";
        sections.push("  ⊘ " + sig + (thresh ? " [threshold: " + thresh + "]" : ""));
      });
    }
    sections.push("");
  }

  // Validation — governance + budget + the sentence
  if (validation) {
    sections.push("── VALIDATION & GOVERNANCE ──");
    const gov = validation.governance || {};
    const gates = gov.decision_gates || [];
    if (gates.length > 0) {
      sections.push("Decision gates (" + gates.length + "):");
      gates.forEach((g) => {
        sections.push("  " + (typeof g === "object" ? g.gate + ": " + g.criteria : g));
      });
    }
    const halts = gov.halt_triggers || [];
    if (halts.length > 0) {
      sections.push("Halt triggers: " + halts.join("; "));
    }
    if (gov.abandonment_threshold) sections.push("Abandonment: " + gov.abandonment_threshold);

    const res = validation.resource_requirements || {};
    if (res.budget) sections.push("Budget: " + res.budget);

    const tl = validation.timeline || {};
    if (Object.keys(tl).length > 0) {
      sections.push("Timeline:");
      Object.entries(tl).forEach(([phase, info]) => {
        if (typeof info === "object") {
          sections.push("  " + phase + ": " + (info.duration || "") + " — " + (info.deliverable || ""));
        } else {
          sections.push("  " + phase + ": " + info);
        }
      });
    }

    if (validation.one_sentence) sections.push("\nTHE SENTENCE: " + validation.one_sentence);
    sections.push("");
  }

  sections.push("=== END R&D ENGINE OUTPUTS ===");

  return sections.join("\n");
}

// ─── Decision → R&D Context ────────────────────────────────────────

/**
 * Format Decision engine outputs as constraints for R&D engine prompts.
 *
 * @param {Array} decStageData - Array of 4 stage data objects [strategic_assessment, options_analysis, risk_governance, board_brief]
 * @returns {string} Formatted constraint block to inject into R&D engine user prompts
 */
export function decisionToRDContext(decStageData) {
  if (!decStageData || decStageData.length < 4) return "";

  const [assessment, options, risk, brief] = decStageData;

  const sections = [];

  sections.push("=== DECISION ENGINE CONSTRAINTS (BINDING) ===");
  sections.push("These are board-level constraints from a completed decision pipeline. R&D designs MUST satisfy these constraints or explicitly flag non-compliance.");
  sections.push("");

  // Strategic framing
  if (assessment) {
    sections.push("── STRATEGIC CONTEXT ──");
    if (assessment.governing_tension) sections.push("Governing tension: " + assessment.governing_tension);
    if (assessment.failure_pathway) sections.push("Failure pathway to avoid: " + assessment.failure_pathway);
    sections.push("");
  }

  // Recommended option
  if (options) {
    const rec = options.recommended_option;
    if (rec) {
      sections.push("── APPROVED OPTION ──");
      if (typeof rec === "object") {
        sections.push("Option: " + (rec.id || "") + " — " + (rec.rationale || ""));
      } else {
        sections.push("Option: " + rec);
      }
      const opts = options.options || [];
      const recOpt = opts.find((o) => o.id === (rec.id || rec));
      if (recOpt) {
        if (recOpt.title) sections.push("Title: " + recOpt.title);
        if (recOpt.summary) sections.push("Summary: " + recOpt.summary);
      }
    }
    sections.push("");
  }

  // Hard constraints from risk/governance
  if (risk) {
    const kills = risk.kill_criteria || [];
    if (kills.length > 0) {
      sections.push("── KILL CRITERIA (HARD CONSTRAINTS) ──");
      sections.push("Experiments must be designed to test these. If any kill criterion is triggered, the programme halts.");
      kills.forEach((k) => {
        const crit = typeof k === "object" ? (k.criterion || k.criteria) : k;
        const thresh = typeof k === "object" ? k.threshold : "";
        sections.push("  ⊘ " + crit + (thresh ? " [threshold: " + thresh + "]" : ""));
      });
      sections.push("");
    }

    const gov = risk.governance_gates || {};
    const gates = gov.decision_gates || [];
    if (gates.length > 0) {
      sections.push("── GOVERNANCE GATES ──");
      sections.push("R&D phases must align with these gates. Each gate must have a clear pass/fail test.");
      gates.forEach((g) => {
        sections.push("  " + (typeof g === "object" ? g.gate + ": " + g.criteria : g));
      });
      sections.push("");
    }

    const halts = gov.halt_triggers || [];
    if (halts.length > 0) {
      sections.push("Halt triggers: " + halts.join("; "));
      sections.push("");
    }
  }

  // Board conditions and prohibitions
  if (brief) {
    if (brief.conditions?.length > 0) {
      sections.push("── BOARD CONDITIONS ──");
      brief.conditions.forEach((c) => sections.push("  ◆ " + c));
      sections.push("");
    }
    if (brief.prohibitions?.length > 0) {
      sections.push("── PROHIBITIONS ──");
      brief.prohibitions.forEach((p) => sections.push("  ⊘ " + p));
      sections.push("");
    }
    if (brief.the_sentence) sections.push("BOARD SENTENCE: " + brief.the_sentence);
    sections.push("");
  }

  sections.push("=== END DECISION ENGINE CONSTRAINTS ===");

  return sections.join("\n");
}

// ─── Link Mode Enum ────────────────────────────────────────────────

export const LINK_MODES = {
  NONE: "none",
  RD_TO_DEC: "rd_to_dec",
  DEC_TO_RD: "dec_to_rd",
};

/**
 * Get the appropriate context string for a linked engine run.
 *
 * @param {string} linkMode - One of LINK_MODES
 * @param {string} targetEngine - "rd" or "dec"
 * @param {{ rdStageData?: Array, decStageData?: Array }} engineOutputs
 * @returns {string} Context to inject, or empty string
 */
export function getLinkContext(linkMode, targetEngine, engineOutputs) {
  if (linkMode === LINK_MODES.NONE) return "";

  if (linkMode === LINK_MODES.RD_TO_DEC && targetEngine === "dec") {
    return rdToDecisionContext(engineOutputs.rdStageData);
  }

  if (linkMode === LINK_MODES.DEC_TO_RD && targetEngine === "rd") {
    return decisionToRDContext(engineOutputs.decStageData);
  }

  return "";
}
