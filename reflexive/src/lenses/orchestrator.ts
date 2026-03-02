import { LensConfig } from '../db/queries.js';
import { renderPrompt } from './renderer.js';
import { callLLM } from './llm-client.js';
import { LLM_MAX_RETRIES, LLM_RETRY_DELAY_MS, LLM_TIMEOUT_MS, LLM_MODEL } from '../config.js';
import {
  createPerspective,
  updatePerspectiveState,
  createTrace,
} from '../db/queries.js';
import { v4 as uuidv4 } from 'uuid';

export interface LensInvocationResult {
  lens_id: string;
  lens_version: number;
  state: 'completed' | 'failed';
  raw_response: string | null;
  rendered_prompt: string;
  content_hash: string;
  model_id: string;
  model_params: Record<string, unknown>;
  token_usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latency_ms: number;
  attempts: number;
  error: string | null;
  perspective_id: string;
}

async function invokeSingleLens(
  lens: LensConfig,
  analysis_id: string,
  stimulus_text: string,
  stimulus_type: string,
  context_items: { label: string; content_text: string }[],
  analysis_date: string
): Promise<LensInvocationResult> {
  console.log('[LENS] Invoking lens', { lens: lens.name, lens_id: lens.id, analysis_id });
  const startTime = Date.now();
  let attempts = 0;
  let lastError: string | null = null;
  let rawResponse: string | null = null;
  let tokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // Create perspective
  const perspective = await createPerspective(analysis_id, lens.id, lens.version.toString());
  await updatePerspectiveState(perspective.id, 'running', undefined, new Date());

  // Render prompt
  const renderResult = renderPrompt(lens, stimulus_text, stimulus_type, context_items, analysis_date);
  console.log('[LENS] Prompt rendered', { lens: lens.name, prompt_length: renderResult.rendered_prompt.length });

  // Retry loop
  while (attempts <= LLM_MAX_RETRIES) {
    attempts++;
    try {
      console.log('[LENS] Calling LLM', { lens: lens.name, attempt: attempts });
      const response = await callLLM(renderResult.rendered_prompt, LLM_TIMEOUT_MS);
      rawResponse = response.content;
      tokenUsage = {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      };

      // Success
      await updatePerspectiveState(
        perspective.id,
        'completed',
        { raw: rawResponse },
        undefined,
        new Date()
      );

      const latency_ms = Date.now() - startTime;

      // Create trace
      await createTrace(
        perspective.id,
        lens.id,
        renderResult.rendered_prompt,
        renderResult.content_hash,
        response.model,
        { model: LLM_MODEL, max_tokens: 4096 },
        rawResponse,
        latency_ms,
        null
      );

      console.log('[LENS] Lens completed', { lens: lens.name, latency_ms, tokens: tokenUsage.total_tokens });
      return {
        lens_id: lens.id,
        lens_version: lens.version,
        state: 'completed',
        raw_response: rawResponse,
        rendered_prompt: renderResult.rendered_prompt,
        content_hash: renderResult.content_hash,
        model_id: response.model,
        model_params: { model: LLM_MODEL, max_tokens: 4096 },
        token_usage: tokenUsage,
        latency_ms,
        attempts,
        error: null,
        perspective_id: perspective.id,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error('[LENS] Lens call failed', { lens: lens.name, attempt: attempts, error: lastError });
      if (attempts <= LLM_MAX_RETRIES) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, LLM_RETRY_DELAY_MS));
      }
    }
  }

  // All retries exhausted
  console.error('[LENS] Lens failed after retries', { lens: lens.name, error: lastError });
  const latency_ms = Date.now() - startTime;
  await updatePerspectiveState(perspective.id, 'failed', undefined, undefined, new Date());

  // Create trace with error
  await createTrace(
    perspective.id,
    lens.id,
    renderResult.rendered_prompt,
    renderResult.content_hash,
    LLM_MODEL,
    { model: LLM_MODEL, max_tokens: 4096 },
    null,
    latency_ms,
    lastError || 'Unknown error'
  );

  return {
    lens_id: lens.id,
    lens_version: lens.version,
    state: 'failed',
    raw_response: null,
    rendered_prompt: renderResult.rendered_prompt,
    content_hash: renderResult.content_hash,
    model_id: LLM_MODEL,
    model_params: { model: LLM_MODEL, max_tokens: 4096 },
    token_usage: tokenUsage,
    latency_ms,
    attempts,
    error: lastError,
    perspective_id: perspective.id,
  };
}

export async function invokeLenses(
  lenses: LensConfig[],
  analysis_id: string,
  stimulus_text: string,
  stimulus_type: string,
  context_items: { label: string; content_text: string }[],
  analysis_date: string
): Promise<LensInvocationResult[]> {
  // Invoke all lenses in parallel
  const promises = lenses.map((lens) =>
    invokeSingleLens(lens, analysis_id, stimulus_text, stimulus_type, context_items, analysis_date)
  );

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Handle unexpected errors
      const lens = lenses[index];
      return {
        lens_id: lens.id,
        lens_version: lens.version,
        state: 'failed' as const,
        raw_response: null,
        rendered_prompt: '',
        content_hash: '',
        model_id: LLM_MODEL,
        model_params: {},
        token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        latency_ms: 0,
        attempts: 0,
        error: result.reason?.message || 'Unexpected error',
        perspective_id: '',
      };
    }
  });
}
