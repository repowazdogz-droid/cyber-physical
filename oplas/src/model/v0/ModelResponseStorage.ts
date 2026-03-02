/**
 * Model Response Storage
 * 
 * Stores model responses for deterministic replay (Policy A: recorded-response replay).
 * 
 * Artifact schema:
 * task_<id>/runs/run_<run_id>/llm/
 *   propose_<n>.request.json
 *   propose_<n>.response.json
 *   repair_<n>.request.json
 *   repair_<n>.response.json
 *   llm_calls.jsonl (index)
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { ModelCallLog } from './types';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

/**
 * Stores a model call log using new artifact schema.
 */
export async function storeModelCall(
  taskRoot: string,
  taskId: string,
  runId: string,
  callLog: ModelCallLog,
  requestPayload: any,
  callIndex: number
): Promise<void> {
  const llmDir = join(taskRoot, `task_${taskId}`, 'runs', runId, 'llm');
  await fs.mkdir(llmDir, { recursive: true });

  // Store request payload
  const requestFilename = `${callLog.call_type}_${callIndex}.request.json`;
  const requestPath = join(llmDir, requestFilename);
  await fs.writeFile(
    requestPath,
    JSON.stringify(requestPayload, null, 2),
    'utf8'
  );

  // Store response
  const responseFilename = `${callLog.call_type}_${callIndex}.response.json`;
  const responsePath = join(llmDir, responseFilename);
  await fs.writeFile(
    responsePath,
    JSON.stringify(callLog.response, null, 2),
    'utf8'
  );

  // Append to llm_calls.jsonl index
  const indexPath = join(llmDir, 'llm_calls.jsonl');
  const indexEntry = {
    model_id: callLog.model_id,
    call_type: callLog.call_type,
    call_index: callIndex,
    request_hash: callLog.request_hash,
    response_hash: callLog.response_hash,
    token_estimates: callLog.token_estimates,
    latency_ms: callLog.latency_ms,
    cost_usd_est: callLog.cost_usd_est,
    timestamp_iso: callLog.timestamp_iso
  };
  await fs.appendFile(
    indexPath,
    JSON.stringify(indexEntry) + '\n',
    'utf8'
  );
}

/**
 * Loads a model call log by request hash.
 */
export async function loadModelCall(
  taskRoot: string,
  taskId: string,
  runId: string,
  callType: 'propose' | 'repair' | 'annotate',
  requestHash: string
): Promise<ModelCallLog | null> {
  const llmDir = join(taskRoot, `task_${taskId}`, 'runs', runId, 'llm');
  const indexPath = join(llmDir, 'llm_calls.jsonl');

  try {
    // Read index
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const lines = indexContent.trim().split('\n').filter(l => l.length > 0);

    // Find matching entry
    for (const line of lines) {
      const entry = JSON.parse(line);
      if (entry.call_type === callType && entry.request_hash === requestHash) {
        // Load request and response
        const requestPath = join(llmDir, `${callType}_${entry.call_index}.request.json`);
        const responsePath = join(llmDir, `${callType}_${entry.call_index}.response.json`);

        const requestPayload = JSON.parse(await fs.readFile(requestPath, 'utf8'));
        const response = JSON.parse(await fs.readFile(responsePath, 'utf8'));

        return {
          timestamp_iso: entry.timestamp_iso,
          model_id: entry.model_id,
          call_type: callType,
          request_hash: entry.request_hash,
          prompt_hash: entry.request_hash, // Same for v0
          response_hash: entry.response_hash,
          response,
          token_estimates: entry.token_estimates,
          latency_ms: entry.latency_ms,
          cost_usd_est: entry.cost_usd_est
        };
      }
    }
  } catch (error) {
    // File doesn't exist or error reading
  }

  return null;
}

/**
 * Loads all model calls for a run.
 */
export async function loadAllModelCalls(
  taskRoot: string,
  taskId: string,
  runId: string
): Promise<ModelCallLog[]> {
  const llmDir = join(taskRoot, `task_${taskId}`, 'runs', runId, 'llm');
  const indexPath = join(llmDir, 'llm_calls.jsonl');

  try {
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const lines = indexContent.trim().split('\n').filter(l => l.length > 0);
    const calls: ModelCallLog[] = [];

    for (const line of lines) {
      const entry = JSON.parse(line);
      const requestPath = join(llmDir, `${entry.call_type}_${entry.call_index}.request.json`);
      const responsePath = join(llmDir, `${entry.call_type}_${entry.call_index}.response.json`);

      const requestPayload = JSON.parse(await fs.readFile(requestPath, 'utf8'));
      const response = JSON.parse(await fs.readFile(responsePath, 'utf8'));

      calls.push({
        timestamp_iso: entry.timestamp_iso,
        model_id: entry.model_id,
        call_type: entry.call_type,
        request_hash: entry.request_hash,
        prompt_hash: entry.request_hash,
        response_hash: entry.response_hash,
        response,
        token_estimates: entry.token_estimates,
        latency_ms: entry.latency_ms,
        cost_usd_est: entry.cost_usd_est
      });
    }

    return calls;
  } catch (error) {
    return [];
  }
}

