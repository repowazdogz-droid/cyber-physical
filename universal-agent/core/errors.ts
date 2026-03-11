export class ToolError extends Error {
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super(message);
    this.name = "ToolError";
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}

export class TimeoutError extends Error {
  readonly timeoutMs?: number;

  constructor(message: string, timeoutMs?: number) {
    super(message);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isRetryable(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof ToolError) {
    return error.retryable;
  }

  const anyErr = error as any;
  const code = typeof anyErr?.code === "string" ? anyErr.code.toUpperCase() : "";
  const message = typeof anyErr?.message === "string" ? anyErr.message.toLowerCase() : "";

  if (code === "ECONNRESET" || code === "ETIMEDOUT") {
    return true;
  }

  if (message.includes("fetch failed")) {
    return true;
  }

  return false;
}

export function toToolError(
  error: unknown,
  options?: {
    retryable?: boolean;
  },
): ToolError {
  if (error instanceof ToolError) {
    return error;
  }

  const retryable =
    options?.retryable !== undefined ? options.retryable : isRetryable(error);

  if (error instanceof TimeoutError) {
    return new ToolError(error.message, { retryable: true, cause: error });
  }

  if (error instanceof Error) {
    return new ToolError(error.message, { retryable, cause: error });
  }

  const message = typeof error === "string" ? error : "Unknown error";
  return new ToolError(message, { retryable, cause: error });
}

