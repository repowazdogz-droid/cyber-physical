/**
 * Artifact Vault
 * 
 * Unified artifact storage with manifest generation and verification.
 * Builds on FsArtifactVault from FOUNDATION-05.
 * 
 * Version: 1.0.0
 */

import { FsArtifactVault } from './FsArtifactVault';
import { ArtifactKind, ArtifactManifest, ArtifactBundle } from './ArtifactTypes';
import { verifyArtifactBundle } from './ArtifactVerifier';
import { hashString } from './Hashing';
import type { OmegaMeta } from '../llm/modes/OmegaMeta';

let vault = new FsArtifactVault();

/**
 * Sets the vault instance (for testing isolation).
 * @internal
 */
export function setVaultInstance(vaultInstance: FsArtifactVault): void {
  vault = vaultInstance;
}

/**
 * Puts an artifact into the vault with verification.
 */
export async function putArtifact(
  kind: ArtifactKind,
  payloads: Record<string, any>,
  meta?: {
    artifactId?: string;
    learnerId?: string;
    sessionId?: string;
    isMinor?: boolean;
    notes?: string;
    omega?: OmegaMeta;
  }
): Promise<{ artifactId: string; manifest: ArtifactManifest; errors: any[]; warnings: any[] }> {
  // Verify artifact bundle
  const verification = verifyArtifactBundle(kind, payloads, {
    artifactId: meta?.artifactId,
    learnerId: meta?.learnerId,
    sessionId: meta?.sessionId,
    isMinor: meta?.isMinor
  });

  if (!verification.ok || !verification.manifest) {
    throw new Error(`Artifact verification failed: ${verification.errors.map(e => e.message).join(', ')}`);
  }

  const manifest = verification.manifest;
  if (meta?.notes) {
    manifest.notes = meta.notes.substring(0, 500); // Bound notes
  }

  // Attach omegaMeta if provided (takes precedence over payloads.meta.omega)
  if (meta?.omega) {
    manifest.omega = meta.omega;
  }

  // Store artifact bundle
  const bundle: ArtifactBundle = {
    manifest,
    payloads: payloads // Already redacted by verifier
  };

  // Store learnerId in manifest tags if provided
  if (meta?.learnerId && !manifest.tags) {
    manifest.tags = [meta.learnerId];
  } else if (meta?.learnerId && manifest.tags) {
    manifest.tags = [...manifest.tags, meta.learnerId].slice(0, 10); // Bound to 10
  }

  await vault.put(kind, manifest.artifactId, bundle, {
    tags: manifest.tags
  });

  return {
    artifactId: manifest.artifactId,
    manifest,
    errors: verification.errors,
    warnings: verification.warnings
  };
}

/**
 * Gets an artifact from the vault.
 */
export async function getArtifact(artifactId: string): Promise<ArtifactBundle | undefined> {
  // Try all artifact kinds
  const kinds = [
    ArtifactKind.XR_BUNDLE,
    ArtifactKind.SESSION_RECAP,
    ArtifactKind.KERNEL_RUN,
    ArtifactKind.ORCHESTRATOR_RUN,
    ArtifactKind.TEACHER_RECAP,
    ArtifactKind.CONTACT_INQUIRY,
    ArtifactKind.LLM_RUN,
    ArtifactKind.OMEGA_COMPARE
  ];

  for (const kind of kinds) {
    const record = await vault.get<ArtifactBundle>(kind, artifactId);
    if (record && record.payload) {
      // record.payload is already ArtifactBundle (from putArtifact)
      return record.payload as ArtifactBundle;
    }
  }

  return undefined;
}

/**
 * Lists artifacts with filters.
 */
export async function listArtifacts(filters?: {
  learnerId?: string;
  kind?: ArtifactKind;
  limit?: number;
}): Promise<ArtifactManifest[]> {
  const limit = filters?.limit || 50;
  const kind = filters?.kind;

  if (kind) {
    const metas = await vault.list(kind, filters?.learnerId ? { tags: [filters.learnerId] } : undefined);
    const manifests: ArtifactManifest[] = [];
    
    for (const meta of metas.slice(0, limit)) {
      const record = await vault.get<ArtifactBundle>(kind, meta.id);
      if (record && record.payload && typeof record.payload === 'object' && 'manifest' in record.payload) {
        const bundle = record.payload as ArtifactBundle;
        if (bundle.manifest) {
          // If filtering by learnerId, ensure manifest matches (check tags)
          if (filters?.learnerId) {
            const manifestLearnerId = bundle.manifest.tags?.find(t => t === filters.learnerId);
            if (!manifestLearnerId) {
              continue; // Skip if learnerId doesn't match
            }
          }
          manifests.push(bundle.manifest);
        }
      }
    }
    
    return manifests;
  }

  // List across all kinds
  const allManifests: ArtifactManifest[] = [];
  const kinds = [
    ArtifactKind.XR_BUNDLE,
    ArtifactKind.SESSION_RECAP,
    ArtifactKind.KERNEL_RUN,
    ArtifactKind.ORCHESTRATOR_RUN,
    ArtifactKind.TEACHER_RECAP,
    ArtifactKind.CONTACT_INQUIRY,
    ArtifactKind.LLM_RUN,
    ArtifactKind.OMEGA_COMPARE
  ];

  for (const k of kinds) {
    const metas = await vault.list(k, filters?.learnerId ? { tags: [filters.learnerId] } : undefined);
    for (const meta of metas) { // Don't bound here, bound at the end
      const record = await vault.get<ArtifactBundle>(k, meta.id);
      if (record && record.payload && typeof record.payload === 'object' && 'manifest' in record.payload) {
        const bundle = record.payload as ArtifactBundle;
        if (bundle.manifest) {
          // If filtering by learnerId, ensure manifest tags contain it
          if (filters?.learnerId) {
            const hasLearnerId = bundle.manifest.tags?.includes(filters.learnerId);
            if (!hasLearnerId) {
              continue; // Skip if learnerId doesn't match
            }
          }
          allManifests.push(bundle.manifest);
        }
      }
    }
  }

  // Sort by createdAtIso (newest first) and THEN limit (strict slice)
  allManifests.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  return allManifests.slice(0, limit); // Strict slice(0, limit), not <= limit
}

/**
 * Lists artifacts by kind (convenience wrapper).
 */
export async function listArtifactsByKind(kind: ArtifactKind, limit?: number): Promise<ArtifactManifest[]> {
  return listArtifacts({ kind, limit: limit || 50 });
}

