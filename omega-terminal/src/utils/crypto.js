/**
 * OMEGA Trust Terminal — canonical JSON and Merkle chain
 */

export function canonicalJSON(obj) {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") {
    if (!Number.isFinite(obj)) return "null";
    return Object.is(obj, -0) ? "0" : String(obj);
  }
  if (typeof obj === "string") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalJSON).join(",") + "]";
  const keys = Object.keys(obj).sort();
  const parts = [];
  for (let i = 0; i < keys.length; i++) {
    const v = obj[keys[i]];
    if (v === undefined) continue;
    parts.push(JSON.stringify(keys[i]) + ":" + canonicalJSON(v));
  }
  return "{" + parts.join(",") + "}";
}

export async function sha256(input) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    return "NOCRYPTO-" + Math.abs(hash).toString(16).padStart(16, "0");
  }
}

export async function computeMerkleChain(stageOutputs) {
  const hashes = [];
  let prev = "0".repeat(64);
  for (const output of stageOutputs) {
    const hash = await sha256(canonicalJSON(output) + prev);
    hashes.push(hash);
    prev = hash;
  }
  return { stageHashes: hashes, rootHash: prev };
}
