#!/usr/bin/env node
// scripts/omega.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  console.log(`
omega — run Omega modes locally

Usage:
  node scripts/omega.mjs <mode> [--text "…"] [--file path] [--max 900] [--audit]
Modes:
  v37 | V | B | R | G

Examples:
  node scripts/omega.mjs v37 --text "Decompose this claim..."
  node scripts/omega.mjs G --file ./prompt.txt --audit
  node scripts/omega.mjs V --text "Landing page hero variants" --max 1200
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === "--text") args.text = argv[++i];
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--max") args.max = Number(argv[++i]);
    else if (a === "--audit") args.audit = true;
    else args._.push(a);
    i++;
  }
  return args;
}

const argv = process.argv.slice(2);
const args = parseArgs(argv);

const mode = args._[0];
if (!mode || !["v37", "V", "B", "R", "G"].includes(mode)) {
  usage();
  process.exit(1);
}

let prompt = args.text;
if (!prompt && args.file) {
  const p = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(p)) {
    console.error(`File not found: ${p}`);
    process.exit(1);
  }
  prompt = fs.readFileSync(p, "utf8").trim();
}
if (!prompt) {
  console.error("Missing --text or --file");
  usage();
  process.exit(1);
}

// Import from the built TypeScript (or use tsx/ts-node in dev)
// For now, we'll use dynamic import with a relative path
// Note: This assumes the script is run from repo root
const repoRoot = path.resolve(__dirname, "..");
const routerPath = path.join(repoRoot, "spine", "llm", "LLMRouter.ts");

try {
  // Use dynamic import - in a real setup you might need tsx or ts-node
  // For now, we'll assume the code is transpiled or we use a runtime that supports TS
  const { generateText } = await import(`file://${routerPath}`);

  const result = await generateText({
    user: prompt,
    maxOutputChars: Number.isFinite(args.max) ? args.max : 900,
    omega: { mode, retryOnAuditFailure: true },
  });

  if (!result.ok || !result.text) {
    console.error(`Error: ${result.error || "Unknown error"}`);
    process.exit(1);
  }

  process.stdout.write(result.text.trim() + "\n");

  if (args.audit) {
    const audit = result.omegaAudit ?? null;
    const retry = result.omegaRetry ?? null;
    process.stdout.write(
      "\n---\nOMEGA AUDIT:\n" + JSON.stringify(audit, null, 2) + "\n"
    );
    if (retry) {
      process.stdout.write(
        "\nOMEGA RETRY:\n" + JSON.stringify(retry, null, 2) + "\n"
      );
    }
  }
} catch (error) {
  console.error(`Failed to import LLMRouter: ${error.message}`);
  console.error(`\nNote: This script requires TypeScript support.`);
  console.error(`Try using tsx: npx tsx scripts/omega.mjs ${argv.join(" ")}`);
  process.exit(1);
}




































