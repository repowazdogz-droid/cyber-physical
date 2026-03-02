#!/usr/bin/env node
// scripts/omega-compare.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  console.log(`
omega compare — compare all five Omega modes on the same input

Usage:
  npm run omega compare --text "…" [--audit] [--save] [--max 900]

Options:
  --text "…"    Input prompt to compare
  --file path   Read prompt from file
  --audit       Show detailed audit information
  --save        Save comparison as artifact
  --max N       Max output characters (default: 900)

Examples:
  npm run omega compare --text "Explain quantum entanglement"
  npm run omega compare --text "Write a sales email" --audit --save
  npm run omega compare --file ./prompt.txt --max 1200
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
    else if (a === "--save") args.save = true;
    else args._.push(a);
    i++;
  }
  return args;
}

function getStatusIcon(auditOk, retryAttempted, retryRepaired) {
  if (!auditOk) return "🔴";
  if (retryAttempted && retryRepaired) return "🟡";
  return "🟢";
}

function formatOutput(mode, result, showAudit) {
  const auditOk = result.omegaMeta?.audit?.ok ?? false;
  const retryAttempted = result.omegaMeta?.retry?.attempted ?? false;
  const retryRepaired = result.omegaMeta?.retry?.repaired ?? false;
  const violations = result.omegaMeta?.audit?.violations ?? [];

  const icon = getStatusIcon(auditOk, retryAttempted, retryRepaired);
  const auditStatus = auditOk ? "OK" : `FAIL [${violations.join(", ")}]`;
  const retryStatus = retryAttempted ? (retryRepaired ? "repaired" : "failed") : "no";

  const header = `────────────────────────────────────────
Ω ${mode.padEnd(3)} | ${icon} Audit: ${auditStatus.padEnd(20)} | Retry: ${retryStatus}
────────────────────────────────────────`;

  let output = header + "\n" + result.text.trim() + "\n\n";

  if (showAudit && result.omegaMeta) {
    output += `Audit details:\n`;
    output += `  OK: ${auditOk}\n`;
    if (violations.length > 0) {
      output += `  Violations: ${violations.join(", ")}\n`;
    }
    if (retryAttempted) {
      output += `  Retry attempted: ${retryAttempted}\n`;
      output += `  Retry repaired: ${retryRepaired}\n`;
    }
    output += "\n";
  }

  return output;
}

function generateDiffSummary(outputs) {
  const modes = ["v37", "V", "B", "R", "G"];
  const summaries = [];

  for (let i = 0; i < modes.length; i++) {
    for (let j = i + 1; j < modes.length; j++) {
      const modeA = modes[i];
      const modeB = modes[j];
      const resultA = outputs[modeA];
      const resultB = outputs[modeB];

      const lenA = resultA.text.length;
      const lenB = resultB.text.length;
      const lenDiff = lenB - lenA;
      const lenPercent = lenA > 0 ? ((lenDiff / lenA) * 100).toFixed(0) : "0";

      const violationsA = resultA.omegaMeta?.audit?.violations?.length ?? 0;
      const violationsB = resultB.omegaMeta?.audit?.violations?.length ?? 0;

      const parts = [];

      if (lenDiff > 0) {
        parts.push(`+${lenPercent}% length`);
      } else if (lenDiff < 0) {
        parts.push(`${lenPercent}% length`);
      }

      if (violationsA === 0 && violationsB > 0) {
        parts.push(`violations introduced`);
      } else if (violationsA > 0 && violationsB === 0) {
        parts.push(`violations removed`);
      }

      if (parts.length > 0) {
        summaries.push(`${modeA} → ${modeB}: ${parts.join(", ")}`);
      }
    }
  }

  return summaries;
}

const argv = process.argv.slice(2);
const args = parseArgs(argv);

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

const repoRoot = path.resolve(__dirname, "..");

try {
  // Use tsx-compatible import path
  const comparePath = path.join(repoRoot, "spine", "llm", "modes", "OmegaCompare.ts");
  const { compareOmegaModes } = await import(`file://${comparePath}`);

  console.log("Running comparison across all five Omega modes...\n");

  const comparison = await compareOmegaModes(
    prompt,
    Number.isFinite(args.max) ? args.max : 900
  );

  // Display all outputs
  const modes = ["v37", "V", "B", "R", "G"];
  for (const mode of modes) {
    const result = comparison.outputs[mode];
    process.stdout.write(formatOutput(mode, result, args.audit));
  }

  // Diff summary
  console.log("────────────────────────────────────────");
  console.log("DIFF SUMMARY");
  console.log("────────────────────────────────────────");
  const summaries = generateDiffSummary(comparison.outputs);
  if (summaries.length > 0) {
    summaries.forEach((s) => console.log(s));
  } else {
    console.log("Minimal differences detected");
  }
  console.log("");

  // Review posture
  console.log("────────────────────────────────────────");
  console.log("REVIEW POSTURE");
  console.log("────────────────────────────────────────");
  console.log("This comparison is for human judgment.");
  console.log("No conclusions are made automatically.");
  console.log("");
  console.log("Humans remain sovereign.");
  console.log("");

  // Save artifact if requested
  if (args.save) {
    try {
      const { putArtifact } = await import(
        `file://${path.join(repoRoot, "spine", "artifacts", "ArtifactVault.ts")}`
      );
      const { ArtifactKind } = await import(
        `file://${path.join(repoRoot, "spine", "artifacts", "ArtifactTypes.ts")}`
      );

      const payload = {
        meta: { contractVersion: "1.0.0" },
        inputHash: comparison.inputHash,
        inputText: prompt.length > 500 ? prompt.slice(0, 500) + "…" : prompt,
        outputs: Object.fromEntries(
          Object.entries(comparison.outputs).map(([mode, result]) => [
            mode,
            {
              text: result.text.length > 2000 ? result.text.slice(0, 2000) + "…" : result.text,
              omegaMeta: result.omegaMeta,
            },
          ])
        ),
        createdAtIso: comparison.createdAtIso,
      };

      await putArtifact(ArtifactKind.OMEGA_COMPARE, payload, {
        learnerId: "public",
      });

      console.log("✅ Comparison saved as artifact");
    } catch (error) {
      console.error(`⚠️  Failed to save artifact: ${error.message}`);
    }
  }
} catch (error) {
  console.error(`Failed to run comparison: ${error.message}`);
  console.error(`\nNote: This script requires TypeScript support.`);
  console.error(`Try using tsx: npx tsx scripts/omega-compare.mjs ${argv.join(" ")}`);
  process.exit(1);
}

