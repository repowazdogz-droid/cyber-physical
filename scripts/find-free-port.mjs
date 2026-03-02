import net from "node:net";

const HOST = "127.0.0.1";
const START = Number(process.env.PORT_START || 3001);
const END = Number(process.env.PORT_END || 3100);

function canListen(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", (err) => {
      // EADDRINUSE means port is taken, which is fine - try next
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        // Other errors might be transient, but we'll treat as unavailable
        resolve(false);
      }
    });
    srv.once("listening", () => {
      srv.close(() => {
        // Small delay to ensure port is fully released
        setTimeout(() => resolve(true), 10);
      });
    });
    srv.listen(port, HOST);
  });
}

(async () => {
  for (let p = START; p <= END; p++) {
    // eslint-disable-next-line no-await-in-loop
    if (await canListen(p)) {
      process.stdout.write(String(p));
      process.exit(0);
    }
  }
  console.error(`No free port found in range ${START}-${END}`);
  process.exit(1);
})();

