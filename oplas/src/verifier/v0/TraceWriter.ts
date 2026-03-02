/**
 * Trace Writer
 * 
 * Writes verifier trace to JSONL format.
 * 
 * Version: 1.0.0
 */

import { VerifierTraceEvent } from './types';
import { CostBreakdown, RunMetrics } from '../../contracts/types/Trace';

/**
 * Writes trace events to JSONL string.
 */
export function writeTrace(events: VerifierTraceEvent[]): string {
  return events.map(event => JSON.stringify(event)).join('\n');
}

/**
 * Reads trace events from JSONL string.
 */
export function readTrace(jsonl: string): VerifierTraceEvent[] {
  return jsonl
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line));
}























