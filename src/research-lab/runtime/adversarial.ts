/**
 * Adversarial and collusion scenario definitions.
 * Each scenario takes RuntimeConfig and returns a structured result.
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import type { RuntimeConfig } from "./config";
import { ResearchLabRuntime } from "./runner";
import { createProposal } from "../models/proposal";
import type { ExperimentProposal } from "../models/proposal";
import {
  canPromoteToBaselineBeating,
  canPromoteToGraduated,
  type Claim,
} from "../models/claim";
import { JsonlRegistry } from "../registry/jsonl";
import { DEFAULT_CONFIG } from "./config";

const ISO = "2025-01-15T12:00:00.000Z";
const GENESIS_HASH = "0".repeat(64);

function baseProposal(overrides: Partial<ExperimentProposal>): ExperimentProposal {
  return createProposal({
    id: "exp-base",
    hypothesis: "Baseline",
    type: "baseline",
    baseline_ref: null,
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 512 },
    compute_budget: { max_params: 1e6, max_flops: 1e9, max_runtime_sec: 3600 },
    scaling_hypothesis: null,
    controls: { seed_plan: [42, 123, 456], dataset_version: "v1", eval_protocol: "p1" },
    ablations: [],
    created_at: ISO,
    ...overrides,
  });
}

// Mirror registry's canonical hash for fabricated record (integrity ≠ authenticity demo)
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

function computeRecordHash(
  record_type: string,
  record_id: string,
  payload: unknown,
  prev_hash: string
): string {
  const canonical =
    record_type + "\n" + record_id + "\n" + stableStringify(payload) + "\n" + prev_hash;
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

// --- Scenario 1: Record deletion attempt ---

export function recordDeletionAttempt(config: RuntimeConfig): {
  original_count: number;
  deleted_count: number;
  chain_valid_before: boolean;
  chain_valid_after: boolean;
} {
  const runtime = new ResearchLabRuntime(config);
  const ctx = { baseline_metrics: { params: 1e6, flops: 1e9, loss: 0.5 } };

  runtime.run({
    proposal: baseProposal({ id: "exp-del-001" }),
    context: ctx,
    decided_at: ISO,
  });
  runtime.run({
    proposal: baseProposal({ id: "exp-del-002" }),
    context: ctx,
    decided_at: ISO,
  });

  const registry = runtime.getRegistry();
  const records = registry.loadAll();
  const original_count = records.length;
  const chain_valid_before = registry.verifyChain().valid;

  if (records.length < 2) {
    return {
      original_count,
      deleted_count: 0,
      chain_valid_before,
      chain_valid_after: chain_valid_before,
    };
  }

  const withoutSecond = records.filter((_, i) => i !== 1);
  const deleted_count = original_count - withoutSecond.length;
  fs.writeFileSync(
    config.registry_path,
    withoutSecond.map((r) => JSON.stringify(r)).join("\n") + "\n",
    "utf8"
  );

  const registryAfter = new JsonlRegistry({
    path: config.registry_path,
    traceability: config.primitives.traceability,
  });
  const chain_valid_after = registryAfter.verifyChain().valid;

  return {
    original_count,
    deleted_count,
    chain_valid_before,
    chain_valid_after,
  };
}

// --- Scenario 2: Record modification attempt ---

export function recordModificationAttempt(config: RuntimeConfig): {
  original_decision: string;
  tampered_decision: string;
  chain_valid_before: boolean;
  chain_valid_after: boolean;
} {
  const runtime = new ResearchLabRuntime(config);
  const blockedProposal = baseProposal({
    id: "exp-mod-001",
    type: "architecture",
    baseline_ref: "exp-000",
    proposed_change: { parameter: "hidden_size", from_value: 512, to_value: 1024 },
    scaling_hypothesis: null,
  });
  runtime.run({ proposal: blockedProposal, context: {}, decided_at: ISO });

  const registry = runtime.getRegistry();
  const chain_valid_before = registry.verifyChain().valid;
  const records = registry.loadAll();
  const decisionRecord = records.find(
    (r) => r.record_type === "decision" && (r.payload as { outcome?: string })?.outcome === "block"
  );
  const original_decision = "block";
  const tampered_decision = "allow";

  if (!decisionRecord) {
    return {
      original_decision,
      tampered_decision,
      chain_valid_before,
      chain_valid_after: chain_valid_before,
    };
  }

  (decisionRecord.payload as { outcome: string }).outcome = tampered_decision;
  const modified = records.map((r) => (r === decisionRecord ? { ...r, payload: decisionRecord.payload } : r));
  fs.writeFileSync(
    config.registry_path,
    modified.map((r) => JSON.stringify(r)).join("\n") + "\n",
    "utf8"
  );

  const registryAfter = new JsonlRegistry({
    path: config.registry_path,
    traceability: config.primitives.traceability,
  });
  const chain_valid_after = registryAfter.verifyChain().valid;

  return {
    original_decision,
    tampered_decision,
    chain_valid_before,
    chain_valid_after,
  };
}

// --- Scenario 3: Claim tier relabelling (collusion) ---

export function claimTierRelabelling(config: RuntimeConfig): {
  original_tier: string;
  attempted_tier: string;
  promotion_allowed: boolean;
  governance_blocked: boolean;
} {
  const original_tier = "OBSERVATION";
  const attempted_tier = "BASELINE_BEATING";

  const claim: Claim = {
    id: "claim-relabel-001",
    experiment_ids: ["exp-single-seed-001"],
    current_tier: original_tier,
    stats: { mean: 0.5, std: 0.05, cv: 0.08, effect_size: 0.07 },
    contradictions: [],
    requires_human_approval: false,
  };

  const claimsConfig = config.claims ?? DEFAULT_CONFIG.claims;
  let promotion_allowed: boolean;
  let governance_blocked: boolean;

  if (config.primitives.governance) {
    const result = canPromoteToBaselineBeating(claim, claimsConfig);
    promotion_allowed = result.allowed;
    governance_blocked = !result.allowed;
  } else {
    promotion_allowed = true;
    governance_blocked = false;
  }

  return {
    original_tier,
    attempted_tier,
    promotion_allowed,
    governance_blocked,
  };
}

// --- Scenario 4: Fabricated approval (authenticity gap) ---

export function fabricatedApproval(config: RuntimeConfig): {
  fabricated_record_inserted: boolean;
  chain_valid_after_insertion: boolean;
  claim_graduated: boolean;
} {
  const runtime = new ResearchLabRuntime(config);
  const ctx = { baseline_metrics: { params: 1e6, flops: 1e9, loss: 0.5 } };
  const decided_at = ISO;

  runtime.run({
    proposal: baseProposal({ id: "exp-fab-baseline" }),
    context: ctx,
    decided_at,
  });
  for (let i = 0; i < 3; i++) {
    runtime.run({
      proposal: baseProposal({
        id: `exp-fab-repl-${i}`,
        baseline_ref: "exp-fab-baseline",
        type: "replication",
      }),
      context: ctx,
      decided_at,
    });
  }

  const claim: Claim = {
    id: "claim-fab-001",
    experiment_ids: ["exp-fab-repl-0", "exp-fab-repl-1", "exp-fab-repl-2"],
    current_tier: "BASELINE_BEATING",
    stats: { mean: 0.55, std: 0.04, cv: 0.07, effect_size: 0.06 },
    contradictions: [],
    requires_human_approval: false,
  };

  const records = runtime.getRegistry().loadAll();
  const lastRecord = records[records.length - 1];
  const prev_hash = config.primitives.traceability ? lastRecord.hash : GENESIS_HASH;

  const approvalPayload = { claim_id: claim.id, human_approval: true };
  const record_type = "approval";
  const record_id = "fabricated-001";
  const hash = config.primitives.traceability
    ? computeRecordHash(record_type, record_id, approvalPayload, prev_hash)
    : "";
  const fabricated = {
    record_type,
    record_id,
    payload: approvalPayload,
    prev_hash,
    hash,
    appended_at: ISO,
  };

  fs.appendFileSync(config.registry_path, JSON.stringify(fabricated) + "\n", "utf8");

  const registryAfter = new JsonlRegistry({
    path: config.registry_path,
    traceability: config.primitives.traceability,
  });
  const chain_valid_after_insertion = registryAfter.verifyChain().valid;

  const claimWithFabricatedApproval: Claim = { ...claim, requires_human_approval: true };
  const graduatedResult = canPromoteToGraduated(claimWithFabricatedApproval);
  const claim_graduated = graduatedResult.allowed;

  return {
    fabricated_record_inserted: true,
    chain_valid_after_insertion,
    claim_graduated,
  };
}
