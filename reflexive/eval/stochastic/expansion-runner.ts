import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pool, query } from '../../src/db/client.js';
import { runAnalysis } from '../../src/analysis/orchestrator.js';
import { getLenses } from '../../src/db/queries.js';
import { invokeLenses } from '../../src/lenses/orchestrator.js';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STIMULI_DIR = resolve(__dirname, 'stimuli');
const OUTPUT_DIR = resolve(__dirname, '../../reports/calibration-expansion');

interface StimulusFile {
  id: string;
  text: string;
  type: string;
  context?: string[];
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load all stimulus files
  const stimulusFiles = readdirSync(STIMULI_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`=== REFLEXIVE Calibration Expansion ===`);
  console.log(`Found ${stimulusFiles.length} stimuli`);
  console.log(`Target: 1 analysis per stimulus`);
  console.log('');

  const results: any[] = [];

  for (const file of stimulusFiles) {
    const stimulus: StimulusFile = JSON.parse(
      readFileSync(resolve(STIMULI_DIR, file), 'utf-8')
    );

    console.log(`--- ${stimulus.id}: ${stimulus.text.substring(0, 60)}... ---`);
    const startTime = Date.now();

    try {
      // Map stimulus type to enum
      const stimulusTypeMap: Record<string, string> = {
        'decision': 'decision_request',
        'question': 'research_question',
        'scenario': 'problem_statement',
        'assessment_request': 'assessment_request',
      };
      const dbStimulusType = stimulusTypeMap[stimulus.type] || 'decision_request';

      // Ensure stimulus_text column exists
      await query(
        `ALTER TABLE cases ADD COLUMN IF NOT EXISTS stimulus_text TEXT`,
        []
      );

      // Create case
      const case_id = randomUUID();
      await query(
        `INSERT INTO cases (id, title, stimulus_content, stimulus_type, stimulus_text, state, created_at)
         VALUES ($1, $2, $3, $4::stimulus_type, $3, 'active', NOW())`,
        [case_id, `Expansion Run: ${stimulus.id}`, stimulus.text, dbStimulusType]
      );

      // Create analysis
      const analysis_id = randomUUID();
      await query(
        `INSERT INTO analyses (id, case_id, sequence_number, state, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [analysis_id, case_id, 1, 'pending']
      );

      // Get lenses and invoke them
      const lenses = await getLenses(true);
      console.log(`  Invoking ${lenses.length} lenses...`);
      const analysis_date = new Date().toISOString();
      await invokeLenses(
        lenses,
        analysis_id,
        stimulus.text,
        stimulus.type,
        [], // context_items - empty for now
        analysis_date
      );

      // Run analysis
      await runAnalysis(case_id, analysis_id);

      // Read synthesis from DB
      const synthResult = await query(
        `SELECT s.*, a.case_id FROM syntheses s
         JOIN analyses a ON a.id = s.analysis_id
         WHERE s.analysis_id = $1`,
        [analysis_id]
      );

      const duration = Date.now() - startTime;

      if (synthResult.rows.length > 0) {
        const synth = synthResult.rows[0];
        const confidence = synth.confidence_score;
        
        // Parse JSONB fields
        const parseJsonb = (val: unknown) => {
          if (val === null || val === undefined) return null;
          if (typeof val === 'string') return JSON.parse(val);
          return val; // Already an object
        };
        
        const breakdown = parseJsonb(synth.confidence_breakdown);
        const convergence = parseJsonb(synth.convergence_points) || [];
        const divergence = parseJsonb(synth.divergence_points) || [];
        const orphans = parseJsonb(synth.orphan_claims) || [];

        console.log(`  ✓ ${duration}ms | confidence: ${confidence?.toFixed(4)} | conv: ${convergence?.length} | div: ${divergence?.length} | orphans: ${orphans?.length}`);
        console.log(`    edf: ${breakdown?.evidence_density_factor?.toFixed(4)} | up: ${breakdown?.unsupported_penalty?.toFixed(4)} | af: ${breakdown?.agreement_factor?.toFixed(4)}`);

        const result = {
          stimulus_id: stimulus.id,
          analysis_id,
          case_id,
          duration_ms: duration,
          success: true,
          confidence_score: confidence,
          confidence_breakdown: breakdown,
          convergence_count: convergence?.length || 0,
          divergence_count: divergence?.length || 0,
          orphan_count: orphans?.length || 0,
        };

        results.push(result);

        // Save individual output
        writeFileSync(
          resolve(OUTPUT_DIR, `${stimulus.id}-output.json`),
          JSON.stringify({
            ...result,
            convergence_points: convergence,
            divergence_points: divergence,
            orphan_claims: orphans,
          }, null, 2)
        );
      } else {
        console.log(`  ✗ Analysis completed but no synthesis found`);
        results.push({
          stimulus_id: stimulus.id,
          analysis_id,
          case_id,
          duration_ms: duration,
          success: false,
          error: 'No synthesis row found',
        });
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.log(`  ✗ FAILED (${duration}ms): ${err.message}`);
      if (err.stack) {
        console.log(`    ${err.stack.split('\n')[0]}`);
      }
      results.push({
        stimulus_id: stimulus.id,
        duration_ms: duration,
        success: false,
        error: err.message,
      });
    }

    // Rate limit delay
    if (stimulusFiles.indexOf(file) < stimulusFiles.length - 1) {
      console.log('  Waiting 15s for rate limit reset...');
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  // Summary
  console.log('');
  console.log('=== EXPANSION SUMMARY ===');
  const successful = results.filter(r => r.success);
  console.log(`Completed: ${successful.length}/${results.length}`);

  if (successful.length > 0) {
    const scores = successful.map(r => r.confidence_score).filter((s): s is number => s !== null && s !== undefined);
    if (scores.length > 0) {
      const mean = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      console.log(`Confidence range: [${Math.min(...scores).toFixed(4)}, ${Math.max(...scores).toFixed(4)}]`);
      console.log(`Confidence mean: ${mean.toFixed(4)}`);

      console.log('');
      console.log('Per-stimulus results:');
      for (const r of successful) {
        console.log(`  ${r.stimulus_id}: conf=${r.confidence_score?.toFixed(4)} conv=${r.convergence_count} div=${r.divergence_count} orphans=${r.orphan_count}`);
      }
    }
  }

  // Save summary
  writeFileSync(
    resolve(OUTPUT_DIR, 'expansion-summary.json'),
    JSON.stringify({
      created_at: new Date().toISOString(),
      total_stimuli: stimulusFiles.length,
      successful: successful.length,
      results,
    }, null, 2)
  );

  console.log('');
  console.log(`Results saved to: ${OUTPUT_DIR}`);

  await pool.end();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
