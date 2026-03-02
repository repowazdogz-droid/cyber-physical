// test-single-lens.ts
import { getLenses } from './src/db/queries.js';
import { invokeLenses } from './src/lenses/orchestrator.js';
import { v4 as uuidv4 } from 'uuid';
import { query, pool } from './src/db/client.js';

async function main() {
  const start = Date.now();
  
  try {
    // Get active lenses
    const lenses = await getLenses(true);
    console.log(`Found ${lenses.length} active lenses`);
    
    if (lenses.length === 0) {
      throw new Error('No active lenses found');
    }
    
    // Use the analytical lens (first one, typically)
    const analyticalLens = lenses.find(l => l.name === 'analytical') || lenses[0];
    console.log(`Testing lens: ${analyticalLens.name} (${analyticalLens.id})`);
    
    // Create a test case and analysis
    const case_id = uuidv4();
    const analysis_id = uuidv4();
    
    // Create case
    await query(
      `INSERT INTO cases (id, title, stimulus_content, stimulus_type, stimulus_text, state, created_at)
       VALUES ($1, $2, $3, $4::stimulus_type, $3, 'active', NOW())`,
      [
        case_id,
        'Test Single Lens',
        'Should we acquire HelioTech for $500M? They have $200M annual revenue growing 15% YoY, a strong engineering team of 150, but significant technical debt in their legacy platform. Our board wants a decision by end of Q2.',
        'decision_request'
      ]
    );
    
    // Create analysis
    await query(
      `INSERT INTO analyses (id, case_id, sequence_number, state, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [analysis_id, case_id, 1, 'pending']
    );
    
    // Invoke just this one lens
    const stimulus_text = 'Should we acquire HelioTech for $500M? They have $200M annual revenue growing 15% YoY, a strong engineering team of 150, but significant technical debt in their legacy platform. Our board wants a decision by end of Q2.';
    const stimulus_type = 'decision_request';
    const analysis_date = new Date().toISOString();
    
    console.log('Invoking lens...');
    const results = await invokeLenses(
      [analyticalLens],
      analysis_id,
      stimulus_text,
      stimulus_type,
      [],
      analysis_date
    );
    
    const duration = Date.now() - start;
    const result = results[0];
    
    if (result.state === 'completed') {
      console.log(`\n✅ SUCCESS in ${duration}ms`);
      console.log(`Lens: ${result.lens_id}`);
      console.log(`Latency: ${result.latency_ms}ms`);
      console.log(`Attempts: ${result.attempts}`);
      console.log(`Tokens: ${result.token_usage.total_tokens} (${result.token_usage.prompt_tokens} prompt + ${result.token_usage.completion_tokens} completion)`);
      
      // Try to parse claims from response
      try {
        const parsed = JSON.parse(result.raw_response || '{}');
        const claims = parsed.claims || [];
        console.log(`\nClaims: ${claims.length}`);
        if (claims.length > 0) {
          console.log(`First claim: ${JSON.stringify(claims[0], null, 2).substring(0, 500)}`);
        }
      } catch (e) {
        console.log(`\nResponse (first 2000 chars):`);
        console.log((result.raw_response || '').substring(0, 2000));
      }
      
      console.log(`\nFull result (truncated to 2000 chars):`);
      console.log(JSON.stringify(result, null, 2).substring(0, 2000));
    } else {
      console.log(`\n❌ FAILED in ${duration}ms`);
      console.log(`Error: ${result.error}`);
      console.log(`Attempts: ${result.attempts}`);
      console.log(`Latency: ${result.latency_ms}ms`);
    }
    
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`\n❌ FAILED in ${duration}ms: ${err.message}`);
    if (err.stack) {
      console.log(err.stack);
    }
  } finally {
    await pool.end();
  }
}

main();
