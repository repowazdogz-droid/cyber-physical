import { appendFile } from "fs/promises";
import { Outcome } from "../core/types";

const OUTCOMES_FILE = "outcomes.jsonl";

export class OutcomeStore {
  private outcomes: Outcome[] = [];

  record(outcome: Outcome): void {
    this.outcomes.push(outcome);

    const line = JSON.stringify(outcome) + "\n";
    try {
      // Best-effort persistence; ignore environments without filesystem.
      void appendFile(OUTCOMES_FILE, line, "utf8").catch(() => {});
    } catch {
      // ignore synchronous errors (e.g., fs not available)
    }
  }

  list(domainId?: string): Outcome[] {
    if (!domainId) {
      return [...this.outcomes];
    }

    return this.outcomes.filter((o) => o.domainId === domainId);
  }
}

const defaultStore = new OutcomeStore();

export function recordOutcome(outcome: Outcome): void {
  defaultStore.record(outcome);
}

