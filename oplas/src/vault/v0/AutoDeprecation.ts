/**
 * Auto-Deprecation
 * 
 * Automatic deprecation rules for concepts.
 * 
 * Version: 1.0.0
 */

import { ConceptCard, ConceptStatus, DeprecationReasonCode } from '../../contracts/types/ConceptCard';
import { readAllConcepts, writeConcept, appendAuditCommit } from './Storage';
import { AuditCommit } from './types';
import { loadEvidenceIndex, computeKeyFingerprint } from './EvidenceIndex';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';

/**
 * Auto-deprecation configuration.
 */
export interface AutoDeprecationConfig {
  /** Fail Tier 2 on X tasks in validated_on set */
  fail_tier2_threshold?: number;
  /** Accumulate Y Tier 4 failures on same fingerprint */
  tier4_failure_threshold?: number;
}

/**
 * Default auto-deprecation config.
 */
export const DEFAULT_AUTO_DEPRECATION_CONFIG: AutoDeprecationConfig = {
  fail_tier2_threshold: 3,
  tier4_failure_threshold: 5
};

/**
 * Checks if concept should be auto-deprecated.
 */
export async function checkAutoDeprecation(
  concept: ConceptCard,
  vaultRoot: string,
  config: AutoDeprecationConfig = DEFAULT_AUTO_DEPRECATION_CONFIG
): Promise<{
  should_deprecate: boolean;
  reason_code?: DeprecationReasonCode;
}> {
  // Skip if already deprecated or suppressed
  if (concept.status === ConceptStatus.DEPRECATED || concept.status === ConceptStatus.SUPPRESSED) {
    return { should_deprecate: false };
  }

  // Check Tier 2 failures on validated_on tasks
  const validatedOnTasks = concept.provenance.validated_on;
  const invalidatedOnTasks = concept.provenance.invalidated_on;

  if (validatedOnTasks.length > 0) {
    const failureRate = invalidatedOnTasks.length / validatedOnTasks.length;
    const threshold = config.fail_tier2_threshold || 3;
    
    if (invalidatedOnTasks.length >= threshold) {
      return {
        should_deprecate: true,
        reason_code: DeprecationReasonCode.FAILED_VALIDATION
      };
    }
  }

  // Check Tier 4 failures on same fingerprint
  const evidenceIndex = await loadEvidenceIndex(vaultRoot);
  const conceptKey = `${concept.id}@${concept.version}`;
  const stats = evidenceIndex.by_concept[conceptKey];

  if (stats) {
    const tier4Failures = stats.fail_count_by_code[VerifierWhyCode.GENERALIZATION_FAIL_TIER4] || 0;
    const threshold = config.tier4_failure_threshold || 5;

    if (tier4Failures >= threshold) {
      return {
        should_deprecate: true,
        reason_code: DeprecationReasonCode.TIER4_FAILURES
      };
    }
  }

  return { should_deprecate: false };
}

/**
 * Applies auto-deprecation to concepts.
 */
export async function applyAutoDeprecation(
  vaultRoot: string,
  config: AutoDeprecationConfig = DEFAULT_AUTO_DEPRECATION_CONFIG
): Promise<{
  deprecated: string[];
  skipped: string[];
}> {
  const concepts = await readAllConcepts(vaultRoot);
  const deprecated: string[] = [];
  const skipped: string[] = [];

  for (const concept of concepts) {
    const check = await checkAutoDeprecation(concept, vaultRoot, config);

    if (check.should_deprecate) {
      // Update concept status
      const updatedConcept: ConceptCard = {
        ...concept,
        status: ConceptStatus.DEPRECATED,
        deprecation_reason_code: check.reason_code
      };

      await writeConcept(vaultRoot, updatedConcept);

      // Append audit commit
      const commit: AuditCommit = {
        timestamp_iso: new Date().toISOString(),
        action: 'deprecate',
        concept_id: concept.id,
        concept_version: concept.version,
        details: {
          reason: 'auto_deprecation',
          reason_code: check.reason_code
        }
      };

      await appendAuditCommit(vaultRoot, commit);

      deprecated.push(`${concept.id}@${concept.version}`);
    } else {
      skipped.push(`${concept.id}@${concept.version}`);
    }
  }

  return { deprecated, skipped };
}























