/**
 * SHA-256 hashing with Web Crypto API (browser + Node).
 * Falls back to node:crypto if Web Crypto unavailable.
 */

import type { ChainLink } from './types.js';
import { canonicalise } from './canonical.js';

declare const globalThis: {
  crypto?: {
    subtle?: { digest(alg: string, data: BufferSource): Promise<ArrayBuffer> };
  };
};

export async function sha256(input: string): Promise<string> {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined'
  ) {
    const buf = new TextEncoder().encode(input);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(input).digest('hex');
}

export interface ChainItem {
  node_type: ChainLink['node_type'];
  content: unknown;
}

/**
 * Build a hash chain from content items.
 * Each link's hash includes the previous hash — tamper-evident.
 */
export async function buildChain(
  items: ChainItem[]
): Promise<ChainLink[]> {
  const chain: ChainLink[] = [];
  for (let i = 0; i < items.length; i++) {
    const prev_hash = i === 0 ? '0' : chain[i - 1].content_hash;
    const payload = {
      node_type: items[i].node_type,
      content: items[i].content,
      prev_hash,
    };
    const canonical = canonicalise(payload);
    const content_hash = await sha256(canonical);
    chain.push({
      index: i,
      node_type: items[i].node_type,
      content_hash,
      prev_hash,
      timestamp: new Date().toISOString(),
    });
  }
  return chain;
}

/**
 * Compute Merkle root of a chain for compact verification.
 */
export async function merkleRoot(chain: ChainLink[]): Promise<string> {
  if (chain.length === 0) return await sha256('empty');
  let hashes = chain.map((l) => l.content_hash);
  while (hashes.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const pair =
        i + 1 < hashes.length
          ? hashes[i] + hashes[i + 1]
          : hashes[i] + hashes[i];
      next.push(await sha256(pair));
    }
    hashes = next;
  }
  return hashes[0];
}
