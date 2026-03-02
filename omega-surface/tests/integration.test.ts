import { describe, it, expect } from 'vitest';
import {
  createEnvelope,
  sealEnvelope,
  verifyEnvelope,
  canonicalise,
  sha256,
  buildChain,
  merkleRoot,
  createRoomSurface,
  createTerminalSurface,
  verifyClaimsPostHoc,
  recomputeChain,
  detectTamper,
  exportAsJson,
  classifyToOntologyState,
} from '../src/index.js';
import type { GenerationAudit } from '../src/artifact/types.js';

describe('Integration: full round-trip create → seal → verify → tamper → detect', () => {
  it('sealed artifact verifies; after tamper verify fails and detectTamper reports tampered', async () => {
    const ontology = classifyToOntologyState([
      {
        id: 's1',
        label: 'Structure',
        description: 'Main entity',
        layer: 'structure',
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

    const unsealed = createEnvelope(
      'reflexive-synthesis',
      { thesis: 'Example thesis', claims: [] },
      ontology
    );
    const chainItems = [
      { node_type: 'OBSERVE' as const, content: { input: 'query' } },
      { node_type: 'DERIVE' as const, content: { step: 1 } },
      { node_type: 'DECIDE' as const, content: { conclusion: 'x' } },
    ];
    const sealed = await sealEnvelope(unsealed, chainItems, audit, [
      'Single run only',
    ]);

    let verifyResult = await verifyEnvelope(sealed);
    expect(verifyResult.valid).toBe(true);

    const json = exportAsJson(sealed);
    const parsed = JSON.parse(json);
    expect(parsed.artifact_id).toBe(sealed.artifact_id);

    // Tamper: change content
    const tampered = {
      ...sealed,
      content: { thesis: 'Tampered thesis', claims: [] },
    };
    verifyResult = await verifyEnvelope(tampered);
    expect(verifyResult.valid).toBe(false);

    const tamperResult = await detectTamper(tampered);
    expect(tamperResult.tampered).toBe(true);
    expect(tamperResult.errors.length).toBeGreaterThan(0);
  });

  it('Room and Terminal surfaces are independent of envelope', () => {
    const room = createRoomSurface('Constraint Room');
    const terminal = createTerminalSurface(
      'Decision Engine',
      [
        { id: '1', label: 'Assess', order: 1, type: 'generation', deterministic: false },
        { id: '2', label: 'Verify', order: 2, type: 'verification', deterministic: true },
      ]
    );
    expect(room.execution).toBe(false);
    expect(terminal.integrity.hash_chain).toBe(true);
  });

  it('verifyClaimsPostHoc with stub verifier', async () => {
    const summary = await verifyClaimsPostHoc(
      [
        { id: '1', text: 'Claim', source_stage: 's1', verifiable: true },
      ],
      async (c) => ({
        claim_id: c.id,
        status: 'verified',
        confidence: 0.9,
      })
    );
    expect(summary.summary.verified).toBe(1);
    expect(summary.coverage).toBe(1);
  });
});
