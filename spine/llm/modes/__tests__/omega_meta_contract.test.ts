// spine/llm/modes/__tests__/omega_meta_contract.test.ts

import { describe, expect, it } from "vitest";
import { generateText } from "../../LLMRouter";

describe("OmegaMeta contract", () => {
  it.skipIf(!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY)(
    "when omegaMode is used, omegaMeta is present and audit.ok is true (or repaired)",
    async () => {
      const res = await generateText({
        user: "Write a persuasive sales email to convince someone to buy this product.",
        maxOutputChars: 400,
        omega: { mode: "G" },
      });

      expect(res.omegaMeta).toBeTruthy();
      expect(res.omegaMeta?.mode).toBe("G");

      // For G: audit must be ok after the one-shot repair mechanism
      expect(res.omegaMeta?.audit?.ok).toBe(true);
    },
    60_000
  );
});




































