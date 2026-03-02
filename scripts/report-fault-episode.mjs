#!/usr/bin/env node
// scripts/report-fault-episode.mjs

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import {
  loadSimFromEpisodeDir,
  analyzeFaultEpisode,
  renderFaultEpisodeReportMarkdown,
} from "../spine/sim/analyzeFaultEpisode.ts";

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function main() {
  const episodeId = process.argv[2] || "episode_001";

  const outDir = path.join(process.cwd(), "artifacts", "fault-episodes", episodeId);
  const simPath = path.join(outDir, "sim.json");

  if (!fs.existsSync(simPath)) {
    console.error(`❌ missing sim.json: ${simPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(simPath, "utf8");
  const sim = JSON.parse(raw);

  const analysis = analyzeFaultEpisode(sim, raw);
  const md = renderFaultEpisodeReportMarkdown(analysis);

  const reportMdPath = path.join(outDir, "report.md");
  const reportJsonPath = path.join(outDir, "report.json");

  fs.writeFileSync(reportMdPath, md, "utf8");
  fs.writeFileSync(reportJsonPath, JSON.stringify(analysis, null, 2), "utf8");

  const mdHash = sha256File(reportMdPath);

  console.log(`✅ wrote ${path.relative(process.cwd(), reportMdPath)}`);
  console.log(`✅ wrote ${path.relative(process.cwd(), reportJsonPath)}`);
  console.log(`report.md sha256: ${mdHash}`);
  console.log(
    `events: fault=${analysis.faultInjected ? "yes" : "no"}, breach=${analysis.envelopeBreach ? "yes" : "no"}`
  );
}

main();



































