import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateReport } from './report-generator.js';
import { runAllGoldenCases } from './golden/runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('=== REFLEXIVE Calibration Report ===');
  
  // Load calibration outputs
  const weightCalPath = resolve(__dirname, 'reports/weight-calibration-latest.json');
  const bandCalPath = resolve(__dirname, 'calibration/band-calibration-output.json');
  
  let weightCal: any = null;
  let bandCal: any = null;
  
  try {
    weightCal = JSON.parse(readFileSync(weightCalPath, 'utf-8'));
  } catch (err) {
    console.warn(`Warning: Could not load weight calibration: ${err}`);
  }
  
  try {
    bandCal = JSON.parse(readFileSync(bandCalPath, 'utf-8'));
  } catch (err) {
    console.warn(`Warning: Could not load band calibration: ${err}`);
  }
  
  // Run golden cases
  console.log('Running golden cases...');
  const goldenOutput = await runAllGoldenCases();
  const goldenResults = goldenOutput.results;
  const goldenPassed = goldenResults.filter(r => r.passed).length;
  const goldenTotal = goldenResults.length;
  
  console.log(`Golden cases: ${goldenPassed}/${goldenTotal} passed`);
  
  // Generate report
  const report = generateReport({
    trigger: 'calibration',
    track_a: {
      results: goldenResults,
      metrics: goldenOutput.metrics,
      total_duration_ms: goldenResults.reduce((sum, r) => sum + r.duration_ms, 0),
    },
    calibration: {
      recommendations: [
        ...(weightCal ? [{
          parameter: 'W_a',
          current_value: weightCal.current_weights?.W_a,
          recommended_value: weightCal.recommended_weights?.W_a,
          reason: `Weight calibration: train_spearman=${weightCal.train_spearman?.toFixed(4)}, test_spearman=${weightCal.test_spearman?.toFixed(4)}`,
          confidence: weightCal.overfit_flag ? 0.5 : 0.9,
        }, {
          parameter: 'W_e',
          current_value: weightCal.current_weights?.W_e,
          recommended_value: weightCal.recommended_weights?.W_e,
          reason: `Weight calibration`,
          confidence: weightCal.overfit_flag ? 0.5 : 0.9,
        }, {
          parameter: 'W_u',
          current_value: weightCal.current_weights?.W_u,
          recommended_value: weightCal.recommended_weights?.W_u,
          reason: `Weight calibration`,
          confidence: weightCal.overfit_flag ? 0.5 : 0.9,
        }, {
          parameter: 'W_d',
          current_value: weightCal.current_weights?.W_d,
          recommended_value: weightCal.recommended_weights?.W_d,
          reason: `Weight calibration`,
          confidence: weightCal.overfit_flag ? 0.5 : 0.9,
        }] : []),
        ...(bandCal?.proposed_boundaries ? [{
          parameter: 'BAND_LOW_MAX',
          current_value: bandCal.current_boundaries?.BAND_LOW_MAX,
          recommended_value: 0.25,
          reason: `Band calibration: percentile bands (0.13, 0.17, 0.21) were too tight for narrow score range [${bandCal.proposed_analysis?.min?.toFixed(3)}, ${bandCal.proposed_analysis?.max?.toFixed(3)}]. Overridden to stable defaults (0.25, 0.50, 0.75) for institutional UX.`,
          confidence: 0.9,
        }, {
          parameter: 'BAND_MODERATE_MAX',
          current_value: bandCal.current_boundaries?.BAND_MODERATE_MAX,
          recommended_value: 0.50,
          reason: `Band calibration: overridden to stable defaults`,
          confidence: 0.9,
        }, {
          parameter: 'BAND_HIGH_MAX',
          current_value: bandCal.current_boundaries?.BAND_HIGH_MAX,
          recommended_value: 0.75,
          reason: `Band calibration: overridden to stable defaults`,
          confidence: 0.9,
        }] : []),
      ],
      applied: weightCal?.safe_to_apply || false,
    },
  });
  
  // Save report
  const reportsDir = resolve(__dirname, 'reports');
  const reportPath = resolve(reportsDir, 'latest.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Report saved: ${reportPath}`);
  console.log(`Report ID: ${report.id}`);
  console.log(`Regression verdict: ${report.regression_verdict}`);
  
  return report;
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
