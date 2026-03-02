// spine/artifacts/__tests__/artifact_omega_meta.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { putArtifact, getArtifact } from "../ArtifactVault";
import { ArtifactKind } from "../ArtifactTypes";
import { FsArtifactVault } from "../FsArtifactVault";
import { setVaultInstance } from "../ArtifactVault";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { OmegaMeta } from "../../llm/modes/OmegaMeta";

describe("Artifact omegaMeta persistence", () => {
  let vaultRoot: string;
  let vault: FsArtifactVault;

  beforeEach(async () => {
    vaultRoot = await mkdtemp(join(tmpdir(), "artifact-omega-test-"));
    vault = new FsArtifactVault(512 * 1024, vaultRoot);
    setVaultInstance(vault);
  });

  afterEach(async () => {
    await rm(vaultRoot, { recursive: true, force: true });
  });

  it("preserves omegaMeta through put/get round-trip", async () => {
    const omegaMeta: OmegaMeta = {
      mode: "v37",
      audit: {
        ok: true,
        violations: [],
      },
      retry: {
        attempted: false,
        repaired: false,
      },
    };

    const payloads = {
      meta: { contractVersion: "1.0.0" },
      testData: { foo: "bar" },
    };

    const result = await putArtifact(ArtifactKind.CONTACT_INQUIRY, payloads, {
      artifactId: "test-omega-1",
      omega: omegaMeta,
    });

    expect(result.manifest.omega).toBeDefined();
    expect(result.manifest.omega?.mode).toBe("v37");
    expect(result.manifest.omega?.audit?.ok).toBe(true);
    expect(result.manifest.omega?.retry?.attempted).toBe(false);

    // Retrieve and verify
    const retrieved = await getArtifact(result.artifactId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.manifest.omega).toBeDefined();
    expect(retrieved?.manifest.omega?.mode).toBe("v37");
    expect(retrieved?.manifest.omega?.audit?.ok).toBe(true);
    expect(retrieved?.manifest.omega?.retry?.attempted).toBe(false);
  });

  it("preserves omegaMeta from payloads.meta.omega", async () => {
    const omegaMeta: OmegaMeta = {
      mode: "G",
      audit: {
        ok: true,
        violations: [],
      },
      retry: {
        attempted: true,
        repaired: true,
      },
    };

    const payloads = {
      meta: {
        contractVersion: "1.0.0",
        omega: omegaMeta,
      },
      testData: { foo: "bar" },
    };

    const result = await putArtifact(ArtifactKind.CONTACT_INQUIRY, payloads, {
      artifactId: "test-omega-2",
    });

    expect(result.manifest.omega).toBeDefined();
    expect(result.manifest.omega?.mode).toBe("G");
    expect(result.manifest.omega?.retry?.repaired).toBe(true);

    // Retrieve and verify
    const retrieved = await getArtifact(result.artifactId);
    expect(retrieved?.manifest.omega?.mode).toBe("G");
    expect(retrieved?.manifest.omega?.retry?.repaired).toBe(true);
  });

  it("meta.omega takes precedence over payloads.meta.omega", async () => {
    const payloadOmega: OmegaMeta = {
      mode: "V",
      audit: { ok: false, violations: ["AUTONOMY_SIGNAL"] },
    };

    const metaOmega: OmegaMeta = {
      mode: "B",
      audit: { ok: true, violations: [] },
    };

    const payloads = {
      meta: {
        contractVersion: "1.0.0",
        omega: payloadOmega,
      },
      testData: { foo: "bar" },
    };

    const result = await putArtifact(ArtifactKind.CONTACT_INQUIRY, payloads, {
      artifactId: "test-omega-3",
      omega: metaOmega,
    });

    // meta.omega should win
    expect(result.manifest.omega?.mode).toBe("B");
    expect(result.manifest.omega?.audit?.ok).toBe(true);
  });
});




































