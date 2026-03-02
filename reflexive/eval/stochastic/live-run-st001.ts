/**
 * REFLEXIVE First Live Stochastic Run
 * Stimulus: st-001-acquisition (HelioTech $500M)
 * Runs: 5
 * Purpose: Observational — no calibration, no optimization
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { v4 as uuidv4 } from 'uuid';
import { runAnalysis } from '../../src/analysis/orchestrator.js';
import { query, pool } from '../../src/db/client.js';
import { getLenses } from '../../src/db/queries.js';
import { invokeLenses } from '../../src/lenses/orchestrator.js';
import { ENGINE_CONFIG } from '../../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RUNS = 5;
const STIMULUS_PATH = resolve(__dirname, 'stimuli/st-001-acquisition.json');
const OUTPUT_DIR = resolve(__dirname, '../../reports/live-run-st001');

interface RunResult {
  run_number: number;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  success: boolean;
  error?: string;
  engine_output?: any;  // Full EngineOutput
  lens_results?: {
    lens_name: string;
    success: boolean;
    claim_count: number;
    parse_success: boolean;
    duration_ms: number;
  }[];
}

async function main() {
  // Load stimulus
  const stimulus = JSON.parse(readFileSync(STIMULUS_PATH, 'utf-8'));
  console.log('=== REFLEXIVE First Live Stochastic Evaluation ===');
  console.log(`Stimulus: ${stimulus.id} — ${stimulus.text.substring(0, 80)}...`);
  console.log(`Runs: ${RUNS}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const results: RunResult[] = [];

  for (let i = 1; i <= RUNS; i++) {
    console.log(`--- Run ${i}/${RUNS} ---`);
    const startTime = Date.now();
    const started_at = new Date().toISOString();

    try {
      // Create case and analysis in DB
      const case_id = uuidv4();
      const analysis_id = uuidv4();

      // Map stimulus type to enum
      const stimulusTypeMap: Record<string, string> = {
        'decision': 'decision_request',
        'question': 'research_question',
        'scenario': 'problem_statement',
        'assessment_request': 'assessment_request',
      };
      const dbStimulusType = stimulusTypeMap[stimulus.type] || 'decision_request';

      // Create case - use stimulus_content (schema) but add stimulus_text column for orchestrator compatibility
      await query(
        `ALTER TABLE cases ADD COLUMN IF NOT EXISTS stimulus_text TEXT`,
        []
      );
      
      await query(
        `INSERT INTO cases (id, title, stimulus_content, stimulus_type, stimulus_text, state, created_at)
         VALUES ($1, $2, $3, $4::stimulus_type, $3, 'active', NOW())`,
        [case_id, `Stochastic Run ${i}`, stimulus.text, dbStimulusType]
      );

      // Create analysis
      await query(
        `INSERT INTO analyses (id, case_id, sequence_number, state, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [analysis_id, case_id, 1, 'pending']
      );

      // Invoke lenses (Phase 2) - this must happen before runAnalysis
      const lenses = await getLenses(true);
      console.log(`  Invoking ${lenses.length} lenses...`);
      const analysis_date = new Date().toISOString();
      const lensResults = await invokeLenses(
        lenses,
        analysis_id,
        stimulus.text,
        stimulus.type,
        [], // context_items - empty for now
        analysis_date
      );
      
      const completedLenses = lensResults.filter(l => l.state === 'completed').length;
      const failedLenses = lensResults.filter(l => l.state === 'failed');
      console.log(`  Lenses completed: ${completedLenses}/${lenses.length}`);
      
      if (failedLenses.length > 0) {
        console.log(`  Failed lens errors:`);
        for (const failed of failedLenses) {
          console.log(`    ${failed.lens_id}: ${failed.error || 'Unknown error'}`);
        }
      }
      
      if (completedLenses < ENGINE_CONFIG.MIN_LENS_COUNT) {
        throw new Error(`INSUFFICIENT_INPUT: Only ${completedLenses} lenses completed (minimum ${ENGINE_CONFIG.MIN_LENS_COUNT}). Errors: ${failedLenses.map(l => `${l.lens_id}:${l.error || 'unknown'}`).join('; ')}`);
      }

      // Run the full pipeline
      await runAnalysis(case_id, analysis_id);
      
      // Check analysis state
      const analysisCheck = await query(
        `SELECT state, confidence_score FROM analyses WHERE id = $1`,
        [analysis_id]
      );
      
      if (analysisCheck.rows.length === 0) {
        throw new Error('Analysis not found after runAnalysis');
      }
      
      const analysisState = analysisCheck.rows[0].state;
      console.log(`  Analysis state: ${analysisState}`);
      
      if (analysisState === 'failed') {
        throw new Error(`Analysis failed: state=${analysisState}`);
      }

      // Ensure syntheses table has required columns
      await query(`ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS confidence_breakdown JSONB`, []).catch(() => {});
      await query(`ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS confidence_rationale TEXT`, []).catch(() => {});
      await query(`ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS computed_at TIMESTAMPTZ`, []).catch(() => {});

      // Load the synthesis from DB
      const synthesisResult = await query(
        `SELECT 
          confidence_score,
          confidence_breakdown,
          convergence_points,
          divergence_points,
          orphan_claims,
          confidence_rationale,
          computed_at,
          drift_report
         FROM syntheses
         WHERE analysis_id = $1`,
        [analysis_id]
      );

      if (synthesisResult.rows.length === 0) {
        throw new Error('Synthesis not found in database after runAnalysis');
      }

      const synthRow = synthesisResult.rows[0];

      // Load claim annotations from claims table (not a separate table)
      const annotationsResult = await query(
        `SELECT 
          id as claim_id,
          about_entity_canonical,
          validity,
          polarity,
          scoring_eligible,
          expires_at,
          stale_unsupported
         FROM claims
         WHERE case_id = $1`,
        [case_id]
      );

      const claim_annotations = annotationsResult.rows.map(row => ({
        claim_id: row.claim_id,
        about_entity_canonical: row.about_entity_canonical,
        validity: row.validity,
        polarity: row.polarity,
        scoring_eligible: row.scoring_eligible,
        evidence_density: 0, // Not stored in claims table
        expires_at: row.expires_at,
        stale_unsupported: row.stale_unsupported,
      }));

      // Load drift from drift_report JSONB column (already parsed by pg)
      const drift = synthRow.drift_report || null;

      // JSONB columns are already parsed objects by pg library
      const parseJsonb = (val: unknown) => {
        if (val === null || val === undefined) return null;
        if (typeof val === 'string') return JSON.parse(val);
        return val; // Already an object
      };

      const engine_output = {
        synthesis: {
          convergence_points: parseJsonb(synthRow.convergence_points) || [],
          divergence_points: parseJsonb(synthRow.divergence_points) || [],
          orphan_claims: parseJsonb(synthRow.orphan_claims) || [],
          confidence_score: synthRow.confidence_score,
          confidence_breakdown: parseJsonb(synthRow.confidence_breakdown) || null,
          confidence_rationale: synthRow.confidence_rationale,
          computed_at: synthRow.computed_at,
        },
        claim_annotations,
        drift,
      };

      // Load lens results
      const perspectivesResult = await query(
        `SELECT 
          p.id,
          p.lens_id,
          l.name as lens_name,
          p.state,
          COUNT(c.id) as claim_count
         FROM perspectives p
         JOIN lenses l ON p.lens_id = l.id
         LEFT JOIN claims c ON c.perspective_id = p.id
         WHERE p.analysis_id = $1
         GROUP BY p.id, p.lens_id, l.name, p.state`,
        [analysis_id]
      );

      const lens_results = perspectivesResult.rows.map(row => ({
        lens_name: row.lens_name,
        success: row.state === 'completed',
        claim_count: parseInt(row.claim_count) || 0,
        parse_success: row.state === 'completed',
        duration_ms: 0, // Not tracked in DB
      }));

      const duration_ms = Date.now() - startTime;
      const completed_at = new Date().toISOString();

      const run: RunResult = {
        run_number: i,
        started_at,
        completed_at,
        duration_ms,
        success: true,
        engine_output,
        lens_results,
      };

      results.push(run);

      // Save individual run output
      writeFileSync(
        resolve(OUTPUT_DIR, `run-${i}-output.json`),
        JSON.stringify(run, null, 2)
      );

      // Print summary for this run
      const eo = run.engine_output;
      console.log(`  Duration: ${duration_ms}ms`);
      console.log(`  Confidence: ${eo?.synthesis?.confidence_score ?? 'N/A'}`);
      console.log(`  Convergence points: ${eo?.synthesis?.convergence_points?.length ?? 'N/A'}`);
      console.log(`  Divergence points: ${eo?.synthesis?.divergence_points?.length ?? 'N/A'}`);
      console.log(`  Orphan claims: ${eo?.synthesis?.orphan_claims?.length ?? 'N/A'}`);
      console.log(`  Lenses: ${lens_results.map((l: any) => `${l.lens_name}:${l.success ? 'OK' : 'FAIL'}(${l.claim_count})`).join(', ')}`);
      console.log('');

    } catch (err: any) {
      const duration_ms = Date.now() - startTime;
      console.error(`  FAILED: ${err.message}`);
      if (err.stack) {
        console.error(err.stack);
      }
      results.push({
        run_number: i,
        started_at,
        completed_at: new Date().toISOString(),
        duration_ms,
        success: false,
        error: err.message + '\n' + (err.stack || ''),
      });

      writeFileSync(
        resolve(OUTPUT_DIR, `run-${i}-error.json`),
        JSON.stringify({ error: err.message, stack: err.stack }, null, 2)
      );
    }

    // Wait 15s between runs to let rate limit window reset (OpenAI: 30k TPM)
    if (i < RUNS) {
      console.log('  Waiting 15s for rate limit reset...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }

  // ========== AGGREGATE METRICS ==========

  console.log('=== AGGREGATE RESULTS ===');
  console.log('');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Success rate: ${successful.length}/${RUNS} (${(successful.length / RUNS * 100).toFixed(0)}%)`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (successful.length > 0) {
    // Confidence scores
    const scores = successful.map(r => {
      const eo = r.engine_output;
      return eo?.synthesis?.confidence_score ?? eo?.confidence_score ?? null;
    }).filter((s): s is number => s !== null);

    if (scores.length > 0) {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
      const std = Math.sqrt(variance);

      console.log('CONFIDENCE SCORES:');
      scores.forEach((s, i) => console.log(`  Run ${i + 1}: ${s.toFixed(4)}`));
      console.log(`  Mean: ${mean.toFixed(4)}`);
      console.log(`  Std Dev: ${std.toFixed(4)}`);
      console.log(`  Variance: ${variance.toFixed(6)}`);
      console.log(`  Range: [${Math.min(...scores).toFixed(4)}, ${Math.max(...scores).toFixed(4)}]`);
      console.log('');
    }

    // Convergence/Divergence counts
    const convCounts = successful.map(r => {
      const eo = r.engine_output;
      return eo?.synthesis?.convergence_points?.length ?? 0;
    });
    const divCounts = successful.map(r => {
      const eo = r.engine_output;
      return eo?.synthesis?.divergence_points?.length ?? 0;
    });
    const orphanCounts = successful.map(r => {
      const eo = r.engine_output;
      return eo?.synthesis?.orphan_claims?.length ?? 0;
    });

    console.log('CONVERGENCE/DIVERGENCE:');
    console.log(`  Convergence per run: ${convCounts.join(', ')}`);
    console.log(`  Divergence per run: ${divCounts.join(', ')}`);
    console.log(`  Orphans per run: ${orphanCounts.join(', ')}`);
    console.log('');

    // Lens success rates
    const allLensResults = successful.flatMap(r => r.lens_results || []);
    const lensNames = [...new Set(allLensResults.map(l => l.lens_name))];

    console.log('LENS SUCCESS RATES:');
    for (const name of lensNames) {
      const lensRuns = allLensResults.filter(l => l.lens_name === name);
      const successCount = lensRuns.filter(l => l.success).length;
      const claimCounts = lensRuns.map(l => l.claim_count);
      const meanClaims = claimCounts.reduce((a, b) => a + b, 0) / claimCounts.length;
      console.log(`  ${name}: ${successCount}/${lensRuns.length} success, mean claims: ${meanClaims.toFixed(1)}`);
    }
    console.log('');

    // Latency
    const latencies = successful.map(r => r.duration_ms);
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    console.log('LATENCY:');
    latencies.forEach((l, i) => console.log(`  Run ${i + 1}: ${l}ms`));
    console.log(`  P50: ${p50}ms`);
    console.log(`  P95: ${p95}ms`);
    console.log('');

    // Evidence density
    const evidenceDensities = successful.map(r => {
      const eo = r.engine_output;
      const breakdown = eo?.synthesis?.confidence_breakdown || eo?.confidence_breakdown;
      return breakdown?.evidence_density_factor ?? null;
    }).filter((r): r is number => r !== null);

    if (evidenceDensities.length > 0) {
      console.log('EVIDENCE DENSITY:');
      evidenceDensities.forEach((r, i) => console.log(`  Run ${i + 1}: ${r.toFixed(4)}`));
      console.log('');
    }

    // Unsupported penalty
    const unsupportedPenalties = successful.map(r => {
      const eo = r.engine_output;
      const breakdown = eo?.synthesis?.confidence_breakdown || eo?.confidence_breakdown;
      return breakdown?.unsupported_penalty ?? null;
    }).filter((r): r is number => r !== null);

    if (unsupportedPenalties.length > 0) {
      console.log('UNSUPPORTED PENALTY:');
      unsupportedPenalties.forEach((r, i) => console.log(`  Run ${i + 1}: ${r.toFixed(4)}`));
      console.log('');
    }
  }

  // ========== SAVE COMPLETE REPORT ==========

  const report = {
    id: `live-st001-${Date.now()}`,
    created_at: new Date().toISOString(),
    stimulus: stimulus,
    runs: RUNS,
    results: results,
    aggregate: {
      success_rate: successful.length / RUNS,
      confidence_scores: successful.map(r => {
        const eo = r.engine_output;
        return eo?.synthesis?.confidence_score ?? eo?.confidence_score ?? null;
      }),
      latencies_ms: successful.map(r => r.duration_ms),
    },
  };

  const reportPath = resolve(OUTPUT_DIR, 'complete-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Complete report saved: ${reportPath}`);

  // Save each run's FULL engine output separately for review
  for (const r of successful) {
    writeFileSync(
      resolve(OUTPUT_DIR, `run-${r.run_number}-full-synthesis.json`),
      JSON.stringify(r.engine_output, null, 2)
    );
  }

  console.log('');
  console.log('=== EVALUATION COMPLETE ===');
  console.log(`All outputs saved to: ${OUTPUT_DIR}`);
  console.log('');
  console.log('DO NOT save baseline. DO NOT calibrate. This is an observational run.');

  // Close DB connection
  await pool.end();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
