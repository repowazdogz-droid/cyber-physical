import { isRetryable } from "./errors";

export interface RetryOptions {
  /**
   * Number of retry attempts after the initial call.
   * Defaults to 3.
   */
  retries?: number;
  /**
   * Base delay in milliseconds for exponential backoff.
   * Defaults to 300ms.
   */
  baseDelayMs?: number;
  /**
   * Maximum delay in milliseconds between attempts.
   * Defaults to 4000ms.
   */
  maxDelayMs?: number;
  /**
   * Whether to apply jitter to the delay.
   * Defaults to true.
   */
  jitter?: boolean;
  /**
   * Optional custom retry predicate.
   * By default, uses `isRetryable`.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean | Promise<boolean>;
  /**
   * Optional hook invoked before each retry attempt.
   */
  onRetry?: (
    error: unknown,
    attempt: number,
    delayMs: number,
  ) => void | Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;
  const maxDelayMs = options.maxDelayMs ?? 4000;
  const jitter = options.jitter ?? true;
  const shouldRetry = options.shouldRetry ?? isRetryable;

  let attempt = 0;

  // attempt index: 0 = first try, 1..retries = retry attempts
  // total attempts = retries + 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }

      const canRetry = await shouldRetry(error, attempt);
      if (!canRetry) {
        throw error;
      }

      let delay =
        baseDelayMs * Math.pow(2, attempt); // exponential backoff
      if (delay > maxDelayMs) {
        delay = maxDelayMs;
      }

      if (jitter) {
        const factor = 0.5 + Math.random(); // [0.5, 1.5)
        delay = Math.round(delay * factor);
      }

      if (options.onRetry) {
        await options.onRetry(error, attempt + 1, delay);
      }

      attempt += 1;
      await sleep(delay);
    }
  }
}

