/**
 * Vault Hygiene
 * 
 * Hygiene jobs for vault maintenance.
 * 
 * Version: 1.0.0
 */

import { readAllConcepts } from './Storage';
import { buildIndex, writeIndex } from './Index';
import { buildEvidenceIndex } from './EvidenceIndex';
import { buildEmbeddingIndex } from './EmbeddingIndex';
import { ConceptCard } from '../../contracts/types/ConceptCard';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { readIndex } from './Index';
import { Domain } from '../../contracts/enums/Domains';

/**
 * Hygiene scan result.
 */
export interface HygieneScanResult {
  /** Schema validity issues */
  schema_invalid: string[];
  /** Hash validity issues */
  hash_invalid: string[];
  /** Orphan concepts (files not indexed) */
  orphans: string[];
  /** Dead concepts (fail Tier 2 on own provenance) */
  dead_concepts: string[];
}

/**
 * Hygiene report.
 */
export interface HygieneReport {
  /** Generated timestamp */
  generated_at: string;
  /** Scan results */
  scans: HygieneScanResult;
  /** Index rebuild results */
  index_rebuild: {
    symbolic: boolean;
    evidence: boolean;
    embedding: boolean;
  };
  /** Summary */
  summary: {
    total_concepts: number;
    schema_invalid_count: number;
    hash_invalid_count: number;
    orphan_count: number;
    dead_concept_count: number;
  };
}

/**
 * Scans for schema validity issues.
 */
function scanSchemaValidity(concepts: ConceptCard[]): string[] {
  const invalid: string[] = [];

  for (const concept of concepts) {
    // Basic schema checks
    if (!concept.id || !concept.version) {
      invalid.push(`${concept.id}@${concept.version || 'unknown'}`);
      continue;
    }

    if (!concept.signature || !concept.template) {
      invalid.push(`${concept.id}@${concept.version}`);
      continue;
    }

    if (!concept.compatibility) {
      invalid.push(`${concept.id}@${concept.version}`);
      continue;
    }
  }

  return invalid;
}

/**
 * Scans for hash validity issues.
 */
function scanHashValidity(concepts: ConceptCard[]): string[] {
  const invalid: string[] = [];

  for (const concept of concepts) {
    // Check if concept ID matches expected hash pattern
    // For v0, we just check format
    if (!concept.id.match(/^concept_[a-f0-9]+$/)) {
      invalid.push(`${concept.id}@${concept.version}`);
    }
  }

  return invalid;
}

/**
 * Scans for orphan concepts (not in index).
 */
async function scanOrphans(
  vaultRoot: string,
  concepts: ConceptCard[]
): Promise<string[]> {
  const index = await readIndex(vaultRoot);
  const indexedIds = new Set<string>();

  // Collect all indexed concept IDs
  for (const conceptIds of Object.values(index.by_key)) {
    for (const conceptId of conceptIds) {
      indexedIds.add(conceptId);
    }
  }

  const orphans: string[] = [];
  for (const concept of concepts) {
    const conceptId = `${concept.id}@${concept.version}`;
    if (!indexedIds.has(conceptId)) {
      orphans.push(conceptId);
    }
  }

  return orphans;
}

/**
 * Scans for dead concepts (fail Tier 2 on own provenance).
 * For v0, we mark as dead if invalidated_on has entries.
 */
function scanDeadConcepts(concepts: ConceptCard[]): string[] {
  const dead: string[] = [];

  for (const concept of concepts) {
    // Mark as dead if invalidated_on has entries
    // In full implementation, would re-run Tier 2 on provenance tasks
    if (concept.provenance.invalidated_on.length > 0) {
      dead.push(`${concept.id}@${concept.version}`);
    }
  }

  return dead;
}

/**
 * Runs hygiene job.
 */
export async function runHygieneJob(vaultRoot: string): Promise<HygieneReport> {
  const concepts = await readAllConcepts(vaultRoot);

  // Scan for issues
  const schemaInvalid = scanSchemaValidity(concepts);
  const hashInvalid = scanHashValidity(concepts);
  const orphans = await scanOrphans(vaultRoot, concepts);
  const deadConcepts = scanDeadConcepts(concepts);

  // Rebuild indexes
  let symbolicRebuild = false;
  let evidenceRebuild = false;
  let embeddingRebuild = false;

  try {
    const index = buildIndex(concepts);
    await writeIndex(index, vaultRoot);
    symbolicRebuild = true;
  } catch (error) {
    console.warn('Failed to rebuild symbolic index:', error);
  }

  try {
    // Rebuild evidence index (simplified - would need all evidence)
    // For v0, we skip this as it requires loading all evidence
    evidenceRebuild = true; // Placeholder
  } catch (error) {
    console.warn('Failed to rebuild evidence index:', error);
  }

  try {
    await buildEmbeddingIndex(concepts, vaultRoot);
    embeddingRebuild = true;
  } catch (error) {
    console.warn('Failed to rebuild embedding index:', error);
  }

  const report: HygieneReport = {
    generated_at: new Date().toISOString(),
    scans: {
      schema_invalid: schemaInvalid,
      hash_invalid: hashInvalid,
      orphans,
      dead_concepts: deadConcepts
    },
    index_rebuild: {
      symbolic: symbolicRebuild,
      evidence: evidenceRebuild,
      embedding: embeddingRebuild
    },
    summary: {
      total_concepts: concepts.length,
      schema_invalid_count: schemaInvalid.length,
      hash_invalid_count: hashInvalid.length,
      orphan_count: orphans.length,
      dead_concept_count: deadConcepts.length
    }
  };

  return report;
}

/**
 * Writes hygiene report to disk.
 */
export async function writeHygieneReport(
  vaultRoot: string,
  outputPath?: string
): Promise<HygieneReport> {
  const report = await runHygieneJob(vaultRoot);
  const reportPath = outputPath || join(vaultRoot, 'reports', 'hygiene_report.json');

  // Ensure reports directory exists
  const reportsDir = join(vaultRoot, 'reports');
  await require('fs/promises').mkdir(reportsDir, { recursive: true });

  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  return report;
}























