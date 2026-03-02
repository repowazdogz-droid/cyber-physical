import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadAnalysis } from '../../src/api/storage.js';
import { ENGINE_CONFIG } from '../../src/config.js';
import { generateExecSummary, generateRedlines, extractConfidenceScore, extractModelSnapshot } from '../../src/api/demo-pack-helpers.js';
import { ApiError, ErrorCode } from '../../src/api/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBand(score: number | null): string {
  if (score === null || score === undefined) return 'Unknown';
  if (score < ENGINE_CONFIG.BAND_LOW_MAX) return 'Low';
  if (score < ENGINE_CONFIG.BAND_MODERATE_MAX) return 'Moderate';
  if (score < ENGINE_CONFIG.BAND_HIGH_MAX) return 'High';
  return 'Very High';
}

async function main() {
  const args = process.argv.slice(2);
  let analysisId: string | null = null;
  let outputDir = resolve(__dirname, 'exports');

  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && i + 1 < args.length) {
      analysisId = args[i + 1];
      i++;
    } else if (args[i] === '--out' && i + 1 < args.length) {
      outputDir = resolve(args[i + 1]);
      i++;
    }
  }

  if (!analysisId) {
    console.error('Usage: tsx eval/demo/export-demo-pack.ts --id <analysis_id> [--out <output_dir>]');
    process.exit(1);
  }

  console.log(`Exporting demo pack for analysis: ${analysisId}`);
  console.log(`Output directory: ${outputDir}`);

  // Load analysis from DB
  const stored = await loadAnalysis(analysisId);
  if (!stored) {
    console.error(`ERROR: Analysis ${analysisId} not found`);
    process.exit(1);
  }

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  const response = stored.response_json;
  const synthesis = response.engine_output?.synthesis || {};

  // Build artifacts
  const artifacts = {
    analysis_id: analysisId,
    created_at: stored.created_at,
    config_snapshot: response.run_metadata?.engine_config_snapshot || {},
    lens_artifacts: (response.lens_results || []).map((lr: any) => ({
      lens: lr.lens,
      status: lr.status,
      raw_text: lr.raw_text,
      parsed: lr.parsed,
      claim_ids: lr.claim_ids || [],
      duration_ms: lr.duration_ms,
    })),
    claim_artifacts: (response.claims || []).map((c: any) => ({
      claim_id: c.claim_id,
      lens: c.lens,
      text: c.text,
      about_entity: c.about_entity,
      polarity: c.polarity,
      category: c.category,
      evidence_basis: c.evidence_basis,
      provenance: c.provenance,
    })),
    evidence_artifacts: response.evidence || {
      items: [],
      links: [],
    },
  };

  // Build demo pack
  const configSnapshot = response.run_metadata?.engine_config_snapshot || {};

  // Extract confidence (throws if missing)
  let confidenceScore: number;
  try {
    confidenceScore = extractConfidenceScore(response);
  } catch (err: any) {
    if (err instanceof ApiError && err.code === ErrorCode.MISSING_SYNTHESIS_SCORE) {
      console.error(`ERROR: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const convergencePoints = synthesis.convergence_points || [];
  const divergencePoints = synthesis.divergence_points || [];
  const orphanClaims = synthesis.orphan_claims || [];

  // Generate exec_summary and redlines
  const modelSnapshot = extractModelSnapshot(response, stored.created_at);
  const execSummary = generateExecSummary(response, configSnapshot, stored.request_json, artifacts.evidence_artifacts, artifacts.claim_artifacts, modelSnapshot);
  const redlines = generateRedlines(synthesis, artifacts.claim_artifacts, artifacts.lens_artifacts, artifacts.evidence_artifacts);

  const demoPack = {
    analysis_id: analysisId,
    created_at: stored.created_at,
    schema_version: 'demo-pack@0.1.5',
    model_snapshot: modelSnapshot,
    request: stored.request_json,
    summary: {
      confidence_score: confidenceScore,
      band: getBand(confidenceScore),
      convergence_count: Array.isArray(convergencePoints) ? convergencePoints.length : 0,
      divergence_count: Array.isArray(divergencePoints) ? divergencePoints.length : 0,
      orphan_count: Array.isArray(orphanClaims) ? orphanClaims.length : 0,
    },
    exec_summary: execSummary,
    redlines,
    synthesis,
    artifacts,
    config_snapshot: configSnapshot,
  };

  // Write files
  const basePath = join(outputDir, analysisId);

  writeFileSync(
    `${basePath}.demo-pack.json`,
    JSON.stringify(demoPack, null, 2)
  );
  console.log(`✓ Written: ${basePath}.demo-pack.json`);

  writeFileSync(
    `${basePath}.artifacts.json`,
    JSON.stringify(artifacts, null, 2)
  );
  console.log(`✓ Written: ${basePath}.artifacts.json`);

  writeFileSync(
    `${basePath}.synthesis.json`,
    JSON.stringify(synthesis, null, 2)
  );
  console.log(`✓ Written: ${basePath}.synthesis.json`);

  writeFileSync(
    `${basePath}.exec-summary.txt`,
    execSummary
  );
  console.log(`✓ Written: ${basePath}.exec-summary.txt`);

  console.log('');
  console.log('Export complete!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
