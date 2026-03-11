import { DomainPack, Identity, LLMAdapter } from "./types";
import { EventBus } from "./events";
import { orchestrate, resumeRun } from "./orchestrator";
import { RunResult } from "./run_graph";

export async function runAgent(
  intent: string,
  domain: DomainPack,
  identity: Identity,
  llm: LLMAdapter,
): Promise<RunResult> {
  const bus = new EventBus();
  const result = await orchestrate(intent, domain, identity, llm, bus);
  return result;
}

export async function resumeAgent(
  runId: string,
  approvalId: string,
  approved: boolean,
  domain: DomainPack,
  identity: Identity,
  llm: LLMAdapter,
): Promise<RunResult> {
  const bus = new EventBus();
  const result = await resumeRun(
    runId,
    approvalId,
    approved,
    domain,
    identity,
    llm,
    bus,
  );
  return result;
}

