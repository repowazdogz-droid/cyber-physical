export interface LensMetrics {
  lens_name: string;
  parse_rate: number;
  mean_claim_count: number;
  claim_validity_rate: number;
  repair_rate: number;
  invalidity_rate: number;
}

export interface RunData {
  stimulus_id: string;
  run_number: number;
  lens_results: {
    lens_id: string;
    lens_name: string;
    success: boolean;
    claims: {
      id: string;
      validity: 'strict' | 'repaired' | 'invalid';
    }[];
  }[];
  engine_output?: any;
  duration_ms: number;
}

export function computeLensMetrics(runs: RunData[]): Record<string, LensMetrics> {
  const lensMap = new Map<string, {
    invocations: number;
    successes: number;
    totalClaims: number;
    strictValid: number;
    repaired: number;
    invalid: number;
  }>();

  for (const run of runs) {
    for (const lensResult of run.lens_results) {
      const lensId = lensResult.lens_id;
      if (!lensMap.has(lensId)) {
        lensMap.set(lensId, {
          invocations: 0,
          successes: 0,
          totalClaims: 0,
          strictValid: 0,
          repaired: 0,
          invalid: 0,
        });
      }

      const stats = lensMap.get(lensId)!;
      stats.invocations++;
      if (lensResult.success) {
        stats.successes++;
        stats.totalClaims += lensResult.claims.length;
        for (const claim of lensResult.claims) {
          if (claim.validity === 'strict') stats.strictValid++;
          else if (claim.validity === 'repaired') stats.repaired++;
          else if (claim.validity === 'invalid') stats.invalid++;
        }
      }
    }
  }

  const result: Record<string, LensMetrics> = {};
  for (const [lensId, stats] of lensMap.entries()) {
    const lensName = runs.find(r => r.lens_results.find(lr => lr.lens_id === lensId))?.lens_results.find(lr => lr.lens_id === lensId)?.lens_name || lensId;
    const totalClaims = stats.strictValid + stats.repaired + stats.invalid;
    
    result[lensId] = {
      lens_name: lensName,
      parse_rate: stats.invocations > 0 ? stats.successes / stats.invocations : 0,
      mean_claim_count: stats.successes > 0 ? stats.totalClaims / stats.successes : 0,
      claim_validity_rate: totalClaims > 0 ? stats.strictValid / totalClaims : 0,
      repair_rate: totalClaims > 0 ? stats.repaired / totalClaims : 0,
      invalidity_rate: totalClaims > 0 ? stats.invalid / totalClaims : 0,
    };
  }

  return result;
}
