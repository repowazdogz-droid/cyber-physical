/**
 * Thin bridge to Clearpath: createTrace, verifyTrace, exportJSON.
 * Uses Clearpath's public API only.
 */

import {
  createTrace as clearpathCreateTrace,
  verifyTrace,
  exportJSON,
} from "../../../clearpath/src/index";
import type { TraceBuilder } from "../../../clearpath/src/core/trace";

export { verifyTrace, exportJSON };
export type { TraceBuilder };

export interface CreateTraceOptions {
  agentId: string;
  context: string;
}

export function createTrace(options: CreateTraceOptions): TraceBuilder {
  return clearpathCreateTrace(options);
}
