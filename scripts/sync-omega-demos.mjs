import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "omega-demos");
const DEST = path.join(ROOT, "public", "omega");

const SKIP_FILES = new Set([
  "test-scenarios.html",
  "run-scenario-tests.mjs",
]);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function syncDir(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (SKIP_FILES.has(entry.name)) continue;
    if (entry.isDirectory()) {
      await syncDir(srcPath, destPath);
    } else if (entry.isFile()) {
      // Special-case treaty-runtime: some versions contain multiple concatenated HTML
      // documents (dark + light theme). For the Next.js app we only want a single,
      // stable, light-theme document consistent with the other demos.
      if (entry.name === "treaty-runtime.html") {
        try {
          const raw = await fs.readFile(srcPath, "utf8");
          const marker = "<!DOCTYPE html>";
          const first = raw.indexOf(marker);
          const second = first >= 0 ? raw.indexOf(marker, first + marker.length) : -1;
          let toWrite = raw;
          if (second > -1) {
            // Keep the second document (light theme), drop the first.
            toWrite = raw.slice(second);
          }
          // Normalize palette to match factory/defence/mev light theme.
          toWrite = toWrite.replace(
            /::root\s*\{[^}]*\}/,
            [
              ":root {",
              "  --bg: #fafafa;",
              "  --surface: #f4f4f6;",
              "  --raised: #ecedef;",
              "  --hover: #e4e5e8;",
              "  --border: #d5d7dc;",
              "  --border-hi: #b8bbc2;",
              "  --t1: #111214;",
              "  --t2: #363940;",
              "  --t3: #5c5f69;",
              "  --green: #059669;",
              "  --amber: #d97706;",
              "  --red: #dc2626;",
              "  --blue: #2563eb;",
              "  --hash-color: var(--blue);",
              "  --mono: 'SF Mono','Cascadia Code','Fira Code','Consolas',monospace;",
              "  --sans: -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;",
              "}",
            ].join("\n")
          );
          await fs.writeFile(destPath, toWrite, "utf8");
        } catch (err) {
          // If anything goes wrong, fall back to a direct copy so we never break dev.
          await fs.copyFile(srcPath, destPath);
        }
      } else if (entry.name === "research-governance.html") {
        // Normalize Research Governance to the same light trust-layer palette as other demos.
        try {
          const raw = await fs.readFile(srcPath, "utf8");
          const toWrite = raw.replace(
            /::root\s*\{[^}]*\}/,
            [
              ":root {",
              "  --bg: #fafafa;",
              "  --surface: #f4f4f6;",
              "  --raised: #ecedef;",
              "  --hover: #e4e5e8;",
              "  --border: #d5d7dc;",
              "  --border-hi: #b8bbc2;",
              "  --t1: #111214;",
              "  --t2: #363940;",
              "  --t3: #5c5f69;",
              "  --green: #059669;",
              "  --green-d: #166534;",
              "  --green-g: rgba(5,150,105,0.08);",
              "  --amber: #d97706;",
              "  --amber-d: #92400e;",
              "  --amber-g: rgba(217,119,6,0.08);",
              "  --red: #dc2626;",
              "  --red-d: #991b1b;",
              "  --red-g: rgba(220,38,38,0.08);",
              "  --blue: #2563eb;",
              "  --blue-g: rgba(37,99,235,0.06);",
              "  --purple: #7c3aed;",
              "  --purple-g: rgba(124,58,237,0.08);",
              "  --mono: 'SF Mono','Cascadia Code','Fira Code','Consolas',monospace;",
              "  --sans: -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;",
              "}",
            ].join("\n")
          );
          await fs.writeFile(destPath, toWrite, "utf8");
        } catch (err) {
          await fs.copyFile(srcPath, destPath);
        }
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

async function main() {
  try {
    await syncDir(SRC, DEST);
    // eslint-disable-next-line no-console
    console.log("[sync-omega-demos] Synced omega-demos/ -> public/omega/");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[sync-omega-demos] Failed:", err);
    process.exitCode = 1;
  }
}

main();

