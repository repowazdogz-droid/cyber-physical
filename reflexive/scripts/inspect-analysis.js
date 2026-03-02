#!/usr/bin/env node
/**
 * Inspect analysis state via API
 */

const ANALYSIS_ID = '54afd6cc-dc4f-4e6a-a2af-d5c98e44bd97';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function inspectAnalysis() {
  try {
    console.log(`\n=== Inspecting Analysis: ${ANALYSIS_ID} ===\n`);
    console.log(`API URL: ${API_URL}\n`);

    const response = await fetch(`${API_URL}/v1/analyses/${ANALYSIS_ID}`, {
      headers: {
        'Authorization': 'Bearer test'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API Error (${response.status}):`);
      console.log(error);
      return;
    }

    const data = await response.json();
    
    console.log('=== Response Structure ===');
    console.log(`   Has engine_output: ${!!data.engine_output}`);
    console.log(`   Has synthesis: ${!!data.engine_output?.synthesis}`);
    console.log(`   Has claims: ${Array.isArray(data.claims) ? data.claims.length : 0} claims`);
    console.log(`   Has evidence: ${!!data.evidence}`);
    console.log(`   Has lens_results: ${Array.isArray(data.lens_results) ? data.lens_results.length : 0} lenses\n`);

    // Check synthesis
    const synthesis = data.engine_output?.synthesis || {};
    console.log('=== Synthesis State ===');
    console.log(`   Has confidence_score: ${synthesis.confidence_score !== null && synthesis.confidence_score !== undefined}`);
    console.log(`   confidence_score value: ${synthesis.confidence_score}`);
    console.log(`   Has confidence_breakdown: ${!!synthesis.confidence_breakdown}`);
    console.log(`   Has convergence_points: ${Array.isArray(synthesis.convergence_points) ? synthesis.convergence_points.length : 0}`);
    console.log(`   Has divergence_points: ${Array.isArray(synthesis.divergence_points) ? synthesis.divergence_points.length : 0}`);
    console.log(`   Has orphan_claims: ${Array.isArray(synthesis.orphan_claims) ? synthesis.orphan_claims.length : 0}\n`);

    // Check engine_output structure
    console.log('=== Engine Output Keys ===');
    console.log(`   ${Object.keys(data.engine_output || {}).join(', ')}\n`);

    // Check synthesis keys
    console.log('=== Synthesis Keys ===');
    console.log(`   ${Object.keys(synthesis).join(', ')}\n`);

    // Show synthesis object
    console.log('=== Full Synthesis Object ===');
    console.log(JSON.stringify(synthesis, null, 2));
    console.log('\n');

    // Check if synthesis was computed
    if (!synthesis.confidence_score && synthesis.confidence_score !== 0) {
      console.log('❌ MISSING confidence_score - Analysis incomplete');
      console.log('\n=== Diagnosis ===');
      console.log('   The analysis exists but synthesis.confidence_score is missing.');
      console.log('   This means the synthesis step either:');
      console.log('   1. Was not executed');
      console.log('   2. Failed silently');
      console.log('   3. Completed but did not set confidence_score\n');
    } else {
      console.log('✅ Analysis has confidence_score - should work\n');
    }

  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

inspectAnalysis();
