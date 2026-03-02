/**
 * Write-Back
 * 
 * Handles write-back of concept cards to vault.
 * 
 * Version: 1.0.0
 */

import { ConceptCard, ConceptStatus } from '../../contracts/types/ConceptCard';
import { Program } from '../../dsl/v0/types';
import { VerifierResult } from '../../verifier/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { writeConcept } from './Storage';
import { appendAuditCommit } from './Storage';
import { AuditCommit } from './types';
import { buildEmbeddingIndex } from './EmbeddingIndex';
import { readAllConcepts } from './Storage';
// Version constants
const REPR_VERSION = '1.0.0';
const DSL_GRAMMAR_VERSION = '1.0.0';

/**
 * Write-back strictness levels.
 */
export enum WriteBackStrictness {
  /** Tiers 0-2 only (not recommended long-term) */
  LEVEL_0 = 0,
  /** Require Tier 3 palette pass (current default) */
  LEVEL_1 = 1,
  /** Require Tier 3 pass + Tier 4 pass (recommended once Tier 4 stable) */
  LEVEL_2 = 2
}

/**
 * Write-back rules:
 * - candidate program passes verifier tiers 0-2
 * - AND (if enabled) passes Level-0 invariance checks
 * - AND (if strictness >= 2) passes Tier 4 perturbations
 */
export interface WriteBackOptions {
  /** Enable Level-0 invariance checks */
  enable_invariance_checks?: boolean;
  /** Write-back strictness level */
  strictness?: WriteBackStrictness;
}

/**
 * Checks if a program is eligible for write-back.
 */
export function isEligibleForWriteBack(
  verifier_result: VerifierResult,
  options: WriteBackOptions = {}
): boolean {
  const strictness = options.strictness ?? WriteBackStrictness.LEVEL_1;

  // Must pass tiers 0-2
  if (!verifier_result.ok || verifier_result.highest_tier_passed < 2) {
    return false;
  }

  // Level 0: Tiers 0-2 only
  if (strictness === WriteBackStrictness.LEVEL_0) {
    return true;
  }

  // Level 1: Require Tier 3 palette pass
  if (strictness === WriteBackStrictness.LEVEL_1) {
    if (verifier_result.tier3_result) {
      // Palette test must pass for write-back
      if (!verifier_result.tier3_result.palette_test_passed) {
        return false;
      }
    } else if (options.enable_invariance_checks) {
      // Tier 3 was not run but invariance checks are enabled
      return false;
    }
    return true;
  }

  // Level 2: Require Tier 3 pass + Tier 4 pass
  if (strictness === WriteBackStrictness.LEVEL_2) {
    if (verifier_result.tier3_result) {
      // Palette test must pass
      if (!verifier_result.tier3_result.palette_test_passed) {
        return false;
      }
    } else if (options.enable_invariance_checks) {
      return false;
    }

    // Tier 4 must pass
    if (verifier_result.tier4_result) {
      if (!verifier_result.tier4_result.ok) {
        return false;
      }
    } else {
      // Tier 4 was not run - conservative: don't allow write-back
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Creates a concept card from a program and verification result.
 */
export function createConceptCard(
  program: Program,
  verifier_result: VerifierResult,
  repr: CanonicalRepresentation,
  request: Request,
  task_id: string
): ConceptCard {
  // Extract signature keys from program
  const signatureKeys: string[] = [];
  
  // Extract transform keys from program AST
  const astStr = JSON.stringify(program.ast);
  if (astStr.includes('recolor')) {
    signatureKeys.push('transform:recolor');
  }
  if (astStr.includes('crop')) {
    signatureKeys.push('transform:crop');
  }
  if (astStr.includes('select_components')) {
    signatureKeys.push('transform:select');
  }
  if (astStr.includes('mask_from_objects')) {
    signatureKeys.push('transform:mask');
  }
  if (astStr.includes('paste_at')) {
    signatureKeys.push('transform:paste');
  }

  // Extract invariant keys from request constraints
  const proofObligations: string[] = [];
  if (request.constraints) {
    for (const constraint of request.constraints) {
      if (constraint.type === 'same_dims') {
        proofObligations.push('shape_preserved');
      }
      if (constraint.type === 'palette_preserved') {
        proofObligations.push('palette_invariant');
      }
    }
  }

  // Generate concept ID from program hash
  const concept_id = `concept_${program.program_id.slice(0, 16)}`;
  const version = '1.0.0';

  const concept: ConceptCard = {
    id: concept_id,
    version,
    signature: {
      keys: signatureKeys,
      predicate_dsl: '' // Optional
    },
    template: {
      template_dsl: program.dsl_source,
      params: [] // Extract from template if needed
    },
    proof_obligations: proofObligations,
    counterexamples: [],
    provenance: {
      introduced_by: [task_id],
      validated_on: [task_id],
      invalidated_on: []
    },
    compatibility: {
      repr_schema_version: REPR_VERSION,
      dsl_grammar_version: DSL_GRAMMAR_VERSION
    },
    status: ConceptStatus.ACTIVE // Default to ACTIVE
  };

  return concept;
}

/**
 * Writes back a concept card to vault.
 */
export async function writeBackConcept(
  vaultRoot: string,
  concept: ConceptCard,
  task_id: string
): Promise<void> {
  // Write concept card
  await writeConcept(vaultRoot, concept);

  // Append audit commit
  const commit: AuditCommit = {
    timestamp_iso: new Date().toISOString(),
    action: 'write_back',
    concept_id: concept.id,
    concept_version: concept.version,
    details: {
      task_id,
      introduced_by: concept.provenance.introduced_by
    }
  };

  await appendAuditCommit(vaultRoot, commit);

  // Rebuild embedding index (async, don't block)
  try {
    const allConcepts = await readAllConcepts(vaultRoot);
    await buildEmbeddingIndex(allConcepts, vaultRoot);
  } catch (error) {
    // Don't fail write-back if index rebuild fails
    console.warn('Failed to rebuild embedding index:', error);
  }
}

/**
 * Forks a concept to a new version.
 */
export async function forkConceptVersion(
  vaultRoot: string,
  concept: ConceptCard,
  newVersion: string,
  reason: string
): Promise<ConceptCard> {
  const forkedConcept: ConceptCard = {
    ...concept,
    version: newVersion,
    provenance: {
      ...concept.provenance,
      introduced_by: [...concept.provenance.introduced_by]
    }
  };

  await writeConcept(vaultRoot, forkedConcept);

  // Append audit commit
  const commit: AuditCommit = {
    timestamp_iso: new Date().toISOString(),
    action: 'fork_version',
    concept_id: concept.id,
    concept_version: newVersion,
    details: {
      reason,
      forked_from: concept.version
    }
  };

  await appendAuditCommit(vaultRoot, commit);

  return forkedConcept;
}

