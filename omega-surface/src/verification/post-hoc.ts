/**
 * Post-hoc verification — verify AFTER generation, don't bias BEFORE.
 *
 * Design rule: "Reasoning stays independent; then you ground only
 * the claims that matter and upgrade or flag sourcing."
 *
 * This is the opposite of RAG. RAG biases generation with retrieved context.
 * Post-hoc verifies claims against evidence after generation is complete.
 */

import type { VerificationResult } from './types.js';

export interface Claim {
  id: string;
  text: string;
  source_stage: string;
  verifiable: boolean;
}

export interface PostHocSummary {
  results: VerificationResult[];
  coverage: number;
  phantom_count: number;
  summary: {
    verified: number;
    unverified: number;
    contradicted: number;
    phantom: number;
  };
}

/**
 * Verify a list of claims post-hoc.
 * verifier is a function that checks a single claim — inject your own
 * (web search, database lookup, citation check, etc.)
 */
export async function verifyClaimsPostHoc(
  claims: Claim[],
  verifier: (claim: Claim) => Promise<VerificationResult>
): Promise<PostHocSummary> {
  const verifiable = claims.filter((c) => c.verifiable);
  const results: VerificationResult[] = [];

  for (const claim of verifiable) {
    results.push(await verifier(claim));
  }

  for (const claim of claims.filter((c) => !c.verifiable)) {
    results.push({
      claim_id: claim.id,
      status: 'unverified',
      confidence: 0,
    });
  }

  const verified = results.filter((r) => r.status === 'verified').length;
  const phantom = results.filter((r) => r.status === 'phantom').length;

  return {
    results,
    coverage: verifiable.length > 0 ? verified / verifiable.length : 0,
    phantom_count: phantom,
    summary: {
      verified,
      unverified: results.filter((r) => r.status === 'unverified').length,
      contradicted: results.filter((r) => r.status === 'contradicted').length,
      phantom,
    },
  };
}
