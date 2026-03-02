#!/usr/bin/env node
// scripts/run-fault-episode.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for TypeScript files
const { runEpisode } = await import("../spine/sim/runFaultEpisode.ts");
const { EPISODE_001 } = await import("../spine/sim/episodes/episode_001.ts");

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function main() {
  const sim = await runEpisode(EPISODE_001);

  const outDir = path.join(process.cwd(), "artifacts", "fault-episodes", sim.meta.episodeId);
  await mkdir(outDir, { recursive: true });

  const json = JSON.stringify(sim, null, 2);
  await writeFile(path.join(outDir, "sim.json"), json, "utf8");
  await writeFile(path.join(outDir, "sim.sha256"), sha256(json) + "\n", "utf8");

  console.log(`✅ wrote ${outDir}/sim.json`);
  console.log(`breachIndex=${sim.breachIndex}, breachTime=${sim.t[sim.breachIndex].toFixed(2)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



































