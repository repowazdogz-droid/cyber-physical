import { RunContext, PolicyContext } from "./types";
import { StateLedger } from "./state_ledger";
import { EventBus } from "./events";
import { ToolBudget } from "../tools/budget";
import { callTool } from "../tools/mcp_router";
import { withRetry } from "./retry";
import { withTimeout } from "./timeout";
import { enforceBudget } from "./context_budget";
import { toToolError, ToolError } from "./errors";
import { validate } from "../policy_engine/validator";
import { enqueue } from "../approvals/queue";

type PlanStep = {
  tool: string;
  input: any;
};

type ExecutorResult =
  | { status: "DONE" }
  | { status: "WAITING_FOR_APPROVAL"; actionId: string }
  | { status: "FAILED"; error: ToolError };

function checkpoint(
  ledger: StateLedger,
  ctx: RunContext,
  checkpointId: string,
): void {
  const runId =
    (ctx as any).runId && typeof (ctx as any).runId === "string"
      ? (ctx as any).runId
      : "unknown-run";

  ledger.save({
    runId,
    checkpointId,
    updatedAt: Date.now(),
    memory: ctx.memory,
  });
}

export async function executePlan(
  plan: PlanStep[],
  ctx: RunContext,
  ledger: StateLedger,
  bus: EventBus,
  budget: ToolBudget,
): Promise<ExecutorResult> {
  const domainPolicies = ctx.domain.policies ?? [];

  for (let index = 0; index < plan.length; index += 1) {
    const step = plan[index];

    // 1. Budget enforcement per tool
    budget.take(step.tool);

    // 2. Policy validation (global + domain)
    const policyCtx: PolicyContext = {
      tool: step.tool,
      input: step.input,
      intent: ctx.intent,
      domainId: ctx.domain.id,
      identity: ctx.identity,
    };

    const decision = validate(policyCtx, domainPolicies);
    if (!decision.allow) {
      const reason =
        "reason" in decision ? decision.reason : "Blocked by policy";
      const requiresApproval =
        "requiresApproval" in decision ? decision.requiresApproval : false;

      if (requiresApproval) {
        const pending = enqueue(
          step.tool,
          step.input,
          reason ?? "Approval required",
        );

        ctx.trace.push({
          type: "HITL_REQUIRED",
          stepIndex: index,
          tool: step.tool,
          reason,
          pendingId: pending.id,
          ts: Date.now(),
        });

        bus.emit({ type: "HITL_REQUIRED" });
        checkpoint(ledger, ctx, `step-${index}-hitl`);

        return { status: "WAITING_FOR_APPROVAL", actionId: pending.id };
      }

      const error = new ToolError(reason, { retryable: false });

      ctx.trace.push({
        type: "STEP_FAIL",
        stepIndex: index,
        tool: step.tool,
        error: error.message,
        ts: Date.now(),
      });

      bus.emit({ type: "STEP_FAIL" });
      checkpoint(ledger, ctx, `step-${index}-policy-fail`);

      return { status: "FAILED", error };
    }

    // 4. Execute tool with retry + timeout
    let result: any;
    try {
      const output = await withRetry(
        () =>
          withTimeout(
            callTool(step.tool, { ...step.input, _identity: ctx.identity }),
            60_000,
            step.tool,
          ),
        { retries: 0, baseDelayMs: 500, maxDelayMs: 2000 },
      );
      result = output;
    } catch (err) {
      // 6. Failure handling
      const toolError = toToolError(err);

      ctx.trace.push({
        type: "STEP_FAIL",
        stepIndex: index,
        tool: step.tool,
        error: toolError.message,
        ts: Date.now(),
      });

      bus.emit({ type: "STEP_FAIL" });
      checkpoint(ledger, ctx, `step-${index}-error`);

      return { status: "FAILED", error: toolError };
    }

    // 5. Success path
    const existingResult = ctx.toolResults[step.tool];
    if (!existingResult) {
      ctx.toolResults[step.tool] = [result];
    } else if (Array.isArray(existingResult)) {
      existingResult.push(result);
    } else {
      ctx.toolResults[step.tool] = [existingResult, result];
    }

    ctx.trace.push({
      type: "STEP_OK",
      stepIndex: index,
      tool: step.tool,
      result,
      ts: Date.now(),
    });

    bus.emit({ type: "STEP_OK" });
    checkpoint(ledger, ctx, `step-${index}-ok`);
    enforceBudget(ctx);
  }

  bus.emit({ type: "RUN_DONE" });
  checkpoint(ledger, ctx, "run-done");

  return { status: "DONE" };
}

