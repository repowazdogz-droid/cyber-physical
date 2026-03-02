/**
 * Append-only JSONL store with optional hash chain verification.
 * When traceability is OFF: append still writes but prev_hash/hash are empty; verifyChain() returns valid.
 */

import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

export type RegistryRecordType = "proposal" | "decision" | "claim" | "trace";

export interface RegistryRecord {
  record_type: RegistryRecordType;
  record_id: string;
  payload: unknown;
  prev_hash: string;
  hash: string;
  appended_at: string;
}

const GENESIS_HASH = "0".repeat(64);

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = obj[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof v !== "string") {
      out[k] = sortKeys(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function stableStringify(payload: unknown): string {
  if (payload === null || typeof payload !== "object") {
    return JSON.stringify(payload);
  }
  if (Array.isArray(payload)) {
    return "[" + payload.map((item) => stableStringify(item)).join(",") + "]";
  }
  return JSON.stringify(sortKeys(payload as Record<string, unknown>));
}

function sha256(str: string): string {
  return createHash("sha256").update(str, "utf8").digest("hex");
}

export interface JsonlRegistryOptions {
  path: string;
  traceability: boolean;
}

export class JsonlRegistry {
  private path: string;
  private traceability: boolean;
  private lastHash: string = GENESIS_HASH;

  constructor(options: JsonlRegistryOptions) {
    this.path = options.path;
    this.traceability = options.traceability;
  }

  private ensureDir(): void {
    const dir = path.dirname(this.path);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  append(record_type: RegistryRecordType, record_id: string, payload: unknown, appended_at: string): RegistryRecord {
    this.ensureDir();
    const prev_hash = this.traceability ? this.lastHash : "";
    const canonical =
      record_type + "\n" + record_id + "\n" + stableStringify(payload) + "\n" + prev_hash;
    const hash = this.traceability ? sha256(canonical) : "";
    if (this.traceability) {
      this.lastHash = hash;
    }
    const record: RegistryRecord = {
      record_type,
      record_id,
      payload,
      prev_hash,
      hash,
      appended_at,
    };
    fs.appendFileSync(this.path, JSON.stringify(record) + "\n", "utf8");
    return record;
  }

  loadAll(): RegistryRecord[] {
    if (!fs.existsSync(this.path)) {
      return [];
    }
    const content = fs.readFileSync(this.path, "utf8");
    const lines = content.trim().split("\n").filter((l) => l.length > 0);
    return lines.map((line) => JSON.parse(line) as RegistryRecord);
  }

  verifyChain(): { valid: boolean; broken_at?: number } {
    if (!this.traceability) {
      return { valid: true };
    }
    const records = this.loadAll();
    let prev = GENESIS_HASH;
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.prev_hash !== prev) {
        return { valid: false, broken_at: i };
      }
      const canonical =
        r.record_type + "\n" + r.record_id + "\n" + stableStringify(r.payload) + "\n" + r.prev_hash;
      const expected = sha256(canonical);
      if (r.hash !== expected) {
        return { valid: false, broken_at: i };
      }
      prev = r.hash;
    }
    return { valid: true };
  }
}
