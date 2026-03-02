import { describe, it, expect } from 'vitest';
import { verifyEnvelope } from '../src/artifact/envelope.js';
import { createEnvelope, sealEnvelope } from '../src/artifact/envelope.js';
import { recomputeChain, detectTamper } from '../src/verification/integrity-check.js';
import { classifyToOntologyState } from '../src/ontology/classify.js';
import type { GenerationAudit } from '../src/artifact/types.js';

const ontology = classifyToOntologyState([]);
const audit: GenerationAudit = {
  deterministic_modules: [],
  llm_modules: [],
  verification_status: 'verified',
  verified_claims: 0,
  unverified_claims: 0,
  flagged_claims: 0,
};

describe('integrity-check', () => {
  it('recomputeChain returns valid for sealed envelope', async () => {
    const unsealed = createEnvelope('test', { x: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const result = await recomputeChain(sealed);
    expect(result.valid).toBe(true);
    expect(result.content_hash_match).toBe(true);
    expect(result.chain_valid).toBe(true);
    expect(result.merkle_root_match).toBe(true);
    expect(result.first_broken_index).toBe(null);
  });

  it('detectTamper returns tampered when content changed', async () => {
    const unsealed = createEnvelope('test', { a: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const tampered = { ...sealed, content: { a: 2 } };
    const result = await detectTamper(tampered);
    expect(result.tampered).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('detectTamper returns not tampered for valid envelope', async () => {
    const unsealed = createEnvelope('test', { a: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const result = await detectTamper(sealed);
    expect(result.tampered).toBe(false);
    expect(result.first_broken_index).toBe(null);
  });
});
