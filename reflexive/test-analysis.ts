#!/usr/bin/env tsx
/**
 * Test script to run a single analysis and see diagnostic logs
 */

import { runAnalysisForApi } from './src/api/orchestrator.js';
import type { CreateAnalysisRequest } from './src/api/types.js';

const testStimulus: CreateAnalysisRequest = {
  stimulus: {
    text: 'Should we invest in expanding our product line to include enterprise features?',
    type: 'decision' as const,
  },
  options: {
    dry_run: false,
    save: true,
  },
};

async function main() {
  console.log('=== TEST ANALYSIS ===');
  console.log('Stimulus:', testStimulus.stimulus.text);
  console.log('Type:', testStimulus.stimulus.type);
  console.log('');

  try {
    // Create a test analysis ID
    const analysisId = `test-${Date.now()}`;
    console.log('Analysis ID:', analysisId);
    console.log('');

    const result = await runAnalysisForApi(testStimulus, analysisId);
    
    console.log('');
    console.log('=== RESULTS ===');
    console.log('Lens results:', result.lensResults.length);
    console.log('Claims:', result.claims.length);
    console.log('Engine output:', result.engineOutput ? 'present' : 'null');
    console.log('Warnings:', result.warnings.length);
    
    if (result.warnings.length > 0) {
      console.log('Warnings:', result.warnings);
    }
    
    if (result.lensResults.length > 0) {
      console.log('');
      console.log('Lens results details:');
      result.lensResults.forEach((lr, i) => {
        console.log(`  ${i + 1}. ${lr.lens}: ${lr.status} (${lr.duration_ms}ms)`);
        if (lr.error) {
          console.log(`     Error: ${lr.error.message}`);
        }
      });
    }
    
    if (result.claims.length > 0) {
      console.log('');
      console.log('Sample claims:');
      result.claims.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.statement.substring(0, 80)}...`);
      });
    }
    
  } catch (error) {
    console.error('');
    console.error('=== ERROR ===');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
