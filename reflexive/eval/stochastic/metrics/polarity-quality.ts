export interface PolarityMetrics {
  coverage_rate: number;
  consistency_rate: number;
  false_positive_rate: number;
}

export interface PolarityLabel {
  claim_id: string;
  true_polarity: 'positive' | 'negative' | 'neutral';
  extracted_polarity: 'positive' | 'negative' | 'neutral';
}

export function computePolarityMetrics(labels: PolarityLabel[] | null): PolarityMetrics | null {
  if (!labels || labels.length === 0) {
    return null;
  }

  let correct = 0;
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  let falsePositives = 0;

  for (const label of labels) {
    if (label.true_polarity === label.extracted_polarity) {
      correct++;
    }
    
    if (label.extracted_polarity === 'positive') totalPositive++;
    if (label.extracted_polarity === 'negative') totalNegative++;
    if (label.extracted_polarity === 'neutral') totalNeutral++;
    
    if (label.extracted_polarity === 'positive' && label.true_polarity !== 'positive') {
      falsePositives++;
    }
  }

  return {
    coverage_rate: labels.length > 0 ? (totalPositive + totalNegative + totalNeutral) / labels.length : 0,
    consistency_rate: labels.length > 0 ? correct / labels.length : 0,
    false_positive_rate: totalPositive > 0 ? falsePositives / totalPositive : 0,
  };
}
