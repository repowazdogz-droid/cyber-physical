/**
 * Golden Suite API
 * 
 * Runs golden suite and returns results.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { runGoldenSuite } from '../../../../spine/regression/GoldenHarness';
import { getGoldenSuite } from '../../../../spine/regression/golden/GoldenSuiteWriter';

export async function GET(request: NextRequest) {
  try {
    const cases = await getGoldenSuite();
    const result = await runGoldenSuite(cases);

    return NextResponse.json({
      ok: result.ok,
      totals: {
        totalCases: result.totalCases,
        passedCases: result.passedCases,
        failedCases: result.failedCases
      },
      criticalCount: result.criticalCount,
      warnCount: result.warnCount,
      infoCount: result.infoCount,
      results: result.results.slice(0, 20) // Bound for API response
    });
  } catch (error: any) {
    console.error('Failed to run golden suite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run golden suite' },
      { status: 500 }
    );
  }
}

