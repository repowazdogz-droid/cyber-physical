import { LLMAdapter, DomainPack, Identity, RunContext } from "./types";
import { refineIntent } from "./intent_refiner";
import { resolveContext } from "./context_resolver";
import { mapIntent, riskScan } from "./mapper";
import { criticReview } from "./critic";
import { executePlan } from "./executor";
import { plan } from "./planner";
import { StateLedger } from "./state_ledger";
import { EventBus } from "./events";
import { ToolBudget } from "../tools/budget";
import { enforceBudget } from "./context_budget";

export type RunResult = {
  status: "DONE" | "FAILED" | "WAITING_FOR_APPROVAL";
  artifact?: any;
  trace: any[];
  runId: string;
};

type PlanStep = {
  tool: string;
  input: any;
};

function generateRunId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)
  );
}

export async function runGraph(
  intent: string,
  domain: DomainPack,
  identity: Identity,
  llm: LLMAdapter,
  bus: EventBus,
): Promise<RunResult> {
  const runId = generateRunId();

  // Phase A: refine intent and resolve pre-query plan
  const refinedIntent = await refineIntent(intent, llm);
  const preQueryPlan: PlanStep[] = await resolveContext(domain, refinedIntent);

  const ctx: RunContext = {
    intent,
    refinedIntent,
    domain,
    identity,
    memory: { runId },
    toolResults: {},
    trace: [],
  };

  const ledger = new StateLedger();
  const budget = new ToolBudget();

  if (preQueryPlan && preQueryPlan.length > 0) {
    const preStatus: any = await executePlan(
      preQueryPlan,
      ctx,
      ledger,
      bus,
      budget,
    );

    if (preStatus.status !== "DONE") {
      return {
        status: preStatus.status,
        trace: ctx.trace,
        runId,
      };
    }
  }

  const contextSummary = JSON.stringify(ctx.toolResults).slice(0, 4000);
  enforceBudget(ctx, 24_000);

  const fastPath = contextSummary.length < 2000;

  // Phase B: mapping and risk scan (skipped on fast path)
  if (!fastPath) {
    const [mapperFrame, risks] = await Promise.all([
      mapIntent(refinedIntent, contextSummary, llm),
      riskScan(refinedIntent, llm),
    ]);

    ctx.trace.push({
      type: "MAPPER_FRAME",
      frame: mapperFrame,
      risks,
      ts: Date.now(),
    });
  }

  // Phase C: planning
  const executionPlan: PlanStep[] = await plan(refinedIntent, llm, ctx.domain);

  // Phase D: execution
  const execStatus: any = await executePlan(
    executionPlan,
    ctx,
    ledger,
    bus,
    budget,
  );

  if (execStatus.status !== "DONE") {
    return {
      status: execStatus.status,
      trace: ctx.trace,
      runId,
    };
  }

  // Phase E: artifact build and critique
  const artifact = await domain.artifact.build(ctx, llm);
  const critique = await criticReview(artifact, refinedIntent, llm);

  if (critique && critique.safe === false) {
    const issues =
      Array.isArray(critique.issues) && critique.issues.length > 0
        ? critique.issues.join(", ")
        : "unknown issues";
    throw new Error("Critic rejected artifact: " + issues);
  }

  bus.emit({
    type: "ARTIFACT_BUILT",
    name: domain.artifact.name,
    ts: Date.now(),
  } as any);

  return {
    status: "DONE",
    artifact,
    trace: ctx.trace,
    runId,
  };
}

