/**
 * Golden Harness
 * 
 * Runs golden test cases against artifacts.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

import { getArtifact } from '../artifacts/ArtifactVault';
import { ArtifactKind, ArtifactBundle } from '../artifacts/ArtifactTypes';
import { GoldenCase, ReplayResultSummary, GoldenSuiteResult } from './RegressionTypes';
import { summarizeKernelRun, summarizeOrchestratorRun, summarizeRecap } from './Summarizers';
import { diffSummaries } from './DiffEngine';
import { getGoldenSuite } from './golden/GoldenSuiteWriter';

/**
 * Runs a single golden case.
 */
export async function runGoldenCase(case_: GoldenCase): Promise<ReplayResultSummary> {
  try {
    // Load artifact
    const bundle = await getArtifact(case_.artifactId);

    if (!bundle) {
      return {
        artifactId: case_.artifactId,
        label: case_.label,
        ok: false,
        findings: [],
        error: 'Artifact not found'
      };
    }

    // Determine artifact kind and summarize
    let actual: any;
    const manifest = bundle.manifest;

    if (manifest.kind === ArtifactKind.KERNEL_RUN) {
      // Extract kernel run from payloads
      const runPayload = bundle.payloads.run || bundle.payloads;
      if (!runPayload || !runPayload.decision) {
        return {
          artifactId: case_.artifactId,
          label: case_.label,
          ok: false,
          findings: [],
          error: 'Invalid kernel run artifact'
        };
      }
      actual = summarizeKernelRun(runPayload);
    } else if (manifest.kind === ArtifactKind.ORCHESTRATOR_RUN) {
      // Extract orchestrator run from payloads
      const runPayload = bundle.payloads.orchestratorRun || bundle.payloads;
      if (!runPayload || !runPayload.graphId) {
        return {
          artifactId: case_.artifactId,
          label: case_.label,
          ok: false,
          findings: [],
          error: 'Invalid orchestrator run artifact'
        };
      }
      actual = summarizeOrchestratorRun(runPayload);
    } else if (manifest.kind === ArtifactKind.XR_BUNDLE || manifest.kind === ArtifactKind.SESSION_RECAP) {
      // Summarize recap
      actual = summarizeRecap(bundle);
    } else {
      return {
        artifactId: case_.artifactId,
        label: case_.label,
        ok: false,
        findings: [],
        error: `Unsupported artifact kind: ${manifest.kind}`
      };
    }

    // Diff against expected
    const findings = diffSummaries(case_.expected, actual);

    return {
      artifactId: case_.artifactId,
      label: case_.label,
      ok: findings.filter(f => f.severity === 'critical').length === 0,
      actual,
      findings
    };
  } catch (error: any) {
    return {
      artifactId: case_.artifactId,
      label: case_.label,
      ok: false,
      findings: [],
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Runs a golden suite.
 */
export async function runGoldenSuite(cases: GoldenCase[]): Promise<GoldenSuiteResult> {
  const results: ReplayResultSummary[] = [];

  // Run all cases (skip if marked)
  for (const case_ of cases) {
    if (case_.skip) {
      continue;
    }

    const result = await runGoldenCase(case_);
    results.push(result);
  }

  // Calculate totals
  const totalCases = results.length;
  const passedCases = results.filter(r => r.ok).length;
  const failedCases = totalCases - passedCases;
  const criticalCount = results.reduce((sum, r) => sum + r.findings.filter(f => f.severity === 'critical').length, 0);
  const warnCount = results.reduce((sum, r) => sum + r.findings.filter(f => f.severity === 'warn').length, 0);
  const infoCount = results.reduce((sum, r) => sum + r.findings.filter(f => f.severity === 'info').length, 0);

  return {
    ok: criticalCount === 0,
    totalCases,
    passedCases,
    failedCases,
    criticalCount,
    warnCount,
    infoCount,
    results: results.slice(0, 50) // Bound results
  };
}

