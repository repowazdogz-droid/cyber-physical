import { spawn, execFileSync } from "node:child_process";
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

async function findFreePort() {
  const port = execFileSync("node", ["scripts/find-free-port.mjs"], {
    encoding: "utf8",
  }).trim();
  return port;
}

(async () => {
  const requestedPort = process.argv[2];
  const host = "127.0.0.1";
  let port = requestedPort || "3001";

  // If a port was requested, check if it's free
  if (requestedPort) {
    const free = await isPortFree(Number(port));
    if (!free) {
      console.error(`⚠️  Port ${port} is busy. Finding a free port...`);
      port = await findFreePort();
    }
  } else {
    // No port specified, find a free one
    port = await findFreePort();
  }

  console.log(`Starting dev server on port ${port}...\n`);

  const p = spawn(
    "npx",
    ["next", "dev", "-H", host, "-p", port],
    { stdio: "inherit", shell: process.platform === "win32" }
  );

  p.on("exit", (code) => process.exit(code ?? 0));
})();



