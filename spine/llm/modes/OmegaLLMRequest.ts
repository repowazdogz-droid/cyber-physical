// spine/llm/modes/OmegaLLMRequest.ts

import type { OmegaContext } from "./OmegaContext";

export interface OmegaLLMRequest {
  context: OmegaContext;
  prompt: string;
  maxOutputChars: number;
  jsonSchema?: object;
}




































