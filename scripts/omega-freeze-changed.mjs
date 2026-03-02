#!/usr/bin/env node
// scripts/omega-freeze-changed.mjs

import { execSync } from "node:child_process";

const FROZEN = [
  "spine/llm/modes/OmegaModes.ts",
  "spine/llm/modes/OmegaLenses.ts",
  "spine/llm/modes/OmegaAudit.ts",
  "spine/llm/modes/OmegaTighten.ts",
  "spine/llm/modes/OmegaGShape.ts",
  "spine/llm/LLMRouter.ts",
  "spine/OMEGA_FREEZE_LINE.md",
  "spine/OMEGA_CAPABILITY_LEDGER.md",
];

function git(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

// Default base: origin/main…HEAD (works in CI), fallback to HEAD~1…HEAD (local)
const base = process.env.OMEGA_BASE_REF || "origin/main";
let diff;
try {
  diff = git(`git diff --name-only ${base}...HEAD`);
} catch {
  diff = git(`git diff --name-only HEAD~1...HEAD`);
}

const changed = diff.split("\n").filter(Boolean);
const hit = changed.filter((f) => FROZEN.includes(f));

if (hit.length) {
  console.log("OMEGA_FROZEN_CHANGED=1");
  console.log("Frozen core changed:");
  for (const f of hit) console.log(`- ${f}`);
  process.exit(0);
}

console.log("OMEGA_FROZEN_CHANGED=0");
process.exit(0);




































