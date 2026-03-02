import { EVAL_CONFIG } from '../config.js';
import type { WeightCalibrationInput, WeightCalibrationOutput } from '../types.js';

/**
 * Compute Spearman rank correlation.
 */
function spearmanRankCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  // Convert to ranks
  const xRanks = x.map((val, idx) => ({ val, idx }))
    .sort((a, b) => a.val - b.val)
    .map((item, rank) => ({ idx: item.idx, rank: rank + 1 }));
  
  const yRanks = y.map((val, idx) => ({ val, idx }))
    .sort((a, b) => a.val - b.val)
    .map((item, rank) => ({ idx: item.idx, rank: rank + 1 }));

  // Reorder by original index
  const xRanked = xRanks.sort((a, b) => a.idx - b.idx).map(r => r.rank);
  const yRanked = yRanks.sort((a, b) => a.idx - b.idx).map(r => r.rank);

  // Compute Pearson correlation on ranks
  const n = xRanked.length;
  const xMean = xRanked.reduce((sum, val) => sum + val, 0) / n;
  const yMean = yRanked.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let xVar = 0;
  let yVar = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xRanked[i] - xMean;
    const yDiff = yRanked[i] - yMean;
    numerator += xDiff * yDiff;
    xVar += xDiff * xDiff;
    yVar += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xVar * yVar);
  return denominator > 0 ? numerator / denominator : 0;
}

export function calibrateWeights(input: WeightCalibrationInput): WeightCalibrationOutput {
  const { analyses } = input;
  const grid = EVAL_CONFIG.weight_search_grid;
  
  // Generate all valid combinations
  const combinations: Array<{ W_a: number; W_e: number; W_u: number; W_d: number }> = [];
  
  for (const W_a of grid.W_a) {
    for (const W_e of grid.W_e) {
      for (const W_u of grid.W_u) {
        for (const W_d of grid.W_d) {
          const sum = W_a + W_e + W_u + W_d;
          if (Math.abs(sum - 1.0) <= 0.001 && (W_u + W_d) >= EVAL_CONFIG.penalty_dominance_floor) {
            combinations.push({ W_a, W_e, W_u, W_d });
          }
        }
      }
    }
  }

  // Split 70/30 train/test (deterministic: sort by analysis_id)
  const sorted = [...analyses].sort((a, b) => a.analysis_id.localeCompare(b.analysis_id));
  const trainSize = Math.floor(sorted.length * 0.7);
  const train = sorted.slice(0, trainSize);
  const test = sorted.slice(trainSize);

  let bestCorrelation = -Infinity;
  let bestWeights = { W_a: 0.45, W_e: 0.25, W_u: 0.15, W_d: 0.15 };

  // Current weights
  const currentWeights = { W_a: 0.45, W_e: 0.25, W_u: 0.15, W_d: 0.15 };

  // Compute current correlation
  const currentScores = train.map(a => {
    const score = (currentWeights.W_a * a.agreement_factor +
                   currentWeights.W_e * a.evidence_density_factor -
                   currentWeights.W_u * a.unsupported_penalty -
                   currentWeights.W_d * a.divergence_penalty) * a.lens_count_factor;
    return score;
  });
  const currentRatings = train.map(a => a.human_quality_rating);
  const currentCorrelation = spearmanRankCorrelation(currentScores, currentRatings);

  // Search for best weights
  for (const weights of combinations) {
    const scores = train.map(a => {
      const score = (weights.W_a * a.agreement_factor +
                     weights.W_e * a.evidence_density_factor -
                     weights.W_u * a.unsupported_penalty -
                     weights.W_d * a.divergence_penalty) * a.lens_count_factor;
      return score;
    });
    const ratings = train.map(a => a.human_quality_rating);
    const correlation = spearmanRankCorrelation(scores, ratings);

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestWeights = weights;
    }
  }

  // Compute test correlation for best weights
  const testScores = test.map(a => {
    const score = (bestWeights.W_a * a.agreement_factor +
                   bestWeights.W_e * a.evidence_density_factor -
                   bestWeights.W_u * a.unsupported_penalty -
                   bestWeights.W_d * a.divergence_penalty) * a.lens_count_factor;
    return score;
  });
  const testRatings = test.map(a => a.human_quality_rating);
  const testCorrelation = spearmanRankCorrelation(testScores, testRatings);

  // Compute score distributions
  const currentAllScores = analyses.map(a => {
    return (currentWeights.W_a * a.agreement_factor +
            currentWeights.W_e * a.evidence_density_factor -
            currentWeights.W_u * a.unsupported_penalty -
            currentWeights.W_d * a.divergence_penalty) * a.lens_count_factor;
  });
  const recommendedAllScores = analyses.map(a => {
    return (bestWeights.W_a * a.agreement_factor +
            bestWeights.W_e * a.evidence_density_factor -
            bestWeights.W_u * a.unsupported_penalty -
            bestWeights.W_d * a.divergence_penalty) * a.lens_count_factor;
  });

  const computeStats = (scores: number[]) => {
    const sorted = [...scores].sort((a, b) => a - b);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    return {
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      mean,
      std: Math.sqrt(variance),
    };
  };

  const currentStats = computeStats(currentAllScores);
  const recommendedStats = computeStats(recommendedAllScores);

  // Band coverage (count distinct bands hit)
  const bandBoundaries = [0.40, 0.70, 0.90];
  const countBands = (scores: number[]) => {
    const bands = new Set<string>();
    for (const score of scores) {
      if (score < bandBoundaries[0]) bands.add('low');
      else if (score < bandBoundaries[1]) bands.add('moderate');
      else if (score < bandBoundaries[2]) bands.add('high');
      else bands.add('very_high');
    }
    return bands.size;
  };

  return {
    current_weights: currentWeights,
    recommended_weights: bestWeights,
    current_correlation: currentCorrelation,
    recommended_correlation: bestCorrelation,
    score_distribution: {
      current: currentStats,
      recommended: recommendedStats,
    },
    band_coverage: {
      current: countBands(currentAllScores),
      recommended: countBands(recommendedAllScores),
    },
  };
}
