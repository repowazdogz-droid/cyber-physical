import { LedgerRecord } from "./types";

export class StateLedger {
  // swap Map for SQLite/Turso without changing interface
  private records = new Map<string, LedgerRecord>();

  load(runId: string): LedgerRecord | undefined {
    return this.records.get(runId);
  }

  save(record: LedgerRecord): void {
    this.records.set(record.runId, record);
  }
}

