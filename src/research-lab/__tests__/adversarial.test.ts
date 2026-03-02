/**
 * Adversarial and collusion scenarios: deletion, modification, claim relabelling, fabricated approval.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  recordDeletionAttempt,
  recordModificationAttempt,
  claimTierRelabelling,
  fabricatedApproval,
} from "../runtime/adversarial";
import { DEFAULT_CONFIG } from "../runtime/config";

let tempDir: string;

function tempPath(basename: string): string {
  return path.join(tempDir, basename);
}

describe("Adversarial scenarios", () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "research-lab-adversarial-"));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const f of files) {
          fs.unlinkSync(path.join(tempDir, f));
        }
        fs.rmdirSync(tempDir);
      } catch {
        // ignore
      }
      tempDir = "";
    }
  });

  describe("Record deletion attempt", () => {
    it("detected when traceability ON", async () => {
      const result = recordDeletionAttempt({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: true },
        registry_path: tempPath("deletion-on.jsonl"),
      });
      expect(result.chain_valid_before).toBe(true);
      expect(result.chain_valid_after).toBe(false);
      expect(result.deleted_count).toBe(1);
      expect(result.original_count).toBeGreaterThanOrEqual(4);
    });

    it("undetected when traceability OFF", async () => {
      const result = recordDeletionAttempt({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: false },
        registry_path: tempPath("deletion-off.jsonl"),
      });
      expect(result.chain_valid_before).toBe(true);
      expect(result.chain_valid_after).toBe(true);
    });
  });

  describe("Record modification attempt", () => {
    it("detected when traceability ON", async () => {
      const result = recordModificationAttempt({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: true },
        registry_path: tempPath("modify-on.jsonl"),
      });
      expect(result.original_decision).toBe("block");
      expect(result.tampered_decision).toBe("allow");
      expect(result.chain_valid_before).toBe(true);
      expect(result.chain_valid_after).toBe(false);
    });

    it("undetected when traceability OFF", async () => {
      const result = recordModificationAttempt({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: false },
        registry_path: tempPath("modify-off.jsonl"),
      });
      expect(result.chain_valid_after).toBe(true);
    });
  });

  describe("Claim tier relabelling (collusion)", () => {
    it("blocked when governance ON", async () => {
      const result = claimTierRelabelling({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: true },
        registry_path: tempPath("relabel-on.jsonl"),
      });
      expect(result.governance_blocked).toBe(true);
      expect(result.promotion_allowed).toBe(false);
    });

    it("succeeds when governance OFF", async () => {
      const result = claimTierRelabelling({
        ...DEFAULT_CONFIG,
        primitives: { governance: false, reasoning: true, traceability: true },
        registry_path: tempPath("relabel-off.jsonl"),
      });
      expect(result.governance_blocked).toBe(false);
      expect(result.promotion_allowed).toBe(true);
    });
  });

  describe("Fabricated approval (authenticity gap)", () => {
    it("chain valid but reasoning catches missing governance trace", async () => {
      const result = fabricatedApproval({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: true, traceability: true },
        registry_path: tempPath("fabricated-full.jsonl"),
      });
      expect(result.fabricated_record_inserted).toBe(true);
      expect(result.chain_valid_after_insertion).toBe(true);
      expect(result.claim_graduated).toBe(true);
    });

    it("completely undetectable with reasoning and traceability OFF", async () => {
      const result = fabricatedApproval({
        ...DEFAULT_CONFIG,
        primitives: { governance: true, reasoning: false, traceability: false },
        registry_path: tempPath("fabricated-off.jsonl"),
      });
      expect(result.fabricated_record_inserted).toBe(true);
      expect(result.chain_valid_after_insertion).toBe(true);
    });
  });
});
