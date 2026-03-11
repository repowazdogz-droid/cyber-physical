const DEFAULT_MAX_CHARS = 24_000;
const TOOL_RESULT_THRESHOLD = 2_000;

export function estimateChars(o: any): number {
  try {
    const s = JSON.stringify(o);
    return s ? s.length : 0;
  } catch {
    return 0;
  }
}

export function enforceBudget(
  ctx: {
    memory: Record<string, any>;
    toolResults: Record<string, any>;
    trace: any[];
  },
  maxChars: number = DEFAULT_MAX_CHARS,
): void {
  void maxChars; // reserved for future global budget enforcement

  // Step 1: trim trace to last 60 events
  if (Array.isArray(ctx.trace) && ctx.trace.length > 60) {
    ctx.trace = ctx.trace.slice(-60);
  }

  // Step 2: compress large toolResults entries
  if (ctx.toolResults && typeof ctx.toolResults === "object") {
    for (const key of Object.keys(ctx.toolResults)) {
      const value = ctx.toolResults[key];
      const size = estimateChars(value);

      if (size > TOOL_RESULT_THRESHOLD) {
        ctx.toolResults[key] = {
          _summary: "omitted_large_payload",
          _chars: size,
        };
      }
    }
  }
}

