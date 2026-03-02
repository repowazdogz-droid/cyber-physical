import { describe, it, expect } from 'vitest';
import { createEnvelope, sealEnvelope, verifyEnvelope } from '../src/artifact/envelope.js';
import { exportAsJson, exportAsJsonPretty } from '../src/export/json.js';
import { exportAsHtml } from '../src/export/html.js';
import { classifyToOntologyState } from '../src/ontology/classify.js';
import type { GenerationAudit } from '../src/artifact/types.js';

const ontology = classifyToOntologyState([]);
const audit: GenerationAudit = {
  deterministic_modules: ['canonical'],
  llm_modules: [],
  verification_status: 'verified',
  verified_claims: 1,
  unverified_claims: 0,
  flagged_claims: 0,
};

describe('export/json', () => {
  it('exportAsJson returns string containing artifact_id and _integrity', async () => {
    const unsealed = createEnvelope('test', { foo: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const json = exportAsJson(sealed);
    expect(json).toContain(sealed.artifact_id);
    expect(json).toContain('_integrity');
    expect(json).toContain('content_hash');
    const parsed = JSON.parse(json);
    expect(parsed.artifact_id).toBe(sealed.artifact_id);
    expect(parsed._integrity).toBeDefined();
  });

  it('exportAsJsonPretty is parseable', async () => {
    const unsealed = createEnvelope('test', { a: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const json = exportAsJsonPretty(sealed);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('export/html', () => {
  it('exportAsHtml returns HTML string with verify script', async () => {
    const unsealed = createEnvelope('test', { x: 1 }, ontology);
    const sealed = await sealEnvelope(
      unsealed,
      [{ node_type: 'STAGE', content: {} }],
      audit
    );
    const html = exportAsHtml(sealed);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(sealed.artifact_type);
    expect(html).toContain('verify-result');
    expect(html).toContain('Verifying');
  });
});
