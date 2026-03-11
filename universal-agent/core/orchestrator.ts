import { DomainPack, Identity, LLMAdapter } from "./types";
import { EventBus } from "./events";
import { StateLedger } from "./state_ledger";
import { runGraph, RunResult } from "./run_graph";
import { resolve as resolveApproval } from "../approvals/queue";
import { recordOutcome } from "../outcomes/store";

const ledger = new StateLedger();

export async function orchestrate(
  intent: string,
  domain: DomainPack,
  identity: Identity,
  llm: LLMAdapter,
  bus: EventBus,
): Promise<RunResult> {
  const result = await runGraph(intent, domain, identity, llm, bus);

  const existing = ledger.load(result.runId);

  ledger.save({
    runId: result.runId,
    checkpointId: "final",
    updatedAt: Date.now(),
    memory: {
      intent,
      domainId: domain.id,
      identity,
      status: result.status,
      lastTrace: result.trace,
      previous: existing?.memory,
    },
  });

  bus.emit({ type: "RUN_DONE" });

  return result;
}

export async function resumeRun(
  runId: string,
  approvalId: string,
  approved: boolean,
  domain: DomainPack,
  identity: Identity,
  llm: LLMAdapter,
  bus: EventBus,
): Promise<RunResult> {
  const record = ledger.load(runId);
  if (!record) {
    throw new Error(`No ledger record found for runId ${runId}`);
  }

  const approvalResult = resolveApproval(approvalId, approved);

  if (!approvalResult) {
    return {
      status: "FAILED",
      artifact: undefined,
      trace: (record.memory as any)?.lastTrace ?? [],
      runId,
    };
  }

  if (!approved) {
    recordOutcome({
      runId,
      domainId: domain.id,
      artifactId: approvalResult.action.tool,
      status: "rejected",
      userNote: "Human rejected pending approval.",
      ts: Date.now(),
    });

    return {
      status: "FAILED",
      artifact: undefined,
      trace: (record.memory as any)?.lastTrace ?? [],
      runId,
    };
  }

  const intent =
    (record.memory as any)?.intent ??
    `Resumed run ${runId} for domain ${domain.id}`;

  const result = await runGraph(intent, domain, identity, llm, bus);

  const existing = ledger.load(result.runId);

  ledger.save({
    runId: result.runId,
    checkpointId: "final",
    updatedAt: Date.now(),
    memory: {
      intent,
      domainId: domain.id,
      identity,
      status: result.status,
      lastTrace: result.trace,
      previous: existing?.memory,
    },
  });

  bus.emit({ type: "RUN_DONE" });

  return result;
}

