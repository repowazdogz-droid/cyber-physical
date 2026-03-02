import { execFileSync, spawn } from "node:child_process";
import net from "node:net";

function isPortFree(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => {
        setTimeout(() => resolve(true), 10);
      });
    });
    server.listen(port, host);
  });
}

async function findAndVerifyFreePort() {
  // Find a free port
  const port = execFileSync("node", ["scripts/find-free-port.mjs"], {
    encoding: "utf8",
  }).trim();

  // Double-check it's still free right before launching
  const free = await isPortFree(Number(port));
  if (!free) {
    console.error(`⚠️  Port ${port} became busy, finding another...`);
    // Try again
    const newPort = execFileSync("node", ["scripts/find-free-port.mjs"], {
      encoding: "utf8",
    }).trim();
    return newPort;
  }

  return port;
}

(async () => {
  const port = await findAndVerifyFreePort();
  console.log(`✅ Port ${port} is free. Starting dev server...\n`);

  // Start Next.js dev server
  const p = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", port], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  p.on("exit", (code) => process.exit(code ?? 0));
})();



