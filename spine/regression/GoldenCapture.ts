/**
 * Golden Capture Service
 * 
 * One-click capture of artifacts as golden test cases.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

import { getArtifact } from '../artifacts/ArtifactVault';
import { ArtifactKind } from '../artifacts/ArtifactTypes';
import { addGoldenCase, getGoldenSuite } from './golden/GoldenSuiteWriter';
import { runGoldenCase } from './GoldenHarness';
import { Summary } from './RegressionTypes';
import { summarizeKernelRun, summarizeOrchestratorRun, summarizeRecap } from './Summarizers';

/**
 * Maximum label length.
 */
const MAX_LABEL_LENGTH = 60;

/**
 * Maximum warnings.
 */
const MAX_WARNINGS = 10;

/**
 * Capture result.
 */
export interface CaptureResult {
  /** Whether capture succeeded */
  ok: boolean;
  /** Whether artifact was added (false if duplicate) */
  added: boolean;
  /** Warnings (bounded, max 10) */
  warnings: string[];
  /** Suite result if runSuite was true */
  suiteResult?: {
    criticalCount: number;
    warnCount: number;
    totalCases: number;
    passedCases: number;
    failedCases: number;
  };
}

/**
 * Captures an artifact as a golden test case.
 * 
 * @param options - Capture options
 * @returns Capture result
 */
export async function captureArtifactAsGolden(options: {
  artifactId: string;
  label?: string;
  runSuite?: boolean;
}): Promise<CaptureResult> {
  const { artifactId, label, runSuite = false } = options;
  const warnings: string[] = [];

  // Check for duplicate FIRST (before artifact lookup to avoid unnecessary work)
  // Dedupe by artifactId, NOT label
  const existingSuite = await getGoldenSuite();
  const isDuplicate = existingSuite.some(c => c.artifactId === artifactId);
  if (isDuplicate) {
    return {
      ok: true,
      added: false,
      warnings: [`Artifact ${artifactId} already in golden suite`]
    };
  }

  // Validate artifact exists (only if not duplicate)
  const artifact = await getArtifact(artifactId);
  if (!artifact) {
    return {
      ok: false,
      added: false,
      warnings: [`Artifact ${artifactId} not found in vault`]
    };
  }

  // Generate default label if not provided
  let finalLabel = label;
  if (!finalLabel) {
    finalLabel = generateDefaultLabel(artifact.manifest.kind, artifactId);
  }

  // Bound label BEFORE adding to suite
  if (finalLabel.length > MAX_LABEL_LENGTH) {
    finalLabel = finalLabel.substring(0, MAX_LABEL_LENGTH - 3) + '...';
    warnings.push(`Label truncated to ${MAX_LABEL_LENGTH} chars`);
  }

  // Summarize artifact to get expected summary
  let expected: Summary;
  try {
    if (artifact.manifest.kind === ArtifactKind.KERNEL_RUN) {
      const runPayload = artifact.payloads.run || artifact.payloads;
      if (!runPayload || !runPayload.decision) {
        return {
          ok: false,
          added: false,
          warnings: ['Invalid kernel run artifact']
        };
      }
      expected = summarizeKernelRun(runPayload);
    } else if (artifact.manifest.kind === ArtifactKind.ORCHESTRATOR_RUN) {
      const runPayload = artifact.payloads.orchestratorRun || artifact.payloads;
      if (!runPayload || !runPayload.graphId) {
        return {
          ok: false,
          added: false,
          warnings: ['Invalid orchestrator run artifact']
        };
      }
      expected = summarizeOrchestratorRun(runPayload);
    } else if (artifact.manifest.kind === ArtifactKind.XR_BUNDLE || artifact.manifest.kind === ArtifactKind.SESSION_RECAP) {
      expected = summarizeRecap(artifact);
    } else {
      return {
        ok: false,
        added: false,
        warnings: [`Unsupported artifact kind: ${artifact.manifest.kind}`]
      };
    }
  } catch (error: any) {
    return {
      ok: false,
      added: false,
      warnings: [`Failed to summarize artifact: ${error.message || 'Unknown error'}`]
    };
  }

  // Add to golden suite
  const addResult = await addGoldenCase({
    artifactId,
    label: finalLabel,
    expected,
    skip: false
  });

  // If addResult.ok is false, it means duplicate (we already checked above, but addGoldenCase also checks)
  if (!addResult.ok) {
    // This should only happen if there's a race condition, but handle gracefully
    return {
      ok: true,
      added: false,
      warnings: [addResult.message || `Artifact ${artifactId} already in golden suite`]
    };
  }

  // Optionally run suite
  let suiteResult: CaptureResult['suiteResult'] | undefined;
  if (runSuite) {
    try {
      const cases = await getGoldenSuite();
      const { runGoldenSuite } = await import('./GoldenHarness');
      const result = await runGoldenSuite(cases);
      
      suiteResult = {
        criticalCount: result.criticalCount,
        warnCount: result.warnCount,
        totalCases: result.totalCases,
        passedCases: result.passedCases,
        failedCases: result.failedCases
      };
    } catch (error: any) {
      warnings.push(`Failed to run suite: ${error.message || 'Unknown error'}`);
    }
  }

  // Bound warnings
  const boundedWarnings = warnings.slice(0, MAX_WARNINGS);

  return {
    ok: true,
    added: true,
    warnings: boundedWarnings,
    suiteResult
  };
}

/**
 * Generates a deterministic default label based on artifact kind and ID.
 * Uses last 6-8 chars of artifactId as suffix (no timestamps or random).
 */
function generateDefaultLabel(kind: ArtifactKind, artifactId: string): string {
  // Use short suffix of artifactId (last 6-8 chars, deterministic)
  const suffixLength = Math.min(8, Math.max(6, artifactId.length));
  const shortId = artifactId.length > suffixLength 
    ? artifactId.substring(artifactId.length - suffixLength) 
    : artifactId;
  
  // Map kind to prefix
  const kindPrefix: Partial<Record<ArtifactKind, string>> = {
    [ArtifactKind.XR_BUNDLE]: 'XR Bundle',
    [ArtifactKind.SESSION_RECAP]: 'Session Recap',
    [ArtifactKind.KERNEL_RUN]: 'Kernel Run',
    [ArtifactKind.ORCHESTRATOR_RUN]: 'Orchestrator Run',
    [ArtifactKind.TEACHER_RECAP]: 'Teacher Recap',
    [ArtifactKind.CONTACT_INQUIRY]: 'Contact Inquiry',
    [ArtifactKind.bundle]: 'Bundle',
    [ArtifactKind.kernelRun]: 'Kernel Run',
    [ArtifactKind.orchestratorRun]: 'Orchestrator Run',
    [ArtifactKind.teacherAccess]: 'Teacher Access',
    [ArtifactKind.pairing]: 'Pairing',
    [ArtifactKind.recap]: 'Recap'
  };

  const prefix = kindPrefix[kind] || 'Artifact';
  const fullLabel = `${prefix}:${shortId}`;
  
  // Ensure it's within bounds (truncate to 60 if needed)
  if (fullLabel.length > MAX_LABEL_LENGTH) {
    return fullLabel.substring(0, MAX_LABEL_LENGTH - 3) + '...';
  }
  
  return fullLabel;
}

