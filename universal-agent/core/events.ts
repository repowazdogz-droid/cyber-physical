export type RunEvent =
  | { type: "STEP_OK" }
  | { type: "STEP_FAIL" }
  | { type: "HITL_REQUIRED" }
  | { type: "ARTIFACT_BUILT" }
  | { type: "RUN_DONE" }
  | { type: "INTENT_REFINED" };

type RunEventHandler = (event: RunEvent) => void;

export class EventBus {
  private handlers = new Set<RunEventHandler>();

  on(handler: RunEventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(event: RunEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}

