#!/usr/bin/env node
/**
 * Create a new HelioTech analysis and verify artifact endpoint
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const HELIOTECH_PROMPT = 'Should we acquire HelioTech for $500M? They have $200M annual revenue growing 15% YoY, a strong engineering team of 150, but significant technical debt in their legacy platform. Our board wants a decision by end of Q2.';

async function createAndVerifyAnalysis() {
  try {
    console.log('\n=== Creating New HelioTech Analysis ===\n');
    console.log(`API URL: ${API_URL}`);
    console.log(`Stimulus: ${HELIOTECH_PROMPT.substring(0, 80)}...\n`);

    // Step 1: Create analysis
    console.log('Step 1: POST /v1/analyses');
    const createResponse = await fetch(`${API_URL}/v1/analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify({
        stimulus: {
          text: HELIOTECH_PROMPT,
          type: 'decision'
        },
        options: {
          dry_run: false,
          save: true
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error(`❌ Failed to create analysis (${createResponse.status}):`);
      console.error(error);
      return;
    }

    const createData = await createResponse.json();
    const analysisId = createData.analysis_id;
    console.log(`✅ Analysis created: ${analysisId}`);
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Has engine_output: ${!!createData.engine_output}`);
    console.log(`   Has synthesis: ${!!createData.engine_output?.synthesis}`);
    console.log(`   confidence_score: ${createData.engine_output?.synthesis?.confidence_score ?? 'MISSING'}\n`);

    // Step 2: Wait a bit for pipeline to complete (if not already done)
    if (!createData.engine_output?.synthesis?.confidence_score) {
      console.log('Step 2: Waiting for synthesis to complete...');
      console.log('   (Check server logs for pipeline progress)');
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      let hasSynthesis = false;
      
      while (attempts < maxAttempts && !hasSynthesis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        const checkResponse = await fetch(`${API_URL}/v1/analyses/${analysisId}`, {
          headers: { 'Authorization': 'Bearer test' }
        });
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.engine_output?.synthesis?.confidence_score != null) {
            hasSynthesis = true;
            console.log(`   ✅ Synthesis complete after ${attempts}s`);
            break;
          }
        }
        
        if (attempts % 5 === 0) {
          console.log(`   ...still waiting (${attempts}s)`);
        }
      }
      
      if (!hasSynthesis) {
        console.log(`   ⚠️  Synthesis not complete after ${maxAttempts}s`);
        console.log('   Check server logs for errors\n');
      }
    }

    // Step 3: Test artifact endpoint
    console.log('\nStep 3: GET /v1/analyses/:id/artifact');
    const artifactResponse = await fetch(`${API_URL}/v1/analyses/${analysisId}/artifact`, {
      headers: { 'Authorization': 'Bearer test' }
    });

    console.log(`   Status: ${artifactResponse.status}`);
    
    if (artifactResponse.ok) {
      const artifact = await artifactResponse.json();
      console.log(`✅ Artifact endpoint returned 200`);
      console.log(`   artifactId: ${artifact.artifactId}`);
      console.log(`   schemaVersion: ${artifact.schemaVersion}`);
      console.log(`   has executiveSignal: ${!!artifact.executiveSignal}`);
      console.log(`   has structuralThesis: ${!!artifact.structuralThesis}`);
      console.log(`   has confidenceConstruction: ${!!artifact.confidenceConstruction}`);
      console.log(`   decisionGates count: ${artifact.decisionGates?.length || 0}`);
      console.log('\n✅ SUCCESS: New analysis completed and artifact endpoint works!\n');
    } else {
      const error = await artifactResponse.text();
      console.error(`❌ Artifact endpoint failed (${artifactResponse.status}):`);
      console.error(error);
      console.log('\n❌ FAILURE: Check server logs for synthesis pipeline errors\n');
    }

  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

createAndVerifyAnalysis();
