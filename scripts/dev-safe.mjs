import { spawn, execFileSync } from "node:child_process";

function banner(title) {
  console.log("\n====================");
  console.log(title);
  console.log("====================\n");
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts,
    });
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`[${cmd} ${args.join(" ")}] failed with exit code ${code}`))
    );
  });
}

function runLong(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
}

// NEW: best-effort runner (never rejects)
async function runSoft(cmd, args, opts = {}) {
  try {
    await run(cmd, args, opts);
  } catch (e) {
    console.warn(`\n⚠️  Non-blocking step failed: ${cmd} ${args.join(" ")}\n   ${e?.message ?? e}\n`);
  }
}

function pickPort() {
  const out = execFileSync("node", ["scripts/find-free-port.mjs"], {
    encoding: "utf8",
  }).trim();
  return Number(out);
}

async function main() {
  const HOST = process.env.HOST || "127.0.0.1";

  banner("DEV SAFE: LINT");
  await run("npm", ["run", "lint"]);

  banner("DEV SAFE: TYPECHECK");
  await run("npm", ["run", "typecheck"]);

  const skipTests = process.env.DEVSAFE_SKIP_TESTS === "1";
  if (skipTests) {
    console.log("\n⚠️  DEV SAFE: TESTS SKIPPED (DEVSAFE_SKIP_TESTS=1)\n");
  } else {
    banner("DEV SAFE: TEST");
    await run("npm", ["run", "test"]);
  }

  banner("DEV SAFE: PICK FREE PORT");
  const port = pickPort();
  const BASE = `http://${HOST}:${port}`;
  console.log(`Selected port: ${port}\n`);

  banner("DEV SAFE: START DEV SERVER");
  const dev = runLong("npm", ["run", "dev:raw", String(port)]);

  banner("DEV SAFE: WAIT FOR SERVER");
  await run("npx", ["wait-on", "-t", "60000", BASE]);

  // NEW: try to open browser, but do NOT fail the whole script if it errors
  banner("DEV SAFE: OPEN (NON-BLOCKING)");
  // Prefer macOS `open` directly; fall back to open-cli
  if (process.platform === "darwin") {
    await runSoft("open", [`${BASE}/demo`]);
  } else {
    await runSoft("npx", ["open-cli", `${BASE}/demo`]);
  }

  console.log(`\n✅ DEV SAFE: PASS — server ready at ${BASE}\n`);

  dev.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error("\n❌ Dev safe launch aborted:", e.message);
  process.exit(1);
});
