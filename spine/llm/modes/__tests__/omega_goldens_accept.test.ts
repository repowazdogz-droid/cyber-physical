// spine/llm/modes/__tests__/omega_goldens_accept.test.ts

import { describe, it, expect } from "vitest";
import { OMEGA_GOLDENS_V1 } from "../omega_goldens_v1";
import { runAllOmegaGoldens } from "../OmegaGoldenRunner";
import { saveGoldenSnapshot } from "../OmegaGoldenSnapshot";

const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
const ACCEPT_ENABLED = process.env.OMEGA_GOLDENS_ACCEPT === "1";

describe("Omega Goldens — Accept Snapshot", () => {
  it.skipIf(!hasKey || !ACCEPT_ENABLED)(
    "regenerate golden snapshots",
    async () => {
      if (!ACCEPT_ENABLED) {
        throw new Error(
          "OMEGA_GOLDENS_ACCEPT=1 must be set to regenerate snapshots"
        );
      }

      const results = await runAllOmegaGoldens(OMEGA_GOLDENS_V1);
      await saveGoldenSnapshot(results);

      expect(results.length).toBe(OMEGA_GOLDENS_V1.length);
      expect(results.every((r) => r.audit.ok)).toBe(true);
    },
    120000
  );
});




































