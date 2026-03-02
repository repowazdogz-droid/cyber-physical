import type { DistributionInput, DistributionOutput } from '../types.js';

export function analyzeDistribution(input: DistributionInput): DistributionOutput {
  const { scores, human_ratings, band_boundaries } = input;
  const n = scores.length;

  if (n === 0) {
    return {
      n: 0,
      min: 0,
      max: 0,
      mean: 0,
      std: 0,
      skew: 0,
      range: 0,
      band_counts: { low: 0, moderate: 0, high: 0, very_high: 0 },
      band_entropy: 0,
      ceiling_gap: 0,
      floor_gap: 0,
      recommendation: 'acceptable',
      details: 'No data',
    };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = scores.reduce((sum, s) => sum + s, 0) / n;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  // Skewness
  const skew = n > 2 ? scores.reduce((sum, s) => sum + Math.pow((s - mean) / std, 3), 0) / n : 0;

  const range = max - min;

  // Assign to bands
  const bandCounts = { low: 0, moderate: 0, high: 0, very_high: 0 };
  for (const score of scores) {
    if (score < band_boundaries[0]) {
      bandCounts.low++;
    } else if (score < band_boundaries[1]) {
      bandCounts.moderate++;
    } else if (score < band_boundaries[2]) {
      bandCounts.high++;
    } else {
      bandCounts.very_high++;
    }
  }

  // Band entropy
  const bandProbs = [
    bandCounts.low / n,
    bandCounts.moderate / n,
    bandCounts.high / n,
    bandCounts.very_high / n,
  ];
  let bandEntropy = 0;
  for (const prob of bandProbs) {
    if (prob > 0) {
      bandEntropy -= prob * Math.log(prob);
    }
  }

  // Ceiling and floor gaps
  const ceilingGap = 1.0 - max;
  const floorGap = min;

  // Rank correlation if human ratings provided
  let rankCorrelation: number | undefined;
  if (human_ratings && human_ratings.length === n) {
    const scoreRanks = scores.map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((item, rank) => ({ idx: item.idx, rank: rank + 1 }));
    
    const ratingRanks = human_ratings.map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((item, rank) => ({ idx: item.idx, rank: rank + 1 }));

    const scoreRanked = scoreRanks.sort((a, b) => a.idx - b.idx).map(r => r.rank);
    const ratingRanked = ratingRanks.sort((a, b) => a.idx - b.idx).map(r => r.rank);

    const scoreMean = scoreRanked.reduce((sum, r) => sum + r, 0) / n;
    const ratingMean = ratingRanked.reduce((sum, r) => sum + r, 0) / n;

    let numerator = 0;
    let scoreVar = 0;
    let ratingVar = 0;

    for (let i = 0; i < n; i++) {
      const scoreDiff = scoreRanked[i] - scoreMean;
      const ratingDiff = ratingRanked[i] - ratingMean;
      numerator += scoreDiff * ratingDiff;
      scoreVar += scoreDiff * scoreDiff;
      ratingVar += ratingDiff * ratingDiff;
    }

    const denominator = Math.sqrt(scoreVar * ratingVar);
    rankCorrelation = denominator > 0 ? numerator / denominator : 0;
  }

  // Determine recommendation
  let recommendation: 'acceptable' | 'narrow_range' | 'clustered' | 'ceiling_hit';
  let details = '';

  if (range < 0.35) {
    recommendation = 'narrow_range';
    details = `Range ${range.toFixed(3)} is narrow (< 0.35)`;
  } else if (std < 0.08) {
    recommendation = 'clustered';
    details = `Std dev ${std.toFixed(3)} indicates clustering (< 0.08)`;
  } else if (ceilingGap > 0.35) {
    recommendation = 'ceiling_hit';
    details = `Ceiling gap ${ceilingGap.toFixed(3)} is large (> 0.35)`;
  } else {
    recommendation = 'acceptable';
    details = 'Distribution appears acceptable';
  }

  return {
    n,
    min,
    max,
    mean,
    std,
    skew,
    range,
    band_counts: bandCounts,
    band_entropy: bandEntropy,
    ceiling_gap: ceilingGap,
    floor_gap: floorGap,
    rank_correlation: rankCorrelation,
    recommendation,
    details,
  };
}
