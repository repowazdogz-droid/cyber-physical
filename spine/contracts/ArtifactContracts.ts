/**
 * Artifact Contracts
 * 
 * Interfaces for session artifacts, replay artifacts, and export bundles.
 * Artifacts are immutable once written.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';
import { KernelRunContract } from './KernelContracts';

/**
 * SessionArtifactContract: Artifact from a learning session.
 * Immutable record of session activity.
 */
export interface SessionArtifactContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Session ID */
  sessionId: string;
  /** Learner ID */
  learnerId: string;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Kernel runs (bounded, max 50) */
  kernelRuns: KernelRunContract[];
  /** Session metadata (optional, bounded, max 20 keys) */
  metadata?: Record<string, string | number | boolean>;
  /** Source kernel IDs (all kernels that contributed) */
  sourceKernelIds: string[];
  /** Source adapter IDs (all adapters that contributed) */
  sourceAdapterIds: string[];
}

/**
 * ReplayArtifactContract: Artifact for replaying a session.
 * Deterministic replay of decision process.
 */
export interface ReplayArtifactContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Session ID being replayed */
  sessionId: string;
  /** Learner ID */
  learnerId: string;
  /** Replay timestamp (ISO string) */
  replayedAtIso: string;
  /** Kernel runs in replay order (bounded, max 50) */
  kernelRuns: KernelRunContract[];
  /** Replay metadata (optional, bounded, max 10 keys) */
  metadata?: Record<string, string | number | boolean>;
  /** Source kernel IDs */
  sourceKernelIds: string[];
  /** Source adapter IDs */
  sourceAdapterIds: string[];
}

/**
 * ExportBundleContract: Complete export bundle.
 * Includes session artifacts, replay artifacts, and metadata.
 */
export interface ExportBundleContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Bundle ID (deterministic hash) */
  bundleId: string;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Session artifacts (bounded, max 10) */
  sessionArtifacts: SessionArtifactContract[];
  /** Replay artifacts (bounded, max 10) */
  replayArtifacts: ReplayArtifactContract[];
  /** Bundle metadata (optional, bounded, max 20 keys) */
  metadata?: Record<string, string | number | boolean>;
  /** All source kernel IDs (union of all artifacts) */
  sourceKernelIds: string[];
  /** All source adapter IDs (union of all artifacts) */
  sourceAdapterIds: string[];
}








































