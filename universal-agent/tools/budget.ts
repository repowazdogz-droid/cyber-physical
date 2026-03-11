import { getToolSpec } from "./registry";

const DEFAULT_LIMIT = 50;

export class ToolBudget {
  private counts = new Map<string, number>();

  take(tool: string): void {
    const spec = getToolSpec(tool);
    const limit = spec?.maxCallsPerRun ?? DEFAULT_LIMIT;

    const current = this.counts.get(tool) ?? 0;
    const next = current + 1;

    if (next > limit) {
      throw new Error(
        `Tool "${tool}" exceeded max calls per run (limit ${limit}).`,
      );
    }

    this.counts.set(tool, next);
  }
}

