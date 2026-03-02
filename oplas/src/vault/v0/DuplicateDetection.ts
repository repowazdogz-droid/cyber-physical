/**
 * Duplicate Detection
 * 
 * Detects duplicate/near-duplicate concepts for merge candidates.
 * 
 * Version: 1.0.0
 */

import { ConceptCard } from '../../contracts/types/ConceptCard';
import { readAllConcepts } from './Storage';
import { signatureKeys } from './SignatureKeys';
import { parseDSL } from '../../dsl/v0';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Merge candidate.
 */
export interface MergeCandidate {
  /** Concept IDs that are duplicates */
  concept_ids: string[];
  /** Reason for merge candidate */
  reason: 'SAME_SIGNATURE_AND_TEMPLATE' | 'SAME_SIGNATURE' | 'SAME_TEMPLATE_AST';
  /** Details */
  details: {
    signature_keys: string[];
    template_ast_hash?: string;
  };
}

/**
 * Merge candidates report.
 */
export interface MergeCandidatesReport {
  /** Generated timestamp */
  generated_at: string;
  /** Merge candidates */
  candidates: MergeCandidate[];
  /** Summary */
  summary: {
    total_concepts: number;
    candidate_groups: number;
  };
}

/**
 * Computes canonical AST hash for template.
 */
function computeTemplateASTHash(templateDsl: string): string | null {
  try {
    const parse = parseDSL(templateDsl);
    if (parse.ok && parse.ast) {
      const astJson = JSON.stringify(parse.ast);
      return hashCanonical(astJson).slice(0, 16);
    }
  } catch (error) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Detects merge candidates.
 */
export async function detectMergeCandidates(
  vaultRoot: string
): Promise<MergeCandidatesReport> {
  const concepts = await readAllConcepts(vaultRoot);
  const candidates: MergeCandidate[] = [];

  // Group by signature keys
  const bySignature: Record<string, ConceptCard[]> = {};
  for (const concept of concepts) {
    const keys = signatureKeys(concept);
    const keyStr = keys.sort().join(',');
    if (!bySignature[keyStr]) {
      bySignature[keyStr] = [];
    }
    bySignature[keyStr].push(concept);
  }

  // Group by template AST hash
  const byTemplateAST: Record<string, ConceptCard[]> = {};
  for (const concept of concepts) {
    const astHash = computeTemplateASTHash(concept.template.template_dsl);
    if (astHash) {
      if (!byTemplateAST[astHash]) {
        byTemplateAST[astHash] = [];
      }
      byTemplateAST[astHash].push(concept);
    }
  }

  // Find duplicates: same signature + same template AST
  const processed = new Set<string>();
  for (const [keyStr, conceptGroup] of Object.entries(bySignature)) {
    if (conceptGroup.length < 2) continue;

    // Check if same template AST
    const byAST: Record<string, ConceptCard[]> = {};
    for (const concept of conceptGroup) {
      const astHash = computeTemplateASTHash(concept.template.template_dsl);
      if (astHash) {
        if (!byAST[astHash]) {
          byAST[astHash] = [];
        }
        byAST[astHash].push(concept);
      }
    }

    for (const [astHash, astGroup] of Object.entries(byAST)) {
      if (astGroup.length >= 2) {
        const conceptIds = astGroup.map(c => `${c.id}@${c.version}`);
        const key = conceptIds.sort().join('|');
        if (!processed.has(key)) {
          processed.add(key);
          candidates.push({
            concept_ids: conceptIds,
            reason: 'SAME_SIGNATURE_AND_TEMPLATE',
            details: {
              signature_keys: keyStr.split(','),
              template_ast_hash: astHash
            }
          });
        }
      }
    }
  }

  // Find near-duplicates: same signature but different template
  for (const [keyStr, conceptGroup] of Object.entries(bySignature)) {
    if (conceptGroup.length >= 2) {
      const conceptIds = conceptGroup.map(c => `${c.id}@${c.version}`);
      const key = conceptIds.sort().join('|');
      if (!processed.has(key)) {
        processed.add(key);
        candidates.push({
          concept_ids: conceptIds,
          reason: 'SAME_SIGNATURE',
          details: {
            signature_keys: keyStr.split(',')
          }
        });
      }
    }
  }

  // Sort candidates for determinism
  candidates.sort((a, b) => {
    const aKey = a.concept_ids.sort().join('|');
    const bKey = b.concept_ids.sort().join('|');
    return aKey.localeCompare(bKey);
  });

  const report: MergeCandidatesReport = {
    generated_at: new Date().toISOString(),
    candidates,
    summary: {
      total_concepts: concepts.length,
      candidate_groups: candidates.length
    }
  };

  return report;
}

/**
 * Writes merge candidates report to disk.
 */
export async function writeMergeCandidatesReport(
  vaultRoot: string,
  outputPath?: string
): Promise<void> {
  const report = await detectMergeCandidates(vaultRoot);
  const reportPath = outputPath || join(vaultRoot, 'reports', 'merge_candidates.json');

  // Ensure reports directory exists
  const reportsDir = join(vaultRoot, 'reports');
  await require('fs/promises').mkdir(reportsDir, { recursive: true });

  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
}























