// spine/sim/verifyFaultEpisode.ts

import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

export type VerifyResult =
  | { ok: true; hash: string }
  | { ok: false; expected: string; actual: string };

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function verifySimJson(simPath: string, shaPath: string): Promise<VerifyResult> {
  const json = await readFile(simPath, "utf8");
  const expected = (await readFile(shaPath, "utf8")).trim();
  const actual = sha256(json);
  if (expected === actual) return { ok: true, hash: actual };
  return { ok: false, expected, actual };
}



































