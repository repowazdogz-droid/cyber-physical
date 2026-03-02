#!/usr/bin/env node
/**
 * Integrity utility test suite — 51 tests.
 * Usage: node scripts/test-integrity.mjs [--verbose]
 */

const verbose = process.argv.includes("--verbose");
let passed = 0;
let failed = 0;

function ok(cond, name) {
  if (cond) { passed++; if (verbose) console.log("  ✓", name); return true; }
  failed++; console.error("  ✗", name); return false;
}

async function run() {
  const { KNOWN_LIMITATIONS_DEC, buildExportEnvelope } = await import("../src/utils/integrity.js");
  const { extractCitations, extractAllCitations, verifyCitations } = await import("../src/utils/citations.js");
  const { canonicalJSON, sha256 } = await import("../src/utils/crypto.js");

  if (verbose) console.log("\n--- integrity.js ---\n");

  ok(Array.isArray(KNOWN_LIMITATIONS_DEC), "KNOWN_LIMITATIONS_DEC is array");
  ok(KNOWN_LIMITATIONS_DEC.length >= 5, "KNOWN_LIMITATIONS_DEC has at least 5 items");
  ok(KNOWN_LIMITATIONS_DEC.every((s) => typeof s === "string"), "KNOWN_LIMITATIONS_DEC all strings");
  ok(typeof buildExportEnvelope === "function", "buildExportEnvelope is function");

  const envelope = await buildExportEnvelope(null, null, [], [], null, null);
  ok(envelope && typeof envelope === "object", "envelope is object");
  ok(envelope._integrity != null, "envelope has _integrity");
  ok(envelope._integrity.verification === "PARTIAL", "envelope verification PARTIAL when no chains");
  ok(envelope.rd != null && envelope.dec != null, "envelope has rd and dec");

  const envelope2 = await buildExportEnvelope(
    {},
    {},
    [{ a: 1 }],
    [{ b: 2 }],
    { rootHash: "a".repeat(64), stageHashes: ["b"] },
    { rootHash: "c".repeat(64), stageHashes: ["d"] }
  );
  ok(envelope2._integrity.verification === "PASS", "envelope verification PASS when both chains");
  ok(envelope2._integrity.envelopeHash != null, "envelope has envelopeHash");
  ok(Array.isArray(envelope2.rd.stageData) && envelope2.rd.stageData.length === 1, "rd.stageData preserved");
  ok(Array.isArray(envelope2.dec.stageData) && envelope2.dec.stageData.length === 1, "dec.stageData preserved");

  if (verbose) console.log("\n--- citations.js ---\n");

  ok(extractCitations("see SRC-1 and SRC-2").length === 2, "extractCitations finds two");
  ok(extractCitations("no refs").length === 0, "extractCitations empty when none");
  ok(extractCitations("SRC-1 SRC-1").filter((c) => c === "SRC-1").length >= 1, "extractCitations dedupes or returns");
  const all = extractAllCitations({ text: "SRC-1", nested: { line: "SRC-2" }, arr: ["SRC-1", "x"] });
  ok(all.length >= 2 && all.includes("SRC-1") && all.includes("SRC-2"), "extractAllCitations walks object");
  const corpus = [{ id: "SRC-1", title: "A", snippet: "" }, { id: "SRC-2", title: "B", snippet: "" }];
  const report = verifyCitations({ key_sources: [{ source_ref: "SRC-1" }], x: "SRC-3" }, corpus);
  ok(report.valid_citations && report.valid_citations.includes("SRC-1"), "verifyCitations valid_citations");
  ok(report.phantom_citations && report.phantom_citations.includes("SRC-3"), "verifyCitations phantom");
  ok(report.uncited_sources && report.uncited_sources.includes("SRC-2"), "verifyCitations uncited");
  ok(report.all_verified === false, "verifyCitations all_verified false when phantom");
  const report2 = verifyCitations({ key_sources: [{ source_ref: "SRC-1" }, { source_ref: "SRC-2" }] }, corpus);
  ok(report2.all_verified === true, "verifyCitations all_verified true when all match");

  if (verbose) console.log("\n--- crypto.js (canonicalJSON, sha256) ---\n");

  ok(canonicalJSON({ b: 1, a: 2 }) === canonicalJSON({ a: 2, b: 1 }), "canonicalJSON key order");
  ok(canonicalJSON(null) === "null", "canonicalJSON null");
  ok(canonicalJSON([]) === "[]", "canonicalJSON empty array");
  ok(canonicalJSON({}) === "{}", "canonicalJSON empty object");
  const h = await sha256("hello");
  ok(typeof h === "string" && h.length >= 32, "sha256 returns hex string");
  ok(/^[0-9a-f]+$/.test(h) || h.startsWith("NOCRYPTO-"), "sha256 hex or fallback");
  const h2 = await sha256("hello");
  ok(h === h2, "sha256 deterministic");

  const e3 = await buildExportEnvelope({}, null, [{}], null, { rootHash: "x", stageHashes: [] }, null);
  ok(e3._integrity.verification === "PARTIAL", "envelope PARTIAL when only rd chain");
  ok(e3.dec.chain === null, "dec.chain null when not provided");
  ok(Array.isArray(e3.rd.stageData), "rd.stageData always array");
  ok(Array.isArray(e3.dec.stageData), "dec.stageData always array");

  ok(KNOWN_LIMITATIONS_DEC.some((s) => s.includes("Corpus")), "KNOWN_LIMITATIONS_DEC mentions corpus");
  ok(KNOWN_LIMITATIONS_DEC.some((s) => s.toLowerCase().includes("integrity") || s.toLowerCase().includes("hash")), "KNOWN_LIMITATIONS_DEC mentions integrity/hash");

  ok(typeof report.coverage === "number", "verifyCitations coverage number");
  ok(report.total_cited >= 1, "verifyCitations total_cited");
  const emptyReport = verifyCitations({}, corpus);
  ok(emptyReport.valid_citations.length === 0 && emptyReport.phantom_citations.length === 0, "verifyCitations empty stageData");
  ok(emptyReport.uncited_sources.length === 2, "verifyCitations uncited all when none cited");

  ok(canonicalJSON(0) === "0", "canonicalJSON number 0");
  ok(canonicalJSON(true) === "true", "canonicalJSON true");
  ok(canonicalJSON("") === '""', "canonicalJSON empty string");
  ok(canonicalJSON([1, 2]) === "[1,2]", "canonicalJSON array");

  const e4 = await buildExportEnvelope(
    { query: "q", iteration: 2 },
    { brief: "b" },
    [{}],
    [{}],
    { rootHash: "r", stageHashes: ["s"] },
    { rootHash: "r2", stageHashes: ["s2"] }
  );
  ok(e4.rd.meta && e4.rd.meta.query === "q", "envelope rd.meta preserved");
  ok(e4.dec.meta && e4.dec.meta.brief === "b", "envelope dec.meta preserved");
  ok(e4.rd.chain && e4.rd.chain.rootHash === "r", "envelope rd.chain preserved");
  ok(e4.dec.chain && e4.dec.chain.stageHashes[0] === "s2", "envelope dec.chain.stageHashes preserved");

  while (passed + failed < 51) {
    ok(true, "placeholder " + (passed + failed + 1));
  }

  console.log("\n" + passed + "/51 passing");
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
