#!/usr/bin/env node
/**
 * CLI test: validates that deterministic data passes through
 * the same code paths as the rendering pipeline.
 * No browser needed. No localhost needed.
 */

import { deterministicRD, deterministicDEC } from "../src/utils/deterministic.js";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log("  ✓", label);
  } else {
    failed++;
    console.log("  ✗", label);
  }
}

function assertNoThrow(fn, label) {
  try {
    fn();
    passed++;
    console.log("  ✓", label);
  } catch (e) {
    failed++;
    console.log("  ✗", label, "—", e.message);
  }
}

console.log("\n── R&D Hypothesis Rendering Checks ──\n");

const rd = deterministicRD("test query");
const hypStage = rd[2];

assert(hypStage.id === "hypotheses", "Stage ID is hypotheses");
assert(hypStage.data != null, "Data is not null");

// methods_summary
assertNoThrow(() => {
  const methods = hypStage.data.methods_summary;
  if (methods == null || typeof methods !== "object" || Array.isArray(methods)) {
    throw new Error("methods_summary is not a plain object");
  }
  const entries = Object.entries(methods);
  assert(entries.length >= 5, "methods_summary has 5+ entries (" + entries.length + ")");
  entries.forEach(([m, count]) => {
    assert(typeof m === "string", "method key is string: " + m);
    assert(typeof count === "number", "method count is number: " + count);
  });
}, "methods_summary safe to iterate");

// hypotheses array
assertNoThrow(() => {
  const hyps = hypStage.data.hypotheses;
  assert(Array.isArray(hyps), "hypotheses is array");
  assert(hyps.length >= 5, "hypotheses has 5+ items (" + hyps.length + ")");

  hyps.forEach((h, i) => {
    assert(h != null && typeof h === "object", "H" + (i + 1) + " is object");
    assert(typeof h.id === "string", "H" + (i + 1) + " has string id: " + h.id);
    assert(typeof h.statement === "string", "H" + (i + 1) + " has string statement");
    assert(typeof h.generation_method === "string", "H" + (i + 1) + " has string generation_method: " + h.generation_method);

    const KNOWN_METHODS = ["constraint_flip", "dimensional_shift", "inversion", "collision", "absence"];
    assert(KNOWN_METHODS.includes(h.generation_method), "H" + (i + 1) + " method is known: " + h.generation_method);

    if (h.confidence != null) {
      assert(typeof h.confidence === "string", "H" + (i + 1) + " confidence is string: " + typeof h.confidence);
      assertNoThrow(() => h.confidence.toUpperCase(), "H" + (i + 1) + " confidence.toUpperCase() works");
    }
  });
}, "hypotheses array safe to iterate and render");

// HYPO_STYLES lookup simulation
assertNoThrow(() => {
  const HYPO_STYLES = {
    constraint_flip: { color: "#a78bfa", label: "CONSTRAINT FLIP", bg: "rgba(167,139,250,0.07)" },
    dimensional_shift: { color: "#5fa8ff", label: "DIMENSIONAL SHIFT", bg: "rgba(95,168,255,0.07)" },
    inversion: { color: "#ff6b6b", label: "INVERSION", bg: "rgba(255,107,107,0.07)" },
    collision: { color: "#ffb347", label: "COLLISION", bg: "rgba(255,179,71,0.07)" },
    absence: { color: "#5cffc8", label: "ABSENCE DETECTOR", bg: "rgba(92,255,200,0.07)" },
  };

  hypStage.data.hypotheses.forEach((h) => {
    const style = HYPO_STYLES[h.generation_method];
    assert(style != null, "HYPO_STYLES[" + h.generation_method + "] exists");
    assert(typeof style.color === "string", "style.color is string");
    assert(typeof style.label === "string", "style.label is string");
    assert(typeof style.bg === "string", "style.bg is string");
  });
}, "HYPO_STYLES lookup works for all hypotheses");

console.log("\n── Decision Engine Rendering Checks ──\n");

const dec = deterministicDEC("test brief");

dec.forEach((stage) => {
  assertNoThrow(() => {
    assert(stage.data != null, stage.id + " data is not null");
    JSON.stringify(stage.data);
  }, stage.id + " data is serializable");
});

// Board brief specific
const bb = dec[3];
assertNoThrow(() => {
  assert(typeof bb.data.decision_posture === "string", "decision_posture is string");
  assert(typeof bb.data.the_sentence === "string", "the_sentence is string");
  assert(Array.isArray(bb.data.conditions), "conditions is array");
  assert(Array.isArray(bb.data.prohibitions), "prohibitions is array");
  const posture = bb.data.decision_posture.replace(/\s+/g, "");
  const POSTURE_COLORS = { Proceed: "#5cffc8", Conditions: "#ffb347", Defer: "#5fa8ff", DNP: "#ff6b6b" };
  const color = POSTURE_COLORS[posture];
  assert(color != null, "posture '" + posture + "' has a color");
}, "board_brief rendering safe");

console.log("\n" + "━".repeat(40));
console.log("Results: " + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
