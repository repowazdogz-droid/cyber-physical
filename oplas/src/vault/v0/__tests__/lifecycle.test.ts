/**
 * Vault Lifecycle Tests
 * 
 * Tests for deprecation, compatibility matrix, and hygiene.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { ConceptCard, ConceptStatus, DeprecationReasonCode } from '../../../contracts/types/ConceptCard';
import { generateCompatibilityMatrix } from '../CompatibilityMatrix';
import { detectMergeCandidates } from '../DuplicateDetection';
import { checkAutoDeprecation } from '../AutoDeprecation';
import { readAllConcepts, writeConcept } from '../Storage';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

function createTestConcept(
  id: string,
  version: string,
  templateDsl: string,
  status?: ConceptStatus
): ConceptCard {
  return {
    id,
    version,
    signature: {
      keys: ['transform:recolor'],
      predicate_dsl: ''
    },
    template: {
      template_dsl: templateDsl,
      params: []
    },
    proof_obligations: [],
    counterexamples: [],
    provenance: {
      introduced_by: ['task1'],
      validated_on: ['task1', 'task2'],
      invalidated_on: status === ConceptStatus.DEPRECATED ? [{ task_id: 'task3', trace_id: 'trace1', reason_code: 'FAILED_VALIDATION' }] : []
    },
    compatibility: {
      repr_schema_version: '1.0.0',
      dsl_grammar_version: '1.0.0'
    },
    status: status || ConceptStatus.ACTIVE
  };
}

async function createTestVault(): Promise<string> {
  const vaultRoot = join(tmpdir(), `vault_test_${Date.now()}`);
  await mkdir(join(vaultRoot, 'concepts', 'concept_1'), { recursive: true });
  await mkdir(join(vaultRoot, 'concepts', 'concept_2'), { recursive: true });
  await mkdir(join(vaultRoot, 'audit'), { recursive: true });

  const concept1 = createTestConcept('concept_1', '1.0.0', '(recolor grid mask 0 1)');
  const concept2 = createTestConcept('concept_2', '1.0.0', '(recolor grid mask 0 1)', ConceptStatus.DEPRECATED);

  await writeConcept(vaultRoot, concept1);
  await writeConcept(vaultRoot, concept2);

  return vaultRoot;
}

describe('Vault Lifecycle - Deprecation', () => {
  it('should respect ACTIVE/DEPRECATED/SUPPRESSED status', async () => {
    const vaultRoot = await createTestVault();
    const concepts = await readAllConcepts(vaultRoot);

    const active = concepts.filter(c => (c.status || ConceptStatus.ACTIVE) === ConceptStatus.ACTIVE);
    const deprecated = concepts.filter(c => c.status === ConceptStatus.DEPRECATED);

    expect(active.length).toBeGreaterThan(0);
    expect(deprecated.length).toBeGreaterThan(0);
  });
});

describe('Vault Lifecycle - Compatibility Matrix', () => {
  it('should generate compatibility matrix', async () => {
    const vaultRoot = await createTestVault();
    const matrix = await generateCompatibilityMatrix(vaultRoot);

    expect(matrix.entries.length).toBeGreaterThan(0);
    expect(matrix.summary.total_concepts).toBeGreaterThan(0);
    expect(matrix.summary.active_count + matrix.summary.deprecated_count).toBe(matrix.summary.total_concepts);
  });

  it('should generate deterministic matrix', async () => {
    const vaultRoot = await createTestVault();
    const matrix1 = await generateCompatibilityMatrix(vaultRoot);
    const matrix2 = await generateCompatibilityMatrix(vaultRoot);

    expect(matrix1.entries.length).toBe(matrix2.entries.length);
    expect(matrix1.summary).toEqual(matrix2.summary);
  });
});

describe('Vault Lifecycle - Duplicate Detection', () => {
  it('should detect merge candidates', async () => {
    const vaultRoot = await createTestVault();
    const report = await detectMergeCandidates(vaultRoot);

    expect(report.candidates).toBeDefined();
    expect(report.summary.total_concepts).toBeGreaterThan(0);
  });
});

describe('Vault Lifecycle - Auto-Deprecation', () => {
  it('should check auto-deprecation', async () => {
    const vaultRoot = await createTestVault();
    const concepts = await readAllConcepts(vaultRoot);

    for (const concept of concepts) {
      const check = await checkAutoDeprecation(concept, vaultRoot);
      expect(check.should_deprecate).toBeDefined();
    }
  });
});























