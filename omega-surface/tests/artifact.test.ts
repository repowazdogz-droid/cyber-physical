import { describe, it, expect } from 'vitest';
import {
  createEnvelope,
  sealEnvelope,
  verifyEnvelope,
} from '../src/artifact/envelope.js';
import { classifyToOntologyState } from '../src/ontology/classify.js';
import type { GenerationAudit } from '../src/artifact/types.js';

const now = new Date().toISOString();
const ontology = classifyToOntologyState([
  {
    id: 's1',
    label: 'Item',
    description: 'Desc',
    layer: 'structure',
    source: 'observed',
    relationships: [],
  },
]);

const audit: GenerationAudit = {
  deterministic_modules: ['parser'],
  llm_modules: ['synthesis'],
  verification_status: 'partial',
  verified_claims: 1,
  unverified_claims: 0,
  flagged_claims: 0,
};

describe('createEnvelope', () => {
  it('returns envelope without _integrity', () => {
    const e = createEnvelope('test-type', { foo: 1 }, ontology);
    expect(e.artifact_id).toBeDefined();
    expect(e.artifact_type).toBe('test-type');
    expect(e.content).toEqual({ foo: 1 });
    expect(e.ontology).toBe(ontology);
    expect('_integrity' in e).toBe(false);
  });
});

describe('sealEnvelope / verifyEnvelope', () => {
  it('AT-SURFACE-005: sealEnvelope produces envelope where verifyEnvelope returns valid', async () => {
    const unsealed = createEnvelope('test', { x: 1 }, ontology);
    const chainItems = [
      { node_type: 'OBSERVE' as const, content: { raw: 1 } },
      { node_type: 'DECIDE' as const, content: { decision: 'go' } },
    ];
    const sealed = await sealEnvelope(unsealed, chainItems, audit, [
      'No external API',
    ]);
    const result = await verifyEnvelope(sealed);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('AT-SURFACE-006: modifying sealed envelope content causes verifyEnvelope to return valid false', async () => {
    const unsealed = createEnvelope('test', { x: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const tampered = {
      ...sealed,
      content: { x: 2 },
    };
    const result = await verifyEnvelope(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Content hash'))).toBe(true);
  });

  it('AT-SURFACE-013: envelope with known_limitations survives seal/verify round-trip', async () => {
    const unsealed = createEnvelope('test', { a: 1 }, ontology);
    const limitations = ['Limit A', 'Limit B'];
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit,
      limitations
    );
    expect(sealed._integrity.known_limitations).toEqual(limitations);
    const result = await verifyEnvelope(sealed);
    expect(result.valid).toBe(true);
  });

  it('AT-SURFACE-014: GenerationAudit separates deterministic_modules from llm_modules', async () => {
    const unsealed = createEnvelope('test', {}, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'VERIFY', content: {} }],
      {
        deterministic_modules: ['canonical', 'hash'],
        llm_modules: ['synthesis'],
        verification_status: 'verified',
        verified_claims: 2,
        unverified_claims: 0,
        flagged_claims: 0,
      }
    );
    expect(sealed._integrity.generation_audit.deterministic_modules).toContain(
      'canonical'
    );
    expect(sealed._integrity.generation_audit.llm_modules).toContain('synthesis');
  });
});
