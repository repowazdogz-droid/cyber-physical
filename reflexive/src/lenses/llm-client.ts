import { LLM_API_BASE_URL, LLM_API_KEY, LLM_MODEL, LLM_TIMEOUT_MS } from '../config.js';

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function callLLM(
  system_prompt: string,
  timeout_ms: number = LLM_TIMEOUT_MS
): Promise<LLMResponse> {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not set. Please set it in .env.local');
  }
  console.log('[LLM] Calling API', { base_url: LLM_API_BASE_URL, model: LLM_MODEL, has_key: !!LLM_API_KEY });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout_ms);

  try {
    const url = `${LLM_API_BASE_URL}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: system_prompt,
          },
          {
            role: 'user',
            content: 'Produce your analysis now as a single JSON object.',
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LLM] API error', { status: response.status, error: errorText.substring(0, 200) });
      throw new Error(`LLM API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content || '';
    const usage = {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
    };

    if (!content) {
      const finishReason = data.choices?.[0]?.finish_reason;
      throw new Error(`LLM returned empty content. finishReason: ${finishReason}`);
    }

    return {
      content,
      model: data.model || LLM_MODEL,
      usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LLM call timed out');
    }
    throw error;
  }
}
