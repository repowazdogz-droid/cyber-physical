import type { ArtifactEnvelope } from '../artifact/types.js';
import { sha256, merkleRoot } from '../artifact/hash.js';
import { canonicalise } from '../artifact/canonical.js';

export interface RecomputeResult {
  valid: boolean;
  content_hash_match: boolean;
  chain_valid: boolean;
  merkle_root_match: boolean;
  first_broken_index: number | null;
  errors: string[];
}

/**
 * Recompute integrity from envelope content and chain; compare to stored values.
 */
export async function recomputeChain(
  envelope: ArtifactEnvelope<unknown>
): Promise<RecomputeResult> {
  const errors: string[] = [];
  const content_hash = await sha256(canonicalise(envelope.content));
  const content_hash_match = content_hash === envelope._integrity.content_hash;
  if (!content_hash_match) {
    errors.push('Content hash does not match sealed value');
  }

  let first_broken_index: number | null = null;
  const chain = envelope._integrity.chain;
  for (let i = 0; i < chain.length; i++) {
    const expected_prev = i === 0 ? '0' : chain[i - 1].content_hash;
    if (chain[i].prev_hash !== expected_prev) {
      if (first_broken_index === null) first_broken_index = i;
      errors.push(`Chain break at index ${i}: prev_hash mismatch`);
    }
  }
  const chain_valid = first_broken_index === null;

  const expected_root = await merkleRoot(chain);
  const merkle_root_match = expected_root === envelope._integrity.merkle_root;
  if (!merkle_root_match) {
    errors.push('Merkle root does not match sealed value');
  }

  return {
    valid: content_hash_match && chain_valid && merkle_root_match,
    content_hash_match,
    chain_valid,
    merkle_root_match,
    first_broken_index,
    errors,
  };
}

/**
 * Detect tamper: verify envelope and return first broken link index if any.
 */
export async function detectTamper(
  envelope: ArtifactEnvelope<unknown>
): Promise<{ tampered: boolean; first_broken_index: number | null; errors: string[] }> {
  const result = await recomputeChain(envelope);
  return {
    tampered: !result.valid,
    first_broken_index: result.first_broken_index,
    errors: result.errors,
  };
}
