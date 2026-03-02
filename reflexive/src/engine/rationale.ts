import type { ConfidenceBreakdown } from './types.js';

/**
 * Generate confidence rationale from breakdown.
 * Artifact 04 §6.9
 */
export function generateRationale(breakdown: ConfidenceBreakdown, theme_count: number): string {
  const score = breakdown.final_score;
  
  // Determine band
  let band: string;
  if (score < 0.40) {
    band = 'Low';
  } else if (score < 0.70) {
    band = 'Moderate';
  } else if (score < 0.90) {
    band = 'High';
  } else {
    band = 'Very High';
  }
  
  // Build rationale using template from §6.9
  const parts: string[] = [];
  
  parts.push(`Confidence: ${band} (${(score * 100).toFixed(1)}%)`);
  
  // Agreement factor
  if (breakdown.agreement_factor > 0.5) {
    parts.push(`Strong agreement across lenses (${(breakdown.agreement_factor * 100).toFixed(1)}%)`);
  } else if (breakdown.agreement_factor > 0.2) {
    parts.push(`Moderate agreement (${(breakdown.agreement_factor * 100).toFixed(1)}%)`);
  } else {
    parts.push(`Limited agreement (${(breakdown.agreement_factor * 100).toFixed(1)}%)`);
  }
  
  // Evidence density
  if (breakdown.evidence_density_factor > 0.5) {
    parts.push(`Well-evidenced claims (${(breakdown.evidence_density_factor * 100).toFixed(1)}% density)`);
  } else if (breakdown.evidence_density_factor > 0.2) {
    parts.push(`Moderate evidence (${(breakdown.evidence_density_factor * 100).toFixed(1)}% density)`);
  } else {
    parts.push(`Sparse evidence (${(breakdown.evidence_density_factor * 100).toFixed(1)}% density)`);
  }
  
  // Unsupported penalty
  if (breakdown.unsupported_penalty > 0.1) {
    parts.push(`Some unsupported claims penalize confidence`);
  }
  
  // Divergence penalty
  if (breakdown.divergence_penalty > 0.2) {
    parts.push(`Significant contradictions reduce confidence`);
  } else if (breakdown.divergence_penalty > 0.05) {
    parts.push(`Minor contradictions noted`);
  }
  
  // Lens count factor
  if (breakdown.lens_count_factor < 0.8) {
    parts.push(`Incomplete lens coverage (${(breakdown.lens_count_factor * 100).toFixed(0)}%)`);
  }
  
  // Warnings
  if (breakdown.low_evidence_warning) {
    parts.push(`⚠ Low evidence density warning`);
  }
  if (breakdown.high_contradiction_warning) {
    parts.push(`⚠ High contradiction warning`);
  }
  
  return parts.join('. ') + '.';
}
