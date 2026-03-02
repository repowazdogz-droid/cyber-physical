#!/usr/bin/env node
// scripts/replay-fault-episode.mjs

import path from "node:path";
import { verifySimJson } from "../spine/sim/verifyFaultEpisode.ts";

async function main() {
  const episodeId = process.argv[2] || "episode_001";
  const base = path.join(process.cwd(), "artifacts", "fault-episodes", episodeId);

  const simPath = path.join(base, "sim.json");
  const shaPath = path.join(base, "sim.sha256");

  const res = await verifySimJson(simPath, shaPath);
  if (!res.ok) {
    console.error("❌ replay failed: hash mismatch");
    console.error("expected:", res.expected);
    console.error("actual:  ", res.actual);
    process.exit(1);
  }

  console.log("✅ replay verified");
  console.log("hash:", res.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



































