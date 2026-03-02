// spine/llm/openai/OpenAIClient.ts

import {
  getOpenAIApiKey,
  getOpenAIBaseUrl,
  getOpenAIModel,
} from "./OpenAIConfig";

export type GenerateTextOptions = {
  prompt: string;
  temperature?: number;
  maxOutputChars?: number; // soft bound; hard-trim after
};

export type GenerateTextResult = {
  text: string;
  model: string;
};

function hardTrim(s: string, max?: number): string {
  if (!max || max <= 0) return s;
  return s.length > max ? s.slice(0, max) : s;
}

export class OpenAIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    this.apiKey = apiKey;
    this.baseUrl = getOpenAIBaseUrl();
    this.model = getOpenAIModel();
  }

  async generateText(
    opts: GenerateTextOptions
  ): Promise<GenerateTextResult> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: opts.temperature ?? 0.3,
        messages: [
          {
            role: "user",
            content: opts.prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const text =
      json?.choices?.[0]?.message?.content ?? "";

    return {
      text: hardTrim(text, opts.maxOutputChars),
      model: this.model,
    };
  }
}




































