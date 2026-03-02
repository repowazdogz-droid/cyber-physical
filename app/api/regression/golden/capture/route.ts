/**
 * Golden Capture API
 * 
 * One-click capture of artifacts as golden test cases.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { captureArtifactAsGolden } from '../../../../../spine/regression/GoldenCapture';
import { getGoldenSuite } from '../../../../../spine/regression/golden/GoldenSuiteWriter';

interface CaptureRequest {
  artifactId: string;
  label?: string;
  runSuite?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CaptureRequest = await request.json();
    const { artifactId, label, runSuite = false } = body;

    if (!artifactId) {
      return NextResponse.json(
        { error: 'artifactId is required' },
        { status: 400 }
      );
    }

    // Capture artifact
    const result = await captureArtifactAsGolden({
      artifactId,
      label,
      runSuite
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.warnings[0] || 'Failed to capture artifact' },
        { status: 500 }
      );
    }

    // Get current suite count
    const suite = await getGoldenSuite();
    const goldenSuiteCount = suite.length;

    // Build response with bounded preview
    const response: {
      ok: boolean;
      added: boolean;
      goldenSuiteCount: number;
      warnings?: string[];
      suite?: {
        criticalCount: number;
        warnCount: number;
        totalCases: number;
        passedCases: number;
        failedCases: number;
        resultsPreview: Array<{
          artifactId: string;
          label: string;
          ok: boolean;
          findingsCount: number;
        }>;
      };
    } = {
      ok: true,
      added: result.added,
      goldenSuiteCount,
      warnings: result.warnings.length > 0 ? result.warnings : undefined
    };

    // Add suite result if requested
    if (result.suiteResult) {
      // Get results preview (bounded: max 5 cases, max 10 findings total)
      const suite = await getGoldenSuite();
      const { runGoldenSuite } = await import('../../../../../spine/regression/GoldenHarness');
      const suiteResult = await runGoldenSuite(suite);

      const resultsPreview = suiteResult.results.slice(0, 5).map(r => ({
        artifactId: r.artifactId,
        label: r.label,
        ok: r.ok,
        findingsCount: r.findings.length
      }));

      response.suite = {
        ...result.suiteResult,
        resultsPreview
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to capture artifact as golden:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture artifact as golden' },
      { status: 500 }
    );
  }
}








































