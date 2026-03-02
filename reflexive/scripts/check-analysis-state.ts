#!/usr/bin/env tsx
/**
 * Diagnostic script to check analysis state
 */

import { query } from '../src/db/client.js';

const ANALYSIS_ID = '54afd6cc-dc4f-4e6a-a2af-d5c98e44bd97';

async function checkAnalysisState() {
  try {
    console.log(`\n=== Checking Analysis: ${ANALYSIS_ID} ===\n`);

    // Load the analysis
    const result = await query(
      `SELECT analysis_id, created_at, request_json, response_json, status, duration_ms
       FROM api_analyses
       WHERE analysis_id = $1`,
      [ANALYSIS_ID]
    );

    if (result.rows.length === 0) {
      console.log('❌ Analysis not found in database');
      return;
    }

    const row = result.rows[0];
    console.log('✅ Analysis found');
    console.log(`   Created: ${row.created_at}`);
    console.log(`   Status: ${row.status}`);
    console.log(`   Duration: ${row.duration_ms}ms\n`);

    // Parse response_json
    const response = typeof row.response_json === 'string' 
      ? JSON.parse(row.response_json) 
      : row.response_json;

    console.log('=== Response Structure ===');
    console.log(`   Has engine_output: ${!!response.engine_output}`);
    console.log(`   Has synthesis: ${!!response.engine_output?.synthesis}`);
    console.log(`   Has claims: ${Array.isArray(response.claims) ? response.claims.length : 0} claims`);
    console.log(`   Has evidence: ${!!response.evidence}`);
    console.log(`   Has lens_results: ${Array.isArray(response.lens_results) ? response.lens_results.length : 0} lenses\n`);

    // Check synthesis
    const synthesis = response.engine_output?.synthesis || {};
    console.log('=== Synthesis State ===');
    console.log(`   Has confidence_score: ${synthesis.confidence_score !== null && synthesis.confidence_score !== undefined}`);
    console.log(`   confidence_score value: ${synthesis.confidence_score}`);
    console.log(`   Has confidence_breakdown: ${!!synthesis.confidence_breakdown}`);
    console.log(`   Has convergence_points: ${Array.isArray(synthesis.convergence_points) ? synthesis.convergence_points.length : 0}`);
    console.log(`   Has divergence_points: ${Array.isArray(synthesis.divergence_points) ? synthesis.divergence_points.length : 0}`);
    console.log(`   Has orphan_claims: ${Array.isArray(synthesis.orphan_claims) ? synthesis.orphan_claims.length : 0}\n`);

    // Check engine_output structure
    console.log('=== Engine Output Keys ===');
    console.log(`   ${Object.keys(response.engine_output || {}).join(', ')}\n`);

    // Check synthesis keys
    console.log('=== Synthesis Keys ===');
    console.log(`   ${Object.keys(synthesis).join(', ')}\n`);

    // Show full synthesis object (truncated)
    console.log('=== Full Synthesis Object (first 500 chars) ===');
    console.log(JSON.stringify(synthesis, null, 2).substring(0, 500));
    console.log('...\n');

    // Check if synthesis was computed
    if (!synthesis.confidence_score && synthesis.confidence_score !== 0) {
      console.log('❌ MISSING confidence_score - Analysis incomplete');
      console.log('\n=== Possible Causes ===');
      console.log('   1. Synthesis step was skipped or failed');
      console.log('   2. Analysis pipeline did not complete');
      console.log('   3. Error during synthesis computation\n');
    } else {
      console.log('✅ Analysis has confidence_score - should work\n');
    }

    process.exit(0);
  } catch (err: any) {
    console.error('Error checking analysis:', err);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

checkAnalysisState();
