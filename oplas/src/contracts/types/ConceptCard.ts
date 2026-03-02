/**
 * Concept Card Types
 * 
 * Concept card structure for vault.
 * 
 * Version: 1.0.0
 */

import { InvariantTag } from '../enums/InvariantTags';

/**
 * SignatureSpec: Signature specification for retrieval.
 */
export interface SignatureSpec {
  /** Symbolic keys (graph type, detected transforms, invariants) */
  keys: string[];
  /** Optional predicate DSL */
  predicate_dsl?: string;
}

/**
 * TemplateSpec: Parameterized DSL template.
 */
export interface TemplateSpec {
  /** Template DSL source */
  template_dsl: string;
  /** Parameter names */
  params: string[];
}

/**
 * CounterexampleRef: Reference to a counterexample.
 */
export interface CounterexampleRef {
  /** Task ID */
  task_id: string;
  /** Representation ID */
  repr_id: string;
  /** Reason code */
  reason_code: string;
  /** Trace ID */
  trace_id: string;
}

/**
 * ConceptProvenance: Provenance for concept card.
 */
export interface ConceptProvenance {
  /** Tasks that introduced this concept */
  introduced_by: string[];
  /** Tasks that validated this concept */
  validated_on: string[];
  /** Tasks that invalidated this concept */
  invalidated_on: Array<{
    task_id: string;
    trace_id: string;
    reason_code: string;
  }>;
}

/**
 * Concept status.
 */
export enum ConceptStatus {
  /** Active concept (default) */
  ACTIVE = 'ACTIVE',
  /** Deprecated concept (use only if no ACTIVE matches) */
  DEPRECATED = 'DEPRECATED',
  /** Suppressed concept (excluded from retrieval) */
  SUPPRESSED = 'SUPPRESSED'
}

/**
 * Deprecation reason code.
 */
export enum DeprecationReasonCode {
  /** Superseded by newer version */
  SUPERSEDED = 'SUPERSEDED',
  /** Failed on own validation tasks */
  FAILED_VALIDATION = 'FAILED_VALIDATION',
  /** Too many Tier 4 generalization failures */
  TIER4_FAILURES = 'TIER4_FAILURES',
  /** Manual deprecation */
  MANUAL = 'MANUAL'
}

/**
 * ConceptCard: Concept card structure.
 */
export interface ConceptCard {
  /** Concept ID */
  id: string;
  /** Version */
  version: string;
  /** Signature for retrieval */
  signature: SignatureSpec;
  /** Parameterized template */
  template: TemplateSpec;
  /** Proof obligations */
  proof_obligations: InvariantTag[];
  /** Counterexamples */
  counterexamples: CounterexampleRef[];
  /** Provenance */
  provenance: ConceptProvenance;
  /** Compatibility */
  compatibility: {
    /** Compatible repr schema version range */
    repr_schema_version: string | { min: string; max: string };
    /** Compatible DSL grammar version range */
    dsl_grammar_version: string | { min: string; max: string };
  };
  /** Status (default: ACTIVE) */
  status?: ConceptStatus;
  /** Deprecation reason code (if deprecated) */
  deprecation_reason_code?: DeprecationReasonCode;
  /** Superseded by concept ID@version (if deprecated) */
  superseded_by?: string;
  /** Suppressed for specific key fingerprints (if suppressed) */
  suppressed_for_keys?: string[];
}

/**
 * Invariants:
 * - Write-back only allowed if verifier tiers >=2 pass (and later invariance checks)
 * - Conflicts -> fork new version; never overwrite old
 */

