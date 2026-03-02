/**
 * Compatibility Matrix
 * 
 * Generates compatibility matrix report for vault concepts.
 * 
 * Version: 1.0.0
 */

import { ConceptCard } from '../../contracts/types/ConceptCard';
import { readAllConcepts } from './Storage';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Compatibility matrix entry.
 */
export interface CompatibilityEntry {
  /** Concept ID@version */
  concept_id: string;
  /** Repr schema version */
  repr_schema_version: string | { min: string; max: string };
  /** DSL grammar version */
  dsl_grammar_version: string | { min: string; max: string };
  /** Last validated on task */
  last_validated_on?: string;
  /** Status */
  status: string;
}

/**
 * Compatibility matrix report.
 */
export interface CompatibilityMatrix {
  /** Generated timestamp */
  generated_at: string;
  /** Entries */
  entries: CompatibilityEntry[];
  /** Summary */
  summary: {
    total_concepts: number;
    active_count: number;
    deprecated_count: number;
    suppressed_count: number;
  };
}

/**
 * Generates compatibility matrix report.
 */
export async function generateCompatibilityMatrix(
  vaultRoot: string
): Promise<CompatibilityMatrix> {
  const concepts = await readAllConcepts(vaultRoot);
  const entries: CompatibilityEntry[] = [];

  let activeCount = 0;
  let deprecatedCount = 0;
  let suppressedCount = 0;

  for (const concept of concepts) {
    const conceptId = `${concept.id}@${concept.version}`;
    const status = concept.status || 'ACTIVE';

    if (status === 'ACTIVE') activeCount++;
    else if (status === 'DEPRECATED') deprecatedCount++;
    else if (status === 'SUPPRESSED') suppressedCount++;

    const lastValidatedOn = concept.provenance.validated_on.length > 0
      ? concept.provenance.validated_on[concept.provenance.validated_on.length - 1]
      : undefined;

    entries.push({
      concept_id: conceptId,
      repr_schema_version: concept.compatibility.repr_schema_version,
      dsl_grammar_version: concept.compatibility.dsl_grammar_version,
      last_validated_on: lastValidatedOn,
      status
    });
  }

  // Sort by concept_id for determinism
  entries.sort((a, b) => a.concept_id.localeCompare(b.concept_id));

  const matrix: CompatibilityMatrix = {
    generated_at: new Date().toISOString(),
    entries,
    summary: {
      total_concepts: concepts.length,
      active_count: activeCount,
      deprecated_count: deprecatedCount,
      suppressed_count: suppressedCount
    }
  };

  return matrix;
}

/**
 * Writes compatibility matrix report to disk.
 */
export async function writeCompatibilityMatrix(
  vaultRoot: string,
  outputPath?: string
): Promise<void> {
  const matrix = await generateCompatibilityMatrix(vaultRoot);
  const reportPath = outputPath || join(vaultRoot, 'reports', 'compatibility_matrix.json');

  // Ensure reports directory exists
  const reportsDir = join(vaultRoot, 'reports');
  await require('fs/promises').mkdir(reportsDir, { recursive: true });

  await writeFile(reportPath, JSON.stringify(matrix, null, 2), 'utf8');
}























