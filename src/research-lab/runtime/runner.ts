/**
 * Main runtime loop: proposal → governance → reasoning → trace → registry.
 * Primitive toggles skip steps when OFF.
 */

import type { ExperimentProposal } from "../models/proposal";
import type { GovernanceDecision } from "../models/decision";
import type { GovernanceContext } from "../governance/types";
import { GovernanceEngine } from "../governance/engine";
import { buildGovernanceTrace } from "../reasoning/graph";
import { JsonlRegistry } from "../registry/jsonl";
import type { RuntimeConfig } from "./config";
import type { TraceBuilder } from "../../../clearpath/src/core/trace";

export interface RunResult {
  proposal_id: string;
  decision: GovernanceDecision;
  trace: TraceBuilder | null;
  record_hash: string;
  appended_at: string;
}

export interface RuntimeInput {
  proposal: ExperimentProposal;
  context: GovernanceContext;
  /** ISO 8601 timestamp for decision and record (deterministic). */
  decided_at: string;
}

export class ResearchLabRuntime {
  private engine: GovernanceEngine;
  private registry: JsonlRegistry;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.engine = new GovernanceEngine({ scaling: config.scaling });
    this.registry = new JsonlRegistry({
      path: config.registry_path,
      traceability: config.primitives.traceability,
    });
  }

  run(input: RuntimeInput): RunResult {
    const { proposal, context, decided_at } = input;

    let decision: GovernanceDecision;
    if (this.config.primitives.governance) {
      decision = this.engine.evaluate(proposal, context, decided_at);
    } else {
      decision = {
        proposal_id: proposal.id,
        outcome: "allow",
        violations: [],
        requirements: [],
        decision_hash: "",
        decided_at,
      };
    }

    const proposalRec = this.registry.append("proposal", proposal.id, proposal, decided_at);
    const decisionRec = this.registry.append(
      "decision",
      `${proposal.id}-decision`,
      decision,
      decided_at
    );
    let trace: TraceBuilder | null = null;
    let lastHash = decisionRec.hash;

    if (this.config.primitives.reasoning) {
      trace = buildGovernanceTrace({
        proposal,
        decision,
        context,
        record_hash: this.config.primitives.traceability ? decisionRec.hash : undefined,
      });
      const tracePayload = { nodes: trace.nodes, boundaries: trace.boundaries };
      const traceRec = this.registry.append(
        "trace",
        `${proposal.id}-trace`,
        tracePayload,
        decided_at
      );
      if (this.config.primitives.traceability) {
        lastHash = traceRec.hash;
      }
    }

    return {
      proposal_id: proposal.id,
      decision,
      trace,
      record_hash: this.config.primitives.traceability ? lastHash : "",
      appended_at: decided_at,
    };
  }

  getRegistry(): JsonlRegistry {
    return this.registry;
  }
}
