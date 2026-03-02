import { createRequire } from 'node:module';
import { canonicalise } from './canonical.js';

const require = createRequire(import.meta.url);

function randomUUID(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof (globalThis.crypto as { randomUUID?: () => string }).randomUUID ===
      'function'
  ) {
    return (globalThis.crypto as { randomUUID: () => string }).randomUUID();
  }
  return (require('node:crypto') as { randomUUID: () => string }).randomUUID();
}
import { sha256, buildChain, merkleRoot } from './hash.js';
import type {
  ArtifactEnvelope,
  IntegrityBlock,
  GenerationAudit,
  ChainLink,
} from './types.js';
import type { OntologyState } from '../ontology/types.js';

export type ChainItemInput = {
  node_type: ChainLink['node_type'];
  content: unknown;
};

export type UnsealedEnvelope<T> = Omit<ArtifactEnvelope<T>, '_integrity'> & {
  _integrity?: undefined;
};

/**
 * Create an unsealed envelope (no integrity block yet).
 */
export function createEnvelope<T>(
  artifact_type: string,
  content: T,
  ontology: OntologyState,
  schema_version: string = '1.0.0'
): UnsealedEnvelope<T> {
  return {
    artifact_id: randomUUID(),
    artifact_type,
    schema_version,
    created_at: new Date().toISOString(),
    content,
    ontology,
  };
}

/**
 * Seal an envelope — compute hashes, build chain, create integrity block.
 * After sealing, any change to content invalidates the seal.
 */
export async function sealEnvelope<T>(
  envelope: UnsealedEnvelope<T>,
  chain_items: ChainItemInput[],
  audit: GenerationAudit,
  known_limitations: string[] = []
): Promise<ArtifactEnvelope<T>> {
  const content_hash = await sha256(canonicalise(envelope.content));
  const chain = await buildChain(chain_items);
  const root = await merkleRoot(chain);

  const integrity: IntegrityBlock = {
    version: 'omega-surface-1.0',
    sealed_at: new Date().toISOString(),
    content_hash,
    chain,
    merkle_root: root,
    known_limitations,
    generation_audit: audit,
  };

  return { ...envelope, _integrity: integrity };
}

/**
 * Verify an envelope's integrity.
 * Returns { valid, errors } — errors describe what's broken.
 */
export async function verifyEnvelope<T>(
  envelope: ArtifactEnvelope<T>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const expected_hash = await sha256(canonicalise(envelope.content));
  if (expected_hash !== envelope._integrity.content_hash) {
    errors.push(
      `Content hash mismatch: expected ${expected_hash}, got ${envelope._integrity.content_hash}`
    );
  }

  const chain = envelope._integrity.chain;
  for (let i = 0; i < chain.length; i++) {
    const expected_prev = i === 0 ? '0' : chain[i - 1].content_hash;
    if (chain[i].prev_hash !== expected_prev) {
      errors.push(`Chain break at index ${i}: prev_hash mismatch`);
    }
  }

  const expected_root = await merkleRoot(chain);
  if (expected_root !== envelope._integrity.merkle_root) {
    errors.push(
      `Merkle root mismatch: expected ${expected_root}, got ${envelope._integrity.merkle_root}`
    );
  }

  return { valid: errors.length === 0, errors };
}
