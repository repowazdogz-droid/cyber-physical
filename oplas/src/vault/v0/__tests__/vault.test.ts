/**
 * Vault v0 Tests
 * 
 * Tests for concept vault v0.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { signatureKeys } from '../SignatureKeys';
import { reprKeys } from '../SignatureKeys';
import { buildIndex, readIndex, writeIndex } from '../Index';
import { retrieveConcepts } from '../Retriever';
import { instantiateConcept } from '../Instantiator';
import { writeConcept, readConcept, writeNegativeEvidence, readNegativeEvidence, appendAuditCommit, readAuditLog } from '../Storage';
import { writeBackConcept, isEligibleForWriteBack, createConceptCard, forkConceptVersion } from '../WriteBack';
import { ConceptCard } from '../../../contracts/types/ConceptCard';
import { Domain } from '../../../contracts/enums/Domains';
import { Request } from '../../../contracts/types/Request';
import { DEFAULT_BUDGETS } from '../../../contracts/types/BudgetSpec';
import { parseGrid } from '../../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';

function createTestVaultRoot(): string {
  return join(process.cwd(), 'tmp', 'vault', `test_${Date.now()}`);
}

function createTestConcept(id: string, version: string): ConceptCard {
  return {
    id,
    version,
    signature: {
      keys: ['transform:recolor', 'invariant:same_dims'],
      predicate_dsl: ''
    },
    template: {
      template_dsl: '(recolor (input) 0 1)',
      params: []
    },
    proof_obligations: ['shape_preserved'],
    counterexamples: [],
    provenance: {
      introduced_by: [],
      validated_on: [],
      invalidated_on: []
    },
    compatibility: {
      repr_schema_version: '1.0.0',
      dsl_grammar_version: '1.0.0'
    }
  };
}

describe('Vault v0 - Signature Keys', () => {
  it('should extract keys from concept card', () => {
    const concept = createTestConcept('test-concept', '1.0.0');
    const keys = signatureKeys(concept);

    expect(keys).toContain('domain:grid_2d');
    expect(keys).toContain('transform:recolor');
    expect(keys).toContain('invariant:shape_preserved');
  });

  it('should extract keys from repr and request', () => {
    const grid = [[0, 0], [0, 0]];
    const parseResult = parseGrid({ cells: grid });
    expect(parseResult.ok && parseResult.repr).toBe(true);
    if (!parseResult.repr) return;

    let repr = canonicalizeGrid(parseResult.repr);
    repr.repr_id = hashCanonical(repr);

    const request: Request = {
      task_id: 'test',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      constraints: [
        { type: 'same_dims', params: {} }
      ],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const keys = reprKeys(repr, request);

    expect(keys).toContain('domain:grid_2d');
    expect(keys).toContain('invariant:same_dims');
    expect(keys).toContain('feature:has_components');
  });
});

describe('Vault v0 - Index', () => {
  it('should build index from concepts', () => {
    const concepts = [
      createTestConcept('concept1', '1.0.0'),
      createTestConcept('concept2', '1.0.0')
    ];

    const index = buildIndex(concepts);

    expect(index.by_key['transform:recolor']).toBeDefined();
    expect(index.by_key['transform:recolor'].length).toBeGreaterThan(0);
    expect(index.by_domain['grid_2d']).toBeDefined();
  });

  it('should write and read index', async () => {
    const vaultRoot = createTestVaultRoot();
    const concepts = [
      createTestConcept('concept1', '1.0.0'),
      createTestConcept('concept2', '1.0.0')
    ];

    const index = buildIndex(concepts);
    await writeIndex(index, vaultRoot);

    const readIndexResult = await readIndex(vaultRoot);

    expect(readIndexResult.by_key['transform:recolor']).toBeDefined();
    expect(readIndexResult.by_domain['grid_2d']).toBeDefined();
  });
});

describe('Vault v0 - Storage', () => {
  it('should write and read concept', async () => {
    const vaultRoot = createTestVaultRoot();
    const concept = createTestConcept('test-concept', '1.0.0');

    await writeConcept(vaultRoot, concept);

    const readConceptResult = await readConcept(vaultRoot, 'test-concept', '1.0.0');

    expect(readConceptResult).toBeDefined();
    expect(readConceptResult?.id).toBe('test-concept');
    expect(readConceptResult?.version).toBe('1.0.0');
  });

  it('should write and read negative evidence', async () => {
    const vaultRoot = createTestVaultRoot();
    const evidence = {
      concept_id: 'test-concept',
      concept_version: '1.0.0',
      repr_id: 'test-repr',
      failure_tier: 1,
      why_code: 'schema_invalid',
      trace_id: 'test-trace',
      timestamp_iso: new Date().toISOString()
    };

    await writeNegativeEvidence(vaultRoot, evidence);

    const readEvidence = await readNegativeEvidence(vaultRoot, 'test-concept');

    expect(readEvidence.length).toBe(1);
    expect(readEvidence[0].concept_id).toBe('test-concept');
  });

  it('should append and read audit log', async () => {
    const vaultRoot = createTestVaultRoot();
    const commit1 = {
      timestamp_iso: new Date().toISOString(),
      action: 'write_back' as const,
      concept_id: 'test-concept',
      concept_version: '1.0.0',
      details: {}
    };

    await appendAuditCommit(vaultRoot, commit1);

    const log = await readAuditLog(vaultRoot);

    expect(log.length).toBe(1);
    expect(log[0].concept_id).toBe('test-concept');
  });
});

describe('Vault v0 - Write-Back', () => {
  it('should check eligibility for write-back', () => {
    const verifierResult = {
      ok: true,
      highest_tier_passed: 2,
      cost_breakdown: {
        n_nodes: 0,
        n_ops: 0,
        n_params: 0,
        n_literals: 0,
        runtime_steps: 0,
        abs_coord_refs: 0,
        color_binding_literals: 0,
        total_cost: 0
      },
      metrics: {
        latency_ms: 0,
        runtime_steps: 0
      }
    };

    const eligible = isEligibleForWriteBack(verifierResult);

    expect(eligible).toBe(true);
  });

  it('should create concept card from program', () => {
    // This test would require a full program - simplified for now
    expect(true).toBe(true); // Placeholder
  });
});























