/**
 * Artifact Types
 * 
 * Types for artifact storage and retrieval.
 * Bounded, deterministic, versioned.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from '../contracts/ContractVersion';
import type { OmegaMeta } from '../llm/modes/OmegaMeta';

/**
 * ArtifactKind: Types of artifacts stored in the vault.
 */
export enum ArtifactKind {
  /** XR bundle (imported from Unity) */
  XR_BUNDLE = 'XR_BUNDLE',
  /** Session recap */
  SESSION_RECAP = 'SESSION_RECAP',
  /** Single kernel run record */
  KERNEL_RUN = 'KERNEL_RUN',
  /** Single orchestrator run record */
  ORCHESTRATOR_RUN = 'ORCHESTRATOR_RUN',
  /** Teacher recap */
  TEACHER_RECAP = 'TEACHER_RECAP',
  /** Contact inquiry */
  CONTACT_INQUIRY = 'CONTACT_INQUIRY',
  /** LLM run (explain/specDraft) */
  LLM_RUN = 'LLM_RUN',
  /** Omega mode comparison (human review) */
  OMEGA_COMPARE = 'OMEGA_COMPARE',
  /** OPLAS canonical representation */
  OPLAS_REPR = 'OPLAS_REPR',
  /** Legacy: Learning bundle (session + board + thought objects) */
  bundle = 'bundle',
  /** Legacy: Single kernel run record */
  kernelRun = 'kernelRun',
  /** Legacy: Single orchestrator run record */
  orchestratorRun = 'orchestratorRun',
  /** Legacy: Teacher access record */
  teacherAccess = 'teacherAccess',
  /** Legacy: XR pairing record */
  pairing = 'pairing',
  /** Legacy: Recap artifact */
  recap = 'recap'
}

/**
 * ArtifactMeta: Metadata for an artifact.
 * Bounded: tags max 10, sizeBytes max 512KB default.
 */
export interface ArtifactMeta {
  /** Unique artifact ID */
  id: string;
  /** Artifact kind */
  kind: ArtifactKind;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Contract version */
  contractVersion: string;
  /** Content hash (deterministic) */
  contentHash: string;
  /** Optional tags (bounded, max 10) */
  tags?: string[];
  /** Optional size in bytes */
  sizeBytes?: number;
  /** Optional TTL in seconds */
  ttlSeconds?: number;
  /** Optional: Omega mode metadata */
  omega?: OmegaMeta;
}

/**
 * ArtifactRecord: Complete artifact record with metadata and payload.
 * Bounded: payload JSON size cap (default 512KB, configurable).
 */
export interface ArtifactRecord<T = any> {
  /** Metadata */
  meta: ArtifactMeta;
  /** Payload (bounded, max 512KB JSON) */
  payload: T;
}

/**
 * ArtifactFilter: Filter options for listing artifacts.
 */
export interface ArtifactFilter {
  /** Optional: Filter by tags (all must match) */
  tags?: string[];
  /** Optional: Filter by contract version */
  contractVersion?: string;
  /** Optional: Created after this timestamp */
  createdAfter?: string;
  /** Optional: Created before this timestamp */
  createdBefore?: string;
}

/**
 * Default payload size limit (512KB).
 */
export const DEFAULT_PAYLOAD_SIZE_LIMIT = 512 * 1024;

/**
 * ArtifactFile: File metadata in artifact manifest.
 * Bounded: max 10 files per artifact.
 */
export interface ArtifactFile {
  /** File name */
  name: string;
  /** SHA-256 hash of file content */
  sha256: string;
  /** File size in bytes */
  bytes: number;
}

/**
 * ArtifactManifest: Manifest for an artifact bundle.
 * Includes integrity hashes, redactions, and metadata.
 */
export interface ArtifactManifest {
  /** Unique artifact ID */
  artifactId: string;
  /** Artifact kind */
  kind: ArtifactKind;
  /** Contract version */
  contractVersion: string;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Files in bundle (bounded, max 10) */
  files: ArtifactFile[];
  /** Root SHA-256 (hash of sorted file hashes) */
  rootSha256: string;
  /** Redactions applied (bounded, max 10) */
  redactionsApplied: string[];
  /** Optional notes (bounded, max 500 chars) */
  notes?: string;
  /** Optional tags (bounded, max 10) */
  tags?: string[];
  /** Optional: Omega mode metadata */
  omega?: OmegaMeta;
}

/**
 * ArtifactBundle: Complete artifact bundle with manifest and payloads.
 */
export interface ArtifactBundle {
  /** Manifest */
  manifest: ArtifactManifest;
  /** Payloads (keyed by file name) */
  payloads: Record<string, any>;
}

/**
 * LLMRunArtifactPayload: Payload for LLM run artifacts.
 * Bounded: prompt/output text max 2000 chars each.
 */
export interface LLMRunArtifactPayload {
  prompt: {
    /** Bounded prompt text (max 2000 chars) */
    text: string;
    /** SHA-256 hash of full prompt */
    hash: string;
  };
  output: {
    /** Bounded output text (max 2000 chars) */
    text: string;
  };
  /** LLM run kind */
  kind: "explain" | "specDraft";
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
}

