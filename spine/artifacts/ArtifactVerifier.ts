/**
 * Artifact Verifier
 * 
 * Verifies artifact bundles: schema, bounds, integrity, redaction.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

import { ArtifactKind, ArtifactManifest, ArtifactBundle } from './ArtifactTypes';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';
import { isKernelDecisionContract, isThoughtObjectContract } from '../contracts/ContractGuards';
import { applyRedactions, RedactionResult } from './Redaction';
import { hashManifestRoot, sha256Bytes } from './Hashing';
import {
  MAX_EVENTS,
  MAX_THOUGHT_OBJECTS,
  MAX_TRACE_NODES,
  MAX_CLAIMS,
  MAX_POLICY_NOTES,
  MAX_FILES
} from './ArtifactBounds';

/**
 * Verification error.
 */
export interface VerificationError {
  /** Error code */
  code: string;
  /** Human-readable message (max 200 chars) */
  message: string;
}

/**
 * Verification warning.
 */
export interface VerificationWarning {
  /** Warning code */
  code: string;
  /** Human-readable message (max 200 chars) */
  message: string;
}

/**
 * Verification result.
 */
export interface VerificationResult {
  /** Whether verification passed */
  ok: boolean;
  /** Generated manifest */
  manifest?: ArtifactManifest;
  /** Errors (bounded) */
  errors: VerificationError[];
  /** Warnings (bounded) */
  warnings: VerificationWarning[];
}

/**
 * Verifies an artifact bundle.
 */
export function verifyArtifactBundle(
  kind: ArtifactKind,
  payloads: Record<string, any>,
  meta?: {
    artifactId?: string;
    learnerId?: string;
    sessionId?: string;
    isMinor?: boolean;
  }
): VerificationResult {
  const errors: VerificationError[] = [];
  const warnings: VerificationWarning[] = [];

  // Step 1: Contract version present
  const contractVersion = payloads.meta?.contractVersion || payloads.contractVersion;
  if (!contractVersion) {
    errors.push({
      code: 'MISSING_CONTRACT_VERSION',
      message: 'Contract version is required'
    });
    return { ok: false, errors, warnings };
  }

  // Step 2: Schema-shape checks (lightweight structural guards)
  try {
    if (kind === ArtifactKind.KERNEL_RUN || kind === ArtifactKind.ORCHESTRATOR_RUN) {
      if (payloads.decision && !isKernelDecisionContract(payloads.decision)) {
        warnings.push({
          code: 'INVALID_DECISION_SCHEMA',
          message: 'Decision does not match KernelDecisionContract schema'
        });
      }
    }

    if (payloads.thoughtObjects && Array.isArray(payloads.thoughtObjects)) {
      for (const obj of payloads.thoughtObjects.slice(0, 5)) { // Check first 5
        if (!isThoughtObjectContract(obj)) {
          warnings.push({
            code: 'INVALID_THOUGHT_OBJECT_SCHEMA',
            message: 'Some thought objects do not match ThoughtObjectContract schema'
          });
          break;
        }
      }
    }
  } catch (err: any) {
    warnings.push({
      code: 'SCHEMA_CHECK_ERROR',
      message: `Schema check failed: ${err.message}`
    });
  }

  // Step 3: Bounds enforcement (truncate safely + warnings)
  const boundsChecks: Record<string, { actual: number; max: number }> = {};

  if (payloads.events && Array.isArray(payloads.events)) {
    if (payloads.events.length > MAX_EVENTS) {
      boundsChecks.events = { actual: payloads.events.length, max: MAX_EVENTS };
      warnings.push({
        code: 'EVENTS_EXCEED_BOUND',
        message: `Events count (${payloads.events.length}) exceeds bound (${MAX_EVENTS}), will be truncated`
      });
    }
  }

  if (payloads.thoughtObjects && Array.isArray(payloads.thoughtObjects)) {
    if (payloads.thoughtObjects.length > MAX_THOUGHT_OBJECTS) {
      boundsChecks.thoughtObjects = { actual: payloads.thoughtObjects.length, max: MAX_THOUGHT_OBJECTS };
      warnings.push({
        code: 'THOUGHT_OBJECTS_EXCEED_BOUND',
        message: `Thought objects count (${payloads.thoughtObjects.length}) exceeds bound (${MAX_THOUGHT_OBJECTS}), will be truncated`
      });
    }
  }

  if (payloads.trace?.nodes && Array.isArray(payloads.trace.nodes)) {
    if (payloads.trace.nodes.length > MAX_TRACE_NODES) {
      boundsChecks.traceNodes = { actual: payloads.trace.nodes.length, max: MAX_TRACE_NODES };
      warnings.push({
        code: 'TRACE_NODES_EXCEED_BOUND',
        message: `Trace nodes count (${payloads.trace.nodes.length}) exceeds bound (${MAX_TRACE_NODES}), will be truncated`
      });
    }
  }

  // Step 4: Redaction (apply filters)
  const redactionResult = applyRedactions(kind, payloads, {
    learnerId: meta?.learnerId,
    sessionId: meta?.sessionId,
    isMinor: meta?.isMinor
  });

  // Step 5: Hash manifest
  const artifactId = meta?.artifactId || `artifact_${Date.now()}`;
  const files: Array<{ name: string; sha256: string; bytes: number }> = [];

  // Hash each payload file
  for (const [name, payload] of Object.entries(redactionResult.payload)) {
    if (payload === null || payload === undefined) continue;
    
    const jsonString = JSON.stringify(payload);
    const bytes = Buffer.byteLength(jsonString, 'utf8');
    const sha256 = sha256Bytes(Buffer.from(jsonString, 'utf8'));
    
    files.push({ name, sha256, bytes });
  }

  // Bound files
  if (files.length > MAX_FILES) {
    warnings.push({
      code: 'FILES_EXCEED_BOUND',
      message: `Files count (${files.length}) exceeds bound (${MAX_FILES}), will be truncated`
    });
    files.splice(MAX_FILES);
  }

  // Sort files by name for stable root hash
  files.sort((a, b) => a.name.localeCompare(b.name));

  const rootSha256 = hashManifestRoot(files);

  // Preserve omega from payloads.meta if present
  const omegaMeta = payloads.meta?.omega;

  const manifest: ArtifactManifest = {
    artifactId,
    kind,
    contractVersion,
    createdAtIso: new Date().toISOString(),
    files,
    rootSha256,
    redactionsApplied: redactionResult.redactionsApplied,
    // Add tags if learnerId provided
    ...(meta?.learnerId ? { tags: [meta.learnerId] } : {}),
    // Preserve omega if present
    ...(omegaMeta ? { omega: omegaMeta } : {})
  };

  return {
    ok: errors.length === 0,
    manifest,
    errors: errors.slice(0, 10), // Bound errors
    warnings: warnings.slice(0, 20) // Bound warnings
  };
}




